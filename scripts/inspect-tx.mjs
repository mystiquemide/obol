// Inspect a Circle transaction to find the real on-chain tx hash for explorer links.
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

// Grab a recent payment that has a Circle tx id.
const p = await db.payment.findFirst({
  where: { circlePayId: { not: null } },
  orderBy: { settledAt: "desc" },
})
console.log("Circle tx id (circlePayId):", p?.circlePayId)

if (p?.circlePayId) {
  const res = await client.getTransaction({ id: p.circlePayId })
  const t = res.data?.transaction ?? res.data
  console.log("\n--- getTransaction response keys ---")
  console.log(Object.keys(t ?? {}))
  console.log("\n--- relevant fields ---")
  console.log("state:    ", t?.state)
  console.log("txHash:   ", t?.txHash)
  console.log("blockchain:", t?.blockchain)
}

await db.$disconnect()
