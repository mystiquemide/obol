import { NextResponse } from "next/server"
import { listCatalog } from "@/lib/x402"
import { dbRetry } from "@/lib/db"

export async function GET() {
  const tracks = await dbRetry(() => listCatalog())
  return NextResponse.json({
    tracks: tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      priceUsdc: t.priceUsdc,
      duration: t.duration,
      payTo: t.payTo,
    })),
  })
}
