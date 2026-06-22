import { NextResponse } from "next/server"
import { db, dbRetry } from "@/lib/db"

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "track"
}
function rand(): string {
  return Math.random().toString(36).slice(2, 6)
}

// An artist lists themselves: name + wallet + tracks. Tracks become playable in
// the x402 catalog and earnings settle on-chain to their wallet.
export async function POST(req: Request) {
  const { name, walletAddress, musicBrainzId, tracks } = await req.json()

  if (!name || !walletAddress) {
    return NextResponse.json({ ok: false, error: "Name and wallet address are required" }, { status: 400 })
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return NextResponse.json({ ok: false, error: "Invalid wallet address" }, { status: 400 })
  }
  const trackList: { title: string; priceUsdc?: number }[] = Array.isArray(tracks) ? tracks : []
  const valid = trackList.filter((t) => t?.title?.trim())
  if (valid.length === 0) {
    return NextResponse.json({ ok: false, error: "Add at least one track" }, { status: 400 })
  }

  const mbId = (musicBrainzId as string) || `local-${slugify(name)}`

  // Guard: don't let someone re-point an already-claimed artist to a new wallet.
  const existing = await dbRetry(() => db.artist.findUnique({ where: { musicBrainzId: mbId } }))
  if (existing?.circleWalletId && existing.circleWalletId.toLowerCase() !== walletAddress.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "This artist is already claimed to a different wallet" }, { status: 409 })
  }

  const artist = await dbRetry(() =>
    db.artist.upsert({
      where: { musicBrainzId: mbId },
      update: { circleWalletId: walletAddress },
      create: {
        musicBrainzId: mbId,
        name,
        circleWalletId: walletAddress,
        resolvedVia: "Self-listed",
        resolvedNote: "Artist onboarded their own catalog",
      },
    })
  )

  const created: { slug: string; title: string }[] = []
  for (const t of valid) {
    const slug = `${slugify(t.title)}-${rand()}`
    const price = typeof t.priceUsdc === "number" && t.priceUsdc > 0 ? t.priceUsdc : 0.001
    try {
      await dbRetry(() =>
        db.track.create({
          data: { slug, title: t.title.trim(), artistId: artist.id, priceUsdc: price, duration: "", audioUrl: "/audio/default.wav" },
        })
      )
      created.push({ slug, title: t.title.trim() })
    } catch {
      // skip on collision
    }
  }

  return NextResponse.json({ ok: true, artist: { name: artist.name, mbId: artist.musicBrainzId }, tracks: created })
}
