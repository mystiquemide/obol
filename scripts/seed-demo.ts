// Seed demo data for Obol dashboard
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

const demoArtists = [
  { name: "Radiohead", mbId: "a74b1b7f-71a5-4011-9441-d0b5e4122711" },
  { name: "Bon Iver", mbId: "c1f9e7c6-72e9-4c83-9ddf-0a89c2c3a748" },
  { name: "Kendrick Lamar", mbId: "381086ea-f511-4aba-bdf9-71c753dc5077" },
  { name: "Phoebe Bridgers", mbId: "3f0df3e0-19c7-4c9a-b6fb-c31e07efcca3" },
  { name: "Frank Ocean", mbId: "320e2cb2-d1a1-4edd-b7c4-b8a90e9e11d7" },
]

const demoTracks = [
  { title: "Karma Police", artist: "Radiohead" },
  { title: "Everything in Its Right Place", artist: "Radiohead" },
  { title: "Skinny Love", artist: "Bon Iver" },
  { title: "Holocene", artist: "Bon Iver" },
  { title: "HUMBLE.", artist: "Kendrick Lamar" },
  { title: "DNA.", artist: "Kendrick Lamar" },
  { title: "Funeral", artist: "Phoebe Bridgers" },
  { title: "Motion Sickness", artist: "Phoebe Bridgers" },
  { title: "Nights", artist: "Frank Ocean" },
  { title: "Ivy", artist: "Frank Ocean" },
  { title: "Street Lights", artist: "Radiohead" },
  { title: "Codex", artist: "Radiohead" },
  { title: "Calgary", artist: "Bon Iver" },
  { title: "Savior Complex", artist: "Phoebe Bridgers" },
  { title: "Self Control", artist: "Frank Ocean" },
]

async function main() {
  console.log("Seeding demo data...")

  // Create or get listener
  const listener = await db.listener.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      navidromeUrl: process.env.NAVIDROME_URL ?? "http://localhost:4533",
      navidromeUser: process.env.NAVIDROME_USER ?? "mystiquemide",
      navidromePass: process.env.NAVIDROME_PASS ?? "olumide",
      ratePerListen: 0.001,
    },
  })

  // Create artists
  const artistMap: Record<string, string> = {}
  for (const a of demoArtists) {
    const artist = await db.artist.upsert({
      where: { musicBrainzId: a.mbId },
      update: {},
      create: { musicBrainzId: a.mbId, name: a.name, totalEarned: 0 },
    })
    artistMap[a.name] = artist.id
    console.log(`  Artist: ${a.name}`)
  }

  // Create payments spread over last 2 hours
  const now = Date.now()
  for (let i = 0; i < demoTracks.length; i++) {
    const track = demoTracks[i]
    const artistId = artistMap[track.artist]
    if (!artistId) continue

    const scrobbledAt = new Date(now - (demoTracks.length - i) * 8 * 60 * 1000)
    const amount = 0.001

    await db.payment.create({
      data: {
        listenerId: listener.id,
        artistId,
        trackTitle: track.title,
        amountUsdc: amount,
        settled: true,
        settledAt: scrobbledAt,
        scrobbledAt,
        scrobbleKey: `seed:${listener.id}:${i}:${scrobbledAt.getTime()}`,
      },
    })

    await db.artist.update({
      where: { id: artistId },
      data: { totalEarned: { increment: amount } },
    })

    console.log(`  Payment: "${track.title}" -> ${track.artist} $${amount}`)
  }

  // Create agent run record
  await db.agentRun.create({
    data: {
      scrobbleCount: demoTracks.length,
      resolvedCount: demoArtists.length,
      paymentCount: demoTracks.length,
      totalUsdc: demoTracks.length * 0.001,
      status: "success",
      startedAt: new Date(now - 60000),
      finishedAt: new Date(now - 58000),
    },
  })

  console.log(`\nDone. ${demoTracks.length} payments seeded across ${demoArtists.length} artists.`)
  console.log(`Total USDC: $${(demoTracks.length * 0.001).toFixed(4)}`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
