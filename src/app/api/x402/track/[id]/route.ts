// x402-gated track endpoint.
// No X-PAYMENT header  -> 402 Payment Required + payment requirements.
// Valid X-PAYMENT proof -> 200 with the unlocked resource.
import { NextResponse } from "next/server"
import { db, dbRetry } from "@/lib/db"
import { txUrl } from "@/lib/explorer"
import {
  getTrack,
  requirementsBody,
  verifyPayment,
  encodePayment,
  X402_VERSION,
} from "@/lib/x402"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const track = await dbRetry(() => getTrack(id))
  if (!track) {
    return NextResponse.json({ error: "unknown track" }, { status: 404 })
  }

  const resource = new URL(req.url).pathname
  const payment = req.headers.get("X-PAYMENT")

  // No payment yet — challenge with 402 and the requirements.
  if (!payment) {
    return NextResponse.json(requirementsBody(track, resource), {
      status: 402,
      headers: { "Cache-Control": "no-store" },
    })
  }

  // Verify the on-chain payment.
  const result = await verifyPayment(track, payment)
  if (!result.ok) {
    return NextResponse.json(
      { x402Version: X402_VERSION, error: result.reason ?? "invalid payment", accepts: requirementsBody(track, resource).accepts },
      { status: 402 }
    )
  }

  // Anti-replay: one on-chain payment unlocks one play.
  try {
    await dbRetry(() =>
      db.x402Redemption.create({
        data: { txHash: result.txHash!, trackId: track.id, amountUsdc: result.amountUsdc ?? track.priceUsdc },
      })
    )
  } catch (e) {
    // Unique-constraint violation = genuine replay; anything else is a transient/db error.
    const code = (e as { code?: string })?.code
    const status = code === "P2002" ? 402 : 503
    return NextResponse.json(
      { x402Version: X402_VERSION, error: code === "P2002" ? "payment already redeemed" : "ledger unavailable, retry" },
      { status }
    )
  }

  // Paid — return the unlocked resource and echo settlement in X-PAYMENT-RESPONSE.
  const settlement = encodePayment({
    scheme: "arc-onchain",
    network: "arc-testnet",
    payload: { txHash: result.txHash! },
  })
  return NextResponse.json(
    {
      unlocked: true,
      track: { id: track.id, title: track.title, artist: track.artist, duration: track.duration, audioUrl: track.audioUrl },
      paid: { amountUsdc: result.amountUsdc, txHash: result.txHash, explorer: txUrl(result.txHash!) },
    },
    { status: 200, headers: { "X-PAYMENT-RESPONSE": settlement } }
  )
}
