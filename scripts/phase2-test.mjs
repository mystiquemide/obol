// Phase 2 endpoint tests: escrow lookup, claim guard, streaming run.
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()
const BASE = "http://localhost:3000"

// Grab a claimed artist to test against.
const claimed = await db.artist.findFirst({ where: { circleWalletId: { not: null } } })
console.log(`\n--- Test artist: ${claimed.name} (${claimed.musicBrainzId}) wallet ${claimed.circleWalletId} earned ${claimed.totalEarned} ---`)

// 1. Escrow lookup
console.log("\n[1] GET /api/artist/escrow")
const esc = await fetch(`${BASE}/api/artist/escrow?mbId=${encodeURIComponent(claimed.musicBrainzId)}`)
console.log("   status", esc.status, "body", JSON.stringify(await esc.json()))

const escMissing = await fetch(`${BASE}/api/artist/escrow?mbId=nonexistent-artist-xyz`)
console.log("   unknown artist:", JSON.stringify(await escMissing.json()))

// 2. Claim guard — try to hijack the claimed artist to a different wallet
console.log("\n[2] POST /api/artist/claim (hijack attempt — expect 409)")
const hijack = await fetch(`${BASE}/api/artist/claim`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    musicBrainzId: claimed.musicBrainzId,
    name: claimed.name,
    walletAddress: "0x1111111111111111111111111111111111111111",
  }),
})
console.log("   status", hijack.status, "body", JSON.stringify(await hijack.json()))

// Re-claim with the SAME wallet should still work (idempotent)
console.log("\n[2b] POST /api/artist/claim (same wallet — expect ok)")
const reclaim = await fetch(`${BASE}/api/artist/claim`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    musicBrainzId: claimed.musicBrainzId,
    name: claimed.name,
    walletAddress: claimed.circleWalletId,
  }),
})
console.log("   status", reclaim.status, "body", JSON.stringify(await reclaim.json()))

// 3. Streaming run
console.log("\n[3] POST /api/agent/run (streaming demo) — events as they arrive:")
const run = await fetch(`${BASE}/api/agent/run`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ demo: true }),
})
const reader = run.body.getReader()
const decoder = new TextDecoder()
let buffer = ""
let logEvents = 0
let doneSeen = false
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })
  const parts = buffer.split("\n\n")
  buffer = parts.pop() ?? ""
  for (const part of parts) {
    const t = part.trim()
    if (!t.startsWith("data:")) continue
    const msg = JSON.parse(t.slice(t.indexOf("data:") + 5).trim())
    if (msg.type === "log") {
      logEvents++
      if (logEvents <= 3) console.log(`   [stream] ${msg.line}`)
    } else if (msg.type === "done") {
      doneSeen = true
      console.log(`   [done] ${msg.result.paymentCount} payments, $${msg.result.totalUsdc} total, ${msg.result.log.length} log lines`)
    } else if (msg.type === "error") {
      console.log(`   [error] ${msg.error}`)
    }
  }
}
console.log(`   streamed ${logEvents} log events, done event: ${doneSeen}`)

await db.$disconnect()
