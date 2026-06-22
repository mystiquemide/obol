// Backfill on-chain tx hashes for settled payments that have a Circle id but no txHash.
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets"
import { PrismaClient } from "@prisma/client"
import { readFileSync } from "fs"

const env = readFileSync(".env", "utf8")
for (const line of env.split("\n")) {
  const [k, ...v] = line.split("=")
  if (k && v.length) process.env[k.trim()] = v.join("=").replace(/^"|"$/g, "").trim()
}

const db = new PrismaClient()
const circle = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
})

const pending = await db.payment.findMany({
  where: { circlePayId: { not: null }, txHash: null },
})
console.log(`Backfilling ${pending.length} payments...`)

let filled = 0
for (const p of pending) {
  try {
    const res = await circle.getTransaction({ id: p.circlePayId })
    const t = res.data?.transaction ?? res.data
    if (t?.txHash) {
      await db.payment.update({ where: { id: p.id }, data: { txHash: t.txHash } })
      filled++
      console.log(`  ${p.trackTitle}: ${t.txHash}`)
    }
  } catch (e) {
    console.log(`  ${p.id}: ${e?.message?.slice(0, 60)}`)
  }
}
console.log(`Done. Filled ${filled}/${pending.length}.`)
await db.$disconnect()
