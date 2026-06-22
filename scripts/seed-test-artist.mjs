import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

// Use the "default" listener's Arc Testnet wallet address as the artist destination
const ARTIST_WALLET_ADDRESS = "0x661040a7aef5ba32bb5c32d7de4d509fa040fa93"

// Find Kevin MacLeod - he already has queued payments from the last run
const artist = await db.artist.findFirst({ where: { name: { contains: "Kevin" } } })

if (!artist) {
  console.error("Kevin MacLeod not found in DB. Run the agent once first.")
  process.exit(1)
}

console.log(`Found artist: ${artist.name} (${artist.id})`)
console.log(`Current circleWalletId: ${artist.circleWalletId ?? "null (unclaimed)"}`)

await db.artist.update({
  where: { id: artist.id },
  data: { circleWalletId: ARTIST_WALLET_ADDRESS },
})

console.log(`\nUpdated circleWalletId to: ${ARTIST_WALLET_ADDRESS}`)
console.log("Artist is now claimable — next agent run will settle on-chain.")

// Also reset any settled payments so the next run re-attempts them
const reset = await db.payment.updateMany({
  where: { artistId: artist.id, settled: true, circlePayId: null },
  data: { settled: false, settledAt: null },
})
console.log(`Reset ${reset.count} pending payments to unsettled.`)

await db.$disconnect()
