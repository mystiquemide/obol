// Remove the "Nova Sound" onboarding test artist and its data.
import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()

const artist = await db.artist.findFirst({ where: { name: "Nova Sound" } })
if (!artist) {
  console.log("Nova Sound not found — nothing to clean.")
} else {
  const tracks = await db.track.findMany({ where: { artistId: artist.id } })
  const slugs = tracks.map((t) => t.slug)
  const delРed = await db.x402Redemption.deleteMany({ where: { trackId: { in: slugs } } })
  const delPay = await db.payment.deleteMany({ where: { artistId: artist.id } })
  const delTrk = await db.track.deleteMany({ where: { artistId: artist.id } })
  await db.artist.delete({ where: { id: artist.id } })
  console.log(`Removed Nova Sound: ${delTrk.count} tracks, ${delPay.count} payments, ${delРed.count} redemptions, 1 artist.`)
}

await db.$disconnect()
