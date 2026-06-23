// x402 play orchestrator — the client side of x402. Streams every step so the UI
// shows: 402 -> pay on Arc -> settle -> verify proof -> unlock.
//
// The public gate (/api/x402/track/[id]) is the real HTTP 402 endpoint external
// clients hit. This orchestrator runs the same payment-requirements + verification
// logic in-process (no self-fetch), so it works behind tunnels and on serverless.
import { db, dbRetry } from "@/lib/db"
import { getTrack, buildRequirements, verifyPayment, encodePayment } from "@/lib/x402"
import { transferUsdc, getTransactionHash } from "@/lib/agent/circle"
import { txUrl } from "@/lib/explorer"
import { rateLimit, clientIp } from "@/lib/ratelimit"

// Caps how much the public demo can spend per day, so an unauthenticated caller
// can't drain the funded wallet by hammering play.
const X402_DAILY_CAP_USDC = 1.0

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rl = rateLimit(`play:${clientIp(req)}`, 5, 30_000)
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: "You're going a bit fast. Give it a few seconds and try again." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(rl.retryAfter) },
    })
  }

  const { id } = await params
  const track = await dbRetry(() => getTrack(id))

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))

      try {
        if (!track) {
          send({ type: "error", error: "We can't find that track. It may have been removed." })
          controller.close()
          return
        }

        const resourcePath = `/api/x402/track/${track.id}`

        // 1. The resource requires payment -> 402 with these requirements.
        send({ type: "step", label: `GET ${track.id}`, detail: "requesting track" })
        const requirements = buildRequirements(track, resourcePath)
        send({
          type: "challenge",
          status: 402,
          amountUsdc: track.priceUsdc,
          payTo: requirements.payTo,
          network: requirements.network,
          description: requirements.description,
        })

        // Defense-in-depth: cap total x402 spend per day across all callers.
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        const spent = await dbRetry(() =>
          db.x402Redemption.aggregate({ _sum: { amountUsdc: true }, where: { createdAt: { gte: startOfDay } } })
        )
        const spentToday = spent._sum.amountUsdc ?? 0
        if (spentToday + track.priceUsdc > X402_DAILY_CAP_USDC) {
          send({ type: "error", error: "That's the daily limit for now. Check back tomorrow." })
          controller.close()
          return
        }

        // 2. Pay on Arc via Circle from the funded listener wallet.
        const listener = await dbRetry(() =>
          db.listener.findFirst({
            where: { circleWalletId: { not: null } },
            orderBy: { createdAt: "asc" },
          })
        )
        if (!listener?.circleWalletId) {
          send({ type: "error", error: "Payments are paused right now. Please try again shortly." })
          controller.close()
          return
        }
        send({ type: "step", label: "pay", detail: `sending ${track.priceUsdc} USDC on Arc` })
        const circleTxId = await transferUsdc({
          sourceWalletId: listener.circleWalletId,
          destinationAddress: track.payTo,
          amountUsdc: track.priceUsdc,
        })
        send({ type: "step", label: "settle", detail: "confirming on-chain" })
        const { txHash } = await getTransactionHash(circleTxId)
        if (!txHash) {
          send({ type: "error", error: "That payment is taking longer than usual. Give it another try." })
          controller.close()
          return
        }
        send({ type: "settled", txHash, explorer: txUrl(txHash) })

        // 3. Present the X-PAYMENT proof and verify it on-chain (same check the gate runs).
        send({ type: "step", label: "verify", detail: "checking payment proof" })
        const xPayment = encodePayment({
          scheme: "arc-onchain",
          network: "arc-testnet",
          payload: { txHash, circleTxId },
        })
        const verify = await verifyPayment(track, xPayment)
        if (!verify.ok) {
          send({ type: "error", error: "We couldn't verify that payment. Give it another try." })
          controller.close()
          return
        }

        // Anti-replay: one on-chain payment unlocks one play.
        try {
          await dbRetry(() =>
            db.x402Redemption.create({
              data: { txHash: verify.txHash!, trackId: track.id, amountUsdc: verify.amountUsdc ?? track.priceUsdc },
            })
          )
        } catch {
          send({ type: "error", error: "That track is already unlocked." })
          controller.close()
          return
        }

        const resource = {
          unlocked: true,
          track: { id: track.id, title: track.title, artist: track.artist, duration: track.duration, audioUrl: track.audioUrl },
          paid: { amountUsdc: verify.amountUsdc, txHash: verify.txHash, explorer: txUrl(verify.txHash!) },
        }

        // 4. Record the play so it shows in the artist's earnings + receipt.
        try {
          const artist = await dbRetry(() =>
            db.artist.findUnique({ where: { musicBrainzId: track.artistMbId } })
          )
          if (artist) {
            await db.payment.create({
              data: {
                listenerId: listener.id,
                artistId: artist.id,
                trackTitle: track.title,
                amountUsdc: track.priceUsdc,
                settled: true,
                settledAt: new Date(),
                circlePayId: circleTxId,
                txHash,
                scrobbledAt: new Date(),
                scrobbleKey: `x402:${txHash}`,
              },
            })
            await db.artist.update({
              where: { id: artist.id },
              data: { totalEarned: { increment: track.priceUsdc } },
            })
          }
        } catch {
          // recording is best-effort — the play already unlocked
        }

        send({ type: "unlocked", resource })
        send({ type: "done" })
      } catch {
        send({ type: "error", error: "That payment didn't go through. Give it another try." })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
