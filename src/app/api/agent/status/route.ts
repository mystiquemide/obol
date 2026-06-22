import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const [
    runs,
    recentPayments,
    topArtists,
    settledAgg,
    settledCount,
    pendingCount,
    artistCount,
    todayAgg,
  ] = await Promise.all([
    db.agentRun.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    db.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { artist: true },
    }),
    db.artist.findMany({ orderBy: { totalEarned: "desc" }, take: 10 }),
    // Lifetime totals over the WHOLE table, not just the recent window
    db.payment.aggregate({ _sum: { amountUsdc: true }, where: { settled: true } }),
    db.payment.count({ where: { settled: true } }),
    db.payment.count({ where: { settled: false } }),
    db.artist.count(),
    db.payment.aggregate({ _sum: { amountUsdc: true }, where: { createdAt: { gte: startOfDay } } }),
  ])

  const totalPaid = settledAgg._sum.amountUsdc ?? 0
  const spentToday = todayAgg._sum.amountUsdc ?? 0

  return NextResponse.json({
    lastRun: runs[0] ?? null,
    recentRuns: runs,
    recentPayments,
    topArtists,
    stats: {
      totalPaid,
      settledCount,
      pendingCount,
      artistCount,
      spentToday,
    },
  })
}
