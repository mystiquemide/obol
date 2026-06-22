import { describe, it, expect } from "vitest"
import {
  toAtomic,
  encodePayment,
  decodePayment,
  buildRequirements,
  ARC_USDC_ASSET,
  X402_SCHEME,
  type Track,
} from "@/lib/x402"

const track: Track = {
  id: "cipher",
  title: "Cipher",
  artist: "Kevin MacLeod",
  artistMbId: "mb-id",
  payTo: "0x1111111111111111111111111111111111111111",
  priceUsdc: 0.001,
  duration: "2:54",
  audioUrl: "/audio/cipher.wav",
}

describe("x402", () => {
  it("converts USDC to 6-decimal atomic units", () => {
    expect(toAtomic(0.001)).toBe("1000")
    expect(toAtomic(1)).toBe("1000000")
  })

  it("round-trips the X-PAYMENT header", () => {
    const header = encodePayment({
      scheme: "arc-onchain",
      network: "arc-testnet",
      payload: { txHash: "0xabc", circleTxId: "id-1" },
    })
    const decoded = decodePayment(header)
    expect(decoded?.payload.txHash).toBe("0xabc")
    expect(decoded?.scheme).toBe("arc-onchain")
  })

  it("returns null on a malformed header", () => {
    expect(decodePayment("%%%not-valid%%%")).toBeNull()
  })

  it("builds payment requirements for a track", () => {
    const req = buildRequirements(track, "/api/x402/track/cipher")
    expect(req.scheme).toBe(X402_SCHEME)
    expect(req.payTo).toBe(track.payTo)
    expect(req.asset).toBe(ARC_USDC_ASSET)
    expect(req.maxAmountRequired).toBe("1000")
  })
})
