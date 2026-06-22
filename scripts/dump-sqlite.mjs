// Dump all current SQLite data to JSON before migrating to Postgres.
// Run this while the Prisma client is still generated for sqlite.
import { PrismaClient } from "@prisma/client"
import { writeFileSync, mkdirSync } from "fs"

const db = new PrismaClient()

const [listeners, artists, payments, agentRuns] = await Promise.all([
  db.listener.findMany(),
  db.artist.findMany(),
  db.payment.findMany(),
  db.agentRun.findMany(),
])

mkdirSync("recovery", { recursive: true })
writeFileSync(
  "recovery/db-dump.json",
  JSON.stringify({ listeners, artists, payments, agentRuns }, null, 2)
)

console.log("Dumped:")
console.log(`  listeners: ${listeners.length}`)
console.log(`  artists:   ${artists.length}`)
console.log(`  payments:  ${payments.length}`)
console.log(`  agentRuns: ${agentRuns.length}`)
console.log("\nListeners with wallets:")
for (const l of listeners) {
  console.log(`  ${l.id} | wallet: ${l.circleWalletId ?? "none"} | rate: ${l.ratePerListen}`)
}
console.log("\nArtists with claimed wallets:")
for (const a of artists.filter((x) => x.circleWalletId)) {
  console.log(`  ${a.name} | ${a.circleWalletId} | earned: ${a.totalEarned}`)
}

await db.$disconnect()
