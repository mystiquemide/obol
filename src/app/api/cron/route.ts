import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { runAgent } from "@/lib/agent/runner"

// Called by Vercel Cron every 5 minutes
export async function GET(req: Request) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const listener = await db.listener.findFirst({ orderBy: { createdAt: "asc" } })
    if (!listener) {
      return NextResponse.json({ ok: false, error: "No listener configured" })
    }

    const result = await runAgent(listener.id)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
