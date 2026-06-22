// x402 play orchestrator. Drives the full handshake against the gated endpoint
// and streams every step so the UI shows: request -> 402 -> pay on Arc -> settle
// -> retry with proof -> unlock. This is the client side of x402.
import { db, dbRetry } from "@/lib/db"
import { getTrack, encodePayment } from "@/lib/x402"
import { transferUsdc, getTransactionHash } from "@/lib/agent/circle"
import { txUrl } from "@/lib/explorer"
import { rateLimit, clientIp } from "@/lib/ratelimit"

// Caps how much the public demo can spend per day, so an unauthenticated caller
// can't drain the funded wallet by hammering play.
const X402_DAILY_CAP_USDC = 1.0

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rl = rateLimit(`play:${clientIp(req)}`, 5, 30_000)
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(rl.retryAfter) },
    })
  }

  const { id } = await params
  const track = await dbRetry(() => getTrack(id))
  const origin = new URL(req.url).origin

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))

      try {
        if (!track) {
          send({ type: "error", error: "unknown track" })
          controller.close()
          return
        }

        const gateUrl = `${origin}/api/x402/track/${track.id}`

        // 1. Request the resource with no payment -> expect 402.
        send({ type: "step", label: `GET ${track.id}`, detail: "requesting track" })
        const challenge = await fetch(gateUrl)
        if (challenge.status !== 402) {
          send({ type: "error", error: `expected 402, got ${challenge.status}` })
          controller.close()
          return
        }
        const body = await challenge.json()
        const req0 = body.accepts?.[0]
        send({
          type: "challenge",
          status: 402,
          amountUsdc: track.priceUsdc,
          payTo: req0?.payTo,
          network: req0?.network,
          description: req0?.description,
        })

        // Defense-in-depth: cap total x402 spend per day across all callers.
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        const spent = await dbRetry(() =>
          db.x402Redemption.aggregate({ _sum: { amountUsdc: true }, where: { createdAt: { gte: startOfDay } } })
        )
        const spentToday = spent._sum.amountUsdc ?? 0
        if (spentToday + track.priceUsdc > X402_DAILY_CAP_USDC) {
          send({ type: "error", error: "Daily demo budget reached. Try again tomorrow." })
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
          send({ type: "error", error: "no funded listener wallet available" })
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
          send({ type: "error", error: "payment did not confirm in time" })
          controller.close()
          return
        }
        send({ type: "settled", txHash, explorer: txUrl(txHash) })

        // 3. Retry with the X-PAYMENT proof -> expect 200.
        send({ type: "step", label: "retry", detail: "presenting payment proof" })
        const xPayment = encodePayment({
          scheme: "arc-onchain",
          network: "arc-testnet",
          payload: { txHash, circleTxId },
        })
        const unlocked = await fetch(gateUrl, { headers: { "X-PAYMENT": xPayment } })
        if (unlocked.status !== 200) {
          const err = await unlocked.json().catch(() => ({}))
          send({ type: "error", error: `unlock failed (${unlocked.status}): ${err.error ?? ""}` })
          controller.close()
          return
        }
        const resource = await unlocked.json()

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
      } catch (e) {
        send({ type: "error", error: e instanceof Error ? e.message : String(e) })
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
