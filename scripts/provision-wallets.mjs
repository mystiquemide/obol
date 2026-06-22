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

const listeners = await db.listener.findMany()
console.log(`Found ${listeners.length} listener(s)`)

for (const listener of listeners) {
  console.log(`\nProvisioning ARC-TESTNET wallet for listener: ${listener.id}`)
  try {
    const wsRes = await client.createWalletSet({ name: `obol-arc-${listener.id}` })
    const walletSetId = wsRes.data?.walletSet?.id
    console.log("  Wallet set:", walletSetId)

    const wRes = await client.createWallets({
      walletSetId,
      blockchains: ["ARC-TESTNET"],
      count: 1,
      metadata: [{ name: `listener-${listener.id}`, refId: `listener-arc-${listener.id}` }],
    })
    const wallet = wRes.data?.wallets?.[0]
    if (!wallet) throw new Error("No wallet returned")

    await db.listener.update({
      where: { id: listener.id },
      data: { circleWalletId: wallet.id },
    })

    console.log(`  Wallet ID: ${wallet.id}`)
    console.log(`  Address:   ${wallet.address}`)
    console.log(`  State:     ${wallet.state}`)
    console.log(`  DB updated.`)
  } catch (err) {
    console.error(`  FAILED: ${err?.message ?? err}`)
    if (err?.response?.data) console.error("  Detail:", JSON.stringify(err.response.data))
  }
}

await db.$disconnect()
console.log("\nDone.")
