// Seed the x402 catalog into the Track table (DB-backed catalog).
import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()

const TRACKS = [
  { slug: "cipher", title: "Cipher", mbId: "8292bf44-2dd1-4bad-8019-276ec38f28e7", price: 0.001, duration: "2:54" },
  { slug: "atlantis", title: "Atlantis", mbId: "8292bf44-2dd1-4bad-8019-276ec38f28e7", price: 0.001, duration: "3:21" },
  { slug: "destiny-day", title: "Destiny Day", mbId: "8292bf44-2dd1-4bad-8019-276ec38f28e7", price: 0.0025, duration: "2:08" },
  { slug: "upbeat-party", title: "Upbeat Party", mbId: "local-scott-holmes", price: 0.0015, duration: "3:02" },
  { slug: "inspiring-corporate", title: "Inspiring Corporate", mbId: "local-scott-holmes", price: 0.001, duration: "2:39" },
  { slug: "poupi-the-bird", title: "Poupi the Bird", mbId: "local-komiku", price: 0.0005, duration: "1:47" },
  { slug: "the-builder", title: "The Builder", mbId: "local-komiku", price: 0.001, duration: "2:15" },
]

for (const t of TRACKS) {
  const artist = await db.artist.findUnique({ where: { musicBrainzId: t.mbId } })
  if (!artist) {
    console.log(`SKIP ${t.title}: artist ${t.mbId} not found`)
    continue
  }
  await db.track.upsert({
    where: { slug: t.slug },
    update: { title: t.title, artistId: artist.id, priceUsdc: t.price, duration: t.duration, audioUrl: `/audio/${t.slug}.wav` },
    create: { slug: t.slug, title: t.title, artistId: artist.id, priceUsdc: t.price, duration: t.duration, audioUrl: `/audio/${t.slug}.wav` },
  })
  console.log(`seeded ${t.title} -> ${artist.name}`)
}
const count = await db.track.count()
console.log(`total tracks: ${count}`)
await db.$disconnect()
