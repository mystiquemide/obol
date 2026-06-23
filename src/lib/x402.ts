// x402 payment-gated streaming for Obol.
//
// Faithful to the x402 HTTP flow (402 Payment Required -> X-PAYMENT retry ->
// X-PAYMENT-RESPONSE), but settled on Arc through Circle and verified by the
// on-chain tx hash, rather than the EIP-3009 facilitator scheme. We label our
// scheme "arc-onchain" so it is never mistaken for the "exact" EVM scheme.
import { getTransactionDetails, SETTLED_STATES } from "@/lib/agent/circle"
import { db } from "@/lib/db"

export const X402_VERSION = 1
export const ARC_NETWORK = "arc-testnet"
export const ARC_USDC_ASSET = "0x3600000000000000000000000000000000000000"
export const X402_SCHEME = "arc-onchain"

export interface Track {
  id: string
  title: string
  artist: string
  artistMbId: string
  payTo: string // artist wallet address
  priceUsdc: number
  duration: string
  audioUrl: string | null
}

// The catalog is DB-backed: tracks added by artists who onboarded with a wallet.
export async function getTrack(slug: string): Promise<Track | undefined> {
  const t = await db.track.findUnique({ where: { slug }, include: { artist: true } })
  if (!t || !t.artist.circleWalletId) return undefined
  return {
    id: t.slug,
    title: t.title,
    artist: t.artist.name,
    artistMbId: t.artist.musicBrainzId,
    payTo: t.artist.circleWalletId,
    priceUsdc: t.priceUsdc,
    duration: t.duration,
    audioUrl: t.audioUrl,
  }
}

export async function listCatalog(): Promise<Track[]> {
  const rows = await db.track.findMany({
    where: { artist: { circleWalletId: { not: null } } },
    include: { artist: true },
    orderBy: [{ artist: { name: "asc" } }, { createdAt: "asc" }],
  })
  return rows.map((t) => ({
    id: t.slug,
    title: t.title,
    artist: t.artist.name,
    artistMbId: t.artist.musicBrainzId,
    payTo: t.artist.circleWalletId!,
    priceUsdc: t.priceUsdc,
    duration: t.duration,
    audioUrl: t.audioUrl,
  }))
}

// atomic USDC units (6 decimals)
export function toAtomic(usdc: number): string {
  return Math.round(usdc * 1_000_000).toString()
}

export interface PaymentRequirements {
  scheme: string
  network: string
  maxAmountRequired: string
  resource: string
  description: string
  mimeType: string
  payTo: string
  asset: string
  extra: Record<string, unknown>
}

export function buildRequirements(track: Track, resource: string): PaymentRequirements {
  return {
    scheme: X402_SCHEME,
    network: ARC_NETWORK,
    maxAmountRequired: toAtomic(track.priceUsdc),
    resource,
    description: `One play of "${track.title}" by ${track.artist}`,
    mimeType: "application/json",
    payTo: track.payTo,
    asset: ARC_USDC_ASSET,
    extra: { name: "USDC", decimals: 6, blockchain: "ARC-TESTNET" },
  }
}

export function requirementsBody(track: Track, resource: string) {
  return {
    x402Version: X402_VERSION,
    error: "payment required",
    accepts: [buildRequirements(track, resource)],
  }
}

// X-PAYMENT header is base64(JSON). Our payload carries the settled on-chain proof.
export interface PaymentPayload {
  scheme: string
  network: string
  payload: { txHash: string; circleTxId?: string }
}

export function encodePayment(p: PaymentPayload): string {
  return Buffer.from(JSON.stringify(p)).toString("base64")
}

export function decodePayment(header: string): PaymentPayload | null {
  try {
    return JSON.parse(Buffer.from(header, "base64").toString("utf8")) as PaymentPayload
  } catch {
    return null
  }
}

export interface VerifyResult {
  ok: boolean
  reason?: string
  txHash?: string
  amountUsdc?: number
}

// Verify a payment proof against the chain via Circle: state, recipient, amount.
export async function verifyPayment(track: Track, header: string): Promise<VerifyResult> {
  const decoded = decodePayment(header)
  if (!decoded) return { ok: false, reason: "malformed X-PAYMENT header" }
  if (decoded.network !== ARC_NETWORK || decoded.scheme !== X402_SCHEME) {
    return { ok: false, reason: "unsupported scheme/network" }
  }
  const txHash = decoded.payload?.txHash
  const circleTxId = decoded.payload?.circleTxId
  if (!txHash && !circleTxId) return { ok: false, reason: "no payment reference" }

  const tx = await getTransactionDetails(circleTxId ?? txHash!)
  if (!tx) return { ok: false, reason: "transaction not found" }
  if (!tx.state || !SETTLED_STATES.includes(tx.state)) {
    return { ok: false, reason: `transaction not settled (${tx.state})` }
  }
  if (tx.destinationAddress?.toLowerCase() !== track.payTo.toLowerCase()) {
    return { ok: false, reason: "recipient mismatch" }
  }
  const paid = parseFloat(tx.amounts?.[0] ?? "0")
  if (paid + 1e-9 < track.priceUsdc) return { ok: false, reason: "underpaid" }

  return { ok: true, txHash: tx.txHash ?? txHash, amountUsdc: paid }
}
