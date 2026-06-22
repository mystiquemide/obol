import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const { navidromeUrl, navidromeUser, navidromePass, ratePerListen } =
    await req.json()

  // Verify connection
  try {
    const params = new URLSearchParams({
      u: navidromeUser,
      p: navidromePass,
      v: "1.16.1",
      c: "obol",
      f: "json",
    })
    const res = await fetch(`${navidromeUrl}/rest/ping.view?${params}`)
    const data = await res.json()
    if (data["subsonic-response"]?.status !== "ok") {
      return NextResponse.json(
        { ok: false, error: "Could not connect to Navidrome" },
        { status: 400 }
      )
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "Navidrome server unreachable" },
      { status: 400 }
    )
  }

  const listener = await db.listener.upsert({
    where: { id: "default" },
    update: { navidromeUrl, navidromeUser, navidromePass, ratePerListen: ratePerListen ?? 0.001 },
    create: {
      id: "default",
      navidromeUrl,
      navidromeUser,
      navidromePass,
      ratePerListen: ratePerListen ?? 0.001,
    },
  })

  return NextResponse.json({ ok: true, listener })
}

export async function PATCH(req: Request) {
  const { ratePerListen, dailyCapUsdc } = await req.json()
  const listener = await db.listener.findFirst({ orderBy: { createdAt: "asc" } })
  if (!listener) return NextResponse.json({ ok: false, error: "No listener found" }, { status: 404 })
  const updated = await db.listener.update({
    where: { id: listener.id },
    data: {
      ...(ratePerListen !== undefined ? { ratePerListen } : {}),
      ...(dailyCapUsdc !== undefined ? { dailyCapUsdc } : {}),
    },
  })
  return NextResponse.json({ ok: true, listener: updated })
}

export async function GET() {
  const listener = await db.listener.findFirst({ orderBy: { createdAt: "asc" } })
  return NextResponse.json({ listener })
}
