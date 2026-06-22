// Main agent runner - the autonomous scrobble-to-payment loop
import { db } from "@/lib/db"
import { fetchNowPlaying, getRandomTracks, Scrobble } from "./subsonic"
import { resolveArtistByMbId, searchArtistCandidates } from "./musicbrainz"
import { disambiguateArtist } from "./llm"
import { createWallet, createWalletSet, transferUsdc, getWalletBalance, getTransactionHash } from "./circle"

export interface AgentRunResult {
  scrobbleCount: number
  resolvedCount: number
  paymentCount: number
  totalUsdc: number
  log: string[]
}

const DEMO_TRACKS: Scrobble[] = [
  { trackId: "demo-1", title: "Get Lucky", artist: "Daft Punk", albumArtist: "Daft Punk", musicBrainzId: null, playedAt: new Date() },
  { trackId: "demo-2", title: "Redbone", artist: "Childish Gambino", albumArtist: "Childish Gambino", musicBrainzId: null, playedAt: new Date() },
  { trackId: "demo-3", title: "Dreams", artist: "Fleetwood Mac", albumArtist: "Fleetwood Mac", musicBrainzId: null, playedAt: new Date() },
  { trackId: "demo-4", title: "Superstition", artist: "Stevie Wonder", albumArtist: "Stevie Wonder", musicBrainzId: null, playedAt: new Date() },
  { trackId: "demo-5", title: "Lose Yourself", artist: "Eminem", albumArtist: "Eminem", musicBrainzId: null, playedAt: new Date() },
]

export async function runAgent(
  listenerId: string,
  opts?: { forceDemo?: boolean; onLog?: (line: string) => void }
): Promise<AgentRunResult> {
  const log: string[] = []
  // Append to the log and stream the line live if a listener is attached.
  const emit = (line: string) => {
    log[log.length] = line
    opts?.onLog?.(line)
  }
  const startedAt = new Date()

  const listener = await db.listener.findUnique({ where: { id: listenerId } })
  if (!listener) throw new Error(`Listener ${listenerId} not found`)

  emit(`[${new Date().toISOString()}] Agent started for listener ${listenerId}`)

  // Ensure the listener has a Circle wallet for sending payments
  if (!listener.circleWalletId) {
    try {
      await ensureListenerWallet(listenerId)
      emit(`[${new Date().toISOString()}] Listener wallet created`)
    } catch (e) {
      emit(`[${new Date().toISOString()}] Wallet creation skipped: ${e instanceof Error ? e.message : e}`)
    }
  }

  // Try getNowPlaying first (real-time); fall back to random tracks, then demo tracks
  let tracks: Scrobble[] = []
  let source = "demo tracks"

  if (!opts?.forceDemo) {
    try {
      tracks = await fetchNowPlaying(listener.navidromeUrl, listener.navidromeUser, listener.navidromePass)
      source = "getNowPlaying"
    } catch {
      // unreachable - will fall to demo
    }

    if (tracks.length === 0) {
      try {
        tracks = await getRandomTracks(listener.navidromeUrl, listener.navidromeUser, listener.navidromePass, 5)
        source = "getRandomSongs"
      } catch {
        // also unreachable
      }
    }
  }

  if (tracks.length === 0) {
    tracks = DEMO_TRACKS
    source = "demo tracks"
    emit(`[${new Date().toISOString()}] Running with demo tracks`)
  }

  emit(`[${new Date().toISOString()}] Fetched ${tracks.length} tracks via ${source}`)

  // Real now-playing scrobbles get a stable key so re-polling the same play can't pay twice.
  // Synthetic tracks (random/demo) get a per-run key so each manual run still produces payments.
  const isRealScrobble = source === "getNowPlaying"
  const runNonce = startedAt.getTime()

  // Spend cap: sum what's already been paid today so the agent can't overspend.
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const spentTodayAgg = await db.payment.aggregate({
    _sum: { amountUsdc: true },
    where: { listenerId, createdAt: { gte: startOfDay } },
  })
  let spentToday = spentTodayAgg._sum.amountUsdc ?? 0
  const dailyCap = listener.dailyCapUsdc
  emit(`[${new Date().toISOString()}] Daily budget: $${spentToday.toFixed(4)} / $${dailyCap.toFixed(2)} used`)

  let resolvedCount = 0
  let paymentCount = 0
  let totalUsdc = 0
  let skippedCount = 0

  for (const track of tracks) {
    // Stop queuing once the daily cap would be exceeded.
    if (spentToday + listener.ratePerListen > dailyCap) {
      emit(`[${new Date().toISOString()}] Daily cap of $${dailyCap.toFixed(2)} reached — pausing payments`)
      break
    }
    emit(`[${new Date().toISOString()}] Processing: "${track.title}" by ${track.artist}`)

    // Resolve or create artist record
    let artist = await db.artist.findFirst({
      where: {
        OR: [
          ...(track.musicBrainzId ? [{ musicBrainzId: track.musicBrainzId }] : []),
          { name: track.albumArtist },
        ],
      },
    })

    if (!artist) {
      let mbId: string
      let name: string
      let resolvedVia = "MusicBrainz"
      let resolvedNote: string | null = null

      if (track.musicBrainzId) {
        // Navidrome already gave us a canonical MBID — trust it.
        const byId = await resolveArtistByMbId(track.musicBrainzId)
        mbId = byId?.musicBrainzId ?? track.musicBrainzId
        name = byId?.name ?? track.albumArtist
        resolvedVia = "MBID"
        resolvedNote = "Canonical MusicBrainz ID supplied by the track metadata"
        emit(`[${new Date().toISOString()}] Resolved by MBID: ${name}`)
      } else {
        // No MBID — search candidates and let the LLM pick the real performer.
        const candidates = await searchArtistCandidates(track.albumArtist, 5)
        if (candidates.length === 0) {
          mbId = `local-${track.albumArtist.toLowerCase().replace(/\s+/g, "-")}`
          name = track.albumArtist
          resolvedVia = "local"
          resolvedNote = "No MusicBrainz match — tracked under a local id"
          emit(`[${new Date().toISOString()}] No MusicBrainz match for "${track.albumArtist}" — using local id`)
        } else if (candidates.length === 1) {
          mbId = candidates[0].musicBrainzId
          name = candidates[0].name
          resolvedVia = "MusicBrainz"
          resolvedNote = "Single unambiguous MusicBrainz match"
          emit(`[${new Date().toISOString()}] Resolved artist: ${name}`)
        } else {
          emit(`[${new Date().toISOString()}] ${candidates.length} candidates for "${track.albumArtist}" — asking the agent to disambiguate`)
          const decision = await disambiguateArtist({
            trackTitle: track.title,
            artistName: track.albumArtist,
            candidates: candidates.map((c) => ({
              id: c.musicBrainzId,
              name: c.name,
              disambiguation: c.disambiguation,
              type: c.type,
              country: c.country,
              score: c.score,
            })),
          })
          const chosen = candidates.find((c) => c.musicBrainzId === decision.chosenId) ?? candidates[0]
          mbId = chosen.musicBrainzId
          name = chosen.name
          resolvedNote = decision.reasoning
          if (decision.usedLlm) {
            resolvedVia = decision.via ?? "LLM"
            emit(`[${new Date().toISOString()}] ${name} chosen by ${decision.via} — ${decision.reasoning}`)
          } else {
            resolvedVia = "MusicBrainz"
            emit(`[${new Date().toISOString()}] Picked ${name} — ${decision.reasoning}`)
          }
        }
      }

      artist = await db.artist.upsert({
        where: { musicBrainzId: mbId },
        update: {},
        create: { musicBrainzId: mbId, name, resolvedVia, resolvedNote },
      })
      resolvedCount++
    }

    // Build a stable scrobble key. Real plays dedupe per-minute; synthetic tracks are per-run.
    const scrobbleKey = isRealScrobble
      ? `${listenerId}:${track.trackId}:${Math.floor(track.playedAt.getTime() / 60000)}`
      : `${listenerId}:${track.trackId}:${runNonce}`

    // Skip if this exact play was already paid (idempotency).
    const existing = await db.payment.findUnique({ where: { scrobbleKey } })
    if (existing) {
      skippedCount++
      emit(`[${new Date().toISOString()}] Already paid for "${track.title}" — skipping`)
      continue
    }

    // Create payment record
    const amount = listener.ratePerListen
    const payment = await db.payment.create({
      data: {
        listenerId,
        artistId: artist.id,
        trackTitle: track.title,
        amountUsdc: amount,
        scrobbledAt: track.playedAt,
        scrobbleKey,
        settled: false,
      },
    })

    totalUsdc += amount
    spentToday += amount
    paymentCount++
    emit(`[${new Date().toISOString()}] Queued $${amount.toFixed(4)} USDC for ${artist.name} (payment ${payment.id})`)
  }

  if (skippedCount > 0) {
    emit(`[${new Date().toISOString()}] Skipped ${skippedCount} already-paid scrobbles`)
  }

  // Log the run
  await db.agentRun.create({
    data: {
      scrobbleCount: tracks.length,
      resolvedCount,
      paymentCount,
      totalUsdc,
      status: "success",
      startedAt,
      finishedAt: new Date(),
    },
  })

  // Settle pending payments — attempt on-chain transfer if listener wallet is funded
  const freshListener = await db.listener.findUnique({ where: { id: listenerId } })
  const pendingPayments = await db.payment.findMany({
    where: { listenerId, settled: false },
    include: { artist: true },
  })

  for (const p of pendingPayments) {
    let circlePayId: string | undefined
    let txHash: string | undefined
    // Attempt on-chain USDC transfer if listener has a wallet and artist has claimed theirs
    if (freshListener?.circleWalletId && p.artist.circleWalletId) {
      try {
        const balance = await getWalletBalance(freshListener.circleWalletId)
        if (balance >= p.amountUsdc) {
          circlePayId = await transferUsdc({
            sourceWalletId: freshListener.circleWalletId,
            destinationAddress: p.artist.circleWalletId,
            amountUsdc: p.amountUsdc,
          })
          // Resolve the on-chain hash so the UI can link to the Arc explorer.
          const resolved = await getTransactionHash(circlePayId)
          txHash = resolved.txHash ?? undefined
          if (txHash) {
            emit(`[${new Date().toISOString()}] Transferred $${p.amountUsdc.toFixed(4)} USDC on-chain to ${p.artist.name} (tx: ${txHash})`)
          } else {
            emit(`[${new Date().toISOString()}] Transferred $${p.amountUsdc.toFixed(4)} USDC to ${p.artist.name} (confirming on-chain…)`)
          }
        } else {
          emit(`[${new Date().toISOString()}] Insufficient balance — skipping on-chain transfer for ${p.artist.name}`)
        }
      } catch (e) {
        emit(`[${new Date().toISOString()}] Transfer failed for ${p.artist.name}: ${e instanceof Error ? e.message : e}`)
      }
    }

    await db.artist.update({
      where: { id: p.artistId },
      data: { totalEarned: { increment: p.amountUsdc } },
    })
    await db.payment.update({
      where: { id: p.id },
      data: {
        settled: true,
        settledAt: new Date(),
        ...(circlePayId ? { circlePayId } : {}),
        ...(txHash ? { txHash } : {}),
      },
    })
  }

  emit(`[${new Date().toISOString()}] Settled. ${paymentCount} payments. $${totalUsdc.toFixed(4)} USDC total.`)

  return { scrobbleCount: tracks.length, resolvedCount, paymentCount, totalUsdc, log }
}

export async function ensureListenerWallet(listenerId: string): Promise<void> {
  const listener = await db.listener.findUnique({ where: { id: listenerId } })
  if (!listener || listener.circleWalletId) return

  const walletSetId = await createWalletSet(`obol-listener-${listenerId}`)
  const wallet = await createWallet(walletSetId, `listener-${listenerId}`)

  await db.listener.update({
    where: { id: listenerId },
    data: { circleWalletId: wallet.id },
  })
}
