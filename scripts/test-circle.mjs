import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets"
import { readFileSync } from "fs"

// Load .env manually
const env = readFileSync(".env", "utf8")
for (const line of env.split("\n")) {
  const [k, ...v] = line.split("=")
  if (k && v.length) process.env[k.trim()] = v.join("=").replace(/^"|"$/g, "").trim()
}

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
})

console.log("Testing Circle API...")
console.log("API Key prefix:", process.env.CIRCLE_API_KEY?.slice(0, 20))
console.log("Entity Secret prefix:", process.env.CIRCLE_ENTITY_SECRET?.slice(0, 10))

try {
  console.log("\n1. Creating wallet set...")
  const wsRes = await client.createWalletSet({ name: "obol-test-" + Date.now() })
  const walletSetId = wsRes.data?.walletSet?.id
  console.log("Wallet set created:", walletSetId)

  console.log("\n2. Creating wallet on ARB-SEPOLIA...")
  const wRes = await client.createWallets({
    walletSetId,
    blockchains: ["ARB-SEPOLIA"],
    count: 1,
    metadata: [{ name: "test-listener", refId: "test-listener" }],
  })
  const wallet = wRes.data?.wallets?.[0]
  console.log("Wallet created:", JSON.stringify({ id: wallet?.id, address: wallet?.address, state: wallet?.state }, null, 2))
} catch (err) {
  console.error("FAILED:", err?.message ?? err)
  if (err?.response?.data) console.error("Response:", JSON.stringify(err.response.data, null, 2))
}
