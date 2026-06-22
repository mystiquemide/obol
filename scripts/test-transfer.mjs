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

const listener = await db.listener.findFirst({ where: { NOT: { circleWalletId: null } }, orderBy: { createdAt: "asc" } })
console.log("Source wallet ID:", listener.circleWalletId)

const DEST = "0x661040a7aef5ba32bb5c32d7de4d509fa040fa93"

// First: check what tokens are on the wallet
console.log("\n--- Wallet token balances ---")
const bal = await client.getWalletTokenBalance({ id: listener.circleWalletId })
console.log(JSON.stringify(bal.data?.tokenBalances, null, 2))

// Try transfer using tokenId from the balance response instead of tokenAddress
const tokens = bal.data?.tokenBalances ?? []
const usdc = tokens.find(b => b.token?.symbol === "USDC" || b.token?.name?.toLowerCase().includes("usdc"))
console.log("\nUSDC token entry:", JSON.stringify(usdc, null, 2))

if (usdc) {
  const tokenId = usdc.token?.id
  console.log("\n--- Attempting transfer with tokenId:", tokenId, "---")
  try {
    const res = await client.createTransaction({
      walletId: listener.circleWalletId,
      ...(tokenId ? { tokenId } : { tokenAddress: "0x3600000000000000000000000000000000000000" }),
      destinationAddress: DEST,
      amount: ["0.001000"],
      fee: { type: "level", config: { feeLevel: "MEDIUM" } },
    })
    console.log("SUCCESS:", JSON.stringify(res.data, null, 2))
  } catch (err) {
    console.error("FAILED:", err?.message)
    if (err?.response?.data) console.error("Detail:", JSON.stringify(err.response.data, null, 2))
    if (err?.response?.status) console.error("Status:", err.response.status)
  }
}

await db.$disconnect()
