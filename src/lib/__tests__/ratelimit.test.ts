import { describe, it, expect } from "vitest"
import { rateLimit, clientIp } from "@/lib/ratelimit"

describe("rateLimit", () => {
  it("allows up to the limit, then blocks with a retry hint", () => {
    const key = `t-${Math.random()}`
    expect(rateLimit(key, 3, 10_000).ok).toBe(true)
    expect(rateLimit(key, 3, 10_000).ok).toBe(true)
    expect(rateLimit(key, 3, 10_000).ok).toBe(true)
    const blocked = rateLimit(key, 3, 10_000)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfter).toBeGreaterThan(0)
  })

  it("tracks each key independently", () => {
    expect(rateLimit(`a-${Math.random()}`, 1, 10_000).ok).toBe(true)
    expect(rateLimit(`b-${Math.random()}`, 1, 10_000).ok).toBe(true)
  })
})

describe("clientIp", () => {
  it("reads the first x-forwarded-for entry", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } })
    expect(clientIp(req)).toBe("1.2.3.4")
  })

  it("falls back to unknown when no header is present", () => {
    expect(clientIp(new Request("http://x"))).toBe("unknown")
  })
})
