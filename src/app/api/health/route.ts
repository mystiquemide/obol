import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Liveness + database reachability. Used by uptime checks and deploy verification.
export async function GET() {
  let dbUp = false
  try {
    await db.$queryRaw`SELECT 1`
    dbUp = true
  } catch {
    dbUp = false
  }

  return NextResponse.json(
    { status: dbUp ? "ok" : "degraded", db: dbUp ? "up" : "down", time: new Date().toISOString() },
    { status: dbUp ? 200 : 503 }
  )
}
