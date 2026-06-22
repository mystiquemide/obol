// Count rows in the DB. Retries through Neon free-tier cold starts (P1001).
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function withRetry(fn, tries = 5) {
  for (let i = 0; i < tries; i++) {
    try {
      return await fn()
    } catch (e) {
      if (i === tries - 1) throw e
      console.log(`  attempt ${i + 1} failed (${e.code ?? e.message}), waking Neon, retrying...`)
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
}

const counts = await withRetry(async () => {
  const [listeners, artists, payments, agentRuns] = await Promise.all([
    db.listener.count(),
    db.artist.count(),
    db.payment.count(),
    db.agentRun.count(),
  ])
  return { listeners, artists, payments, agentRuns }
})

console.log("Postgres row counts:", counts)

const listeners = await db.listener.findMany()
console.log("\nListeners:")
for (const l of listeners) {
  console.log(`  ${l.id} | wallet: ${l.circleWalletId ?? "none"} | rate: ${l.ratePerListen}`)
}

const claimed = await db.artist.findMany({ where: { circleWalletId: { not: null } } })
console.log("\nClaimed artists:")
for (const a of claimed) {
  console.log(`  ${a.name} | ${a.circleWalletId} | earned: ${a.totalEarned}`)
}

await db.$disconnect()
