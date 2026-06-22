import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Returns how much USDC is waiting for an artist, looked up by MusicBrainz ID.
// Drives the "you have money waiting" moment on /artists before the artist claims.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mbId = searchParams.get("mbId")?.trim()
  if (!mbId) {
    return NextResponse.json({ ok: false, error: "Missing mbId" }, { status: 400 })
  }

  const artist = await db.artist.findUnique({
    where: { musicBrainzId: mbId },
    select: { name: true, totalEarned: true, circleWalletId: true },
  })

  if (!artist) {
    // Artist has never been paid yet — nothing in escrow, not claimed.
    return NextResponse.json({ ok: true, exists: false, totalEarned: 0, claimed: false })
  }

  return NextResponse.json({
    ok: true,
    exists: true,
    name: artist.name,
    totalEarned: artist.totalEarned,
    claimed: artist.circleWalletId !== null,
  })
}
