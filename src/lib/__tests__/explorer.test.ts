import { describe, it, expect } from "vitest"
import { txUrl, addressUrl, shortHash, ARC_EXPLORER } from "@/lib/explorer"

describe("explorer", () => {
  it("builds tx and address URLs", () => {
    expect(txUrl("0xabc")).toBe(`${ARC_EXPLORER}/tx/0xabc`)
    expect(addressUrl("0xdef")).toBe(`${ARC_EXPLORER}/address/0xdef`)
  })

  it("shortens long hashes and leaves short ones untouched", () => {
    const hash = "0x046680d7e06d4593671f843e742f9aedb5b3da31b8e4e774c0fd81b4aa78dc8d"
    expect(shortHash(hash)).toBe("0x0466…dc8d")
    expect(shortHash("0xabcd")).toBe("0xabcd")
  })
})
