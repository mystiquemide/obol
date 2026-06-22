// Inspect the full Circle getTransaction response to design x402 verification.
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

const p = await db.payment.findFirst({ where: { circlePayId: { not: null } }, orderBy: { settledAt: "desc" } })
const res = await circle.getTransaction({ id: p.circlePayId })
const t = res.data?.transaction ?? res.data
console.log(JSON.stringify(t, null, 2))

// Also check listener wallet balance is funded for live x402 demo.
const listener = await db.listener.findFirst({ where: { circleWalletId: { not: null } }, orderBy: { createdAt: "asc" } })
const bal = await circle.getWalletTokenBalance({ id: listener.circleWalletId })
console.log("\n--- Listener wallet", listener.circleWalletId, "balances ---")
for (const b of bal.data?.tokenBalances ?? []) {
  console.log(`  ${b.token?.symbol} (${b.token?.isNative ? "native" : "erc20"}, id ${b.token?.id}): ${b.amount}`)
}
await db.$disconnect()
