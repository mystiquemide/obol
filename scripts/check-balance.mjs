import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets"
import { PrismaClient } from "@prisma/client"
import { readFileSync } from "fs"

const env = readFileSync(".env", "utf8")
for (const line of env.split("\n")) {
  const [k, ...v] = line.split("=")
  if (k && v.length) process.env[k.trim()] = v.join("=").replace(/^"|"$/g, "").trim()
}

const db = new PrismaClient()
const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
})

const listeners = await db.listener.findMany({ where: { NOT: { circleWalletId: null } } })

for (const listener of listeners) {
  console.log(`\nListener: ${listener.id}`)
  console.log(`Wallet ID: ${listener.circleWalletId}`)
  try {
    const res = await client.getWalletTokenBalance({ id: listener.circleWalletId })
    const balances = res.data?.tokenBalances ?? []
    if (balances.length === 0) {
      console.log("Balance: 0 (no tokens yet)")
    } else {
      for (const b of balances) {
        console.log(`  ${b.token?.symbol ?? b.token?.name ?? "unknown"}: ${b.amount}`)
      }
    }
  } catch (err) {
    console.error(`  Error: ${err?.message ?? err}`)
  }
}

await db.$disconnect()
