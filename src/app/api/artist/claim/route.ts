import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const { musicBrainzId, name, walletAddress } = await req.json()

  if (!musicBrainzId || !walletAddress) {
    return NextResponse.json({ ok: false, error: "Missing musicBrainzId or walletAddress" }, { status: 400 })
  }

  // Basic USDC address validation (EVM hex address)
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return NextResponse.json({ ok: false, error: "That doesn't look like a wallet address. It should start with 0x and be 42 characters." }, { status: 400 })
  }

  // Guard: once an artist is claimed to a wallet, don't let anyone redirect it elsewhere.
  // Re-claiming with the same address is allowed (idempotent).
  const existing = await db.artist.findUnique({ where: { musicBrainzId } })
  if (
    existing?.circleWalletId &&
    existing.circleWalletId.toLowerCase() !== walletAddress.toLowerCase()
  ) {
    return NextResponse.json(
      { ok: false, error: "This artist has already been claimed to a different wallet." },
      { status: 409 }
    )
  }

  const artist = await db.artist.upsert({
    where: { musicBrainzId },
    update: { circleWalletId: walletAddress },
    create: { musicBrainzId, name: name ?? musicBrainzId, circleWalletId: walletAddress },
  })

  const totalEarned = artist.totalEarned

  return NextResponse.json({ ok: true, artist: { id: artist.id, name: artist.name, totalEarned } })
}
