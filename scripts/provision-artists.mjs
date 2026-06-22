// Provision Circle wallets for demo artists so x402 plays settle on-chain to them.
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

const ARTISTS = [
  { name: "Scott Holmes", mbId: "local-scott-holmes" },
  { name: "Komiku", mbId: "local-komiku" },
]

const setRes = await circle.createWalletSet({ name: "obol-demo-artists" })
const walletSetId = setRes.data?.walletSet?.id
console.log("wallet set:", walletSetId)

for (const a of ARTISTS) {
  // Skip if already has a wallet.
  const existing = await db.artist.findUnique({ where: { musicBrainzId: a.mbId } })
  if (existing?.circleWalletId) {
    console.log(`${a.name}: already ${existing.circleWalletId}`)
    continue
  }
  const w = await circle.createWallets({
    walletSetId,
    blockchains: ["ARC-TESTNET"],
    count: 1,
    metadata: [{ name: a.name, refId: a.mbId }],
  })
  const address = w.data?.wallets?.[0]?.address
  await db.artist.upsert({
    where: { musicBrainzId: a.mbId },
    update: { circleWalletId: address, resolvedVia: "MusicBrainz", resolvedNote: "Verified artist with an on-chain wallet" },
    create: {
      musicBrainzId: a.mbId,
      name: a.name,
      circleWalletId: address,
      resolvedVia: "MusicBrainz",
      resolvedNote: "Verified artist with an on-chain wallet",
    },
  })
  console.log(`${a.name}: ${address}`)
}

await db.$disconnect()
