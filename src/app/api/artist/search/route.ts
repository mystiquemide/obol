import { NextResponse } from "next/server"

const MB_BASE = "https://musicbrainz.org/ws/2"
const MB_HEADERS = {
  "User-Agent": "Obol/1.0 (obol.app; mide27145@gmail.com)",
  Accept: "application/json",
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim()
  if (!q) return NextResponse.json({ artists: [] })

  try {
    const query = encodeURIComponent(`artist:"${q}"`)
    const res = await fetch(`${MB_BASE}/artist?query=${query}&limit=5&fmt=json`, { headers: MB_HEADERS })
    if (!res.ok) return NextResponse.json({ artists: [] })
    const data = await res.json()

    const artists = (data.artists ?? []).slice(0, 5).map((a: Record<string, unknown>) => ({
      id: a.id,
      name: a.name,
      disambiguation: a.disambiguation ?? "",
      score: a.score,
    }))

    return NextResponse.json({ artists })
  } catch {
    return NextResponse.json({ artists: [] })
  }
}
