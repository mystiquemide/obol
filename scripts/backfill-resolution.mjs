// Backfill resolution provenance on artists created before the agent recorded it.
import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()

const artists = await db.artist.findMany({ where: { resolvedVia: null } })
console.log(`Backfilling ${artists.length} artists...`)

for (const a of artists) {
  const isLocal = a.musicBrainzId.startsWith("local-")
  await db.artist.update({
    where: { id: a.id },
    data: {
      resolvedVia: isLocal ? "local" : "MusicBrainz",
      resolvedNote: isLocal
        ? "No MusicBrainz match — tracked under a local id"
        : "Matched to a MusicBrainz artist id",
    },
  })
}
console.log("Done.")
await db.$disconnect()
