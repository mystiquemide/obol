// Restore dumped SQLite data into Postgres. Run AFTER `prisma db push`.
import { PrismaClient } from "@prisma/client"
import { readFileSync } from "fs"

const db = new PrismaClient()
const dump = JSON.parse(readFileSync("recovery/db-dump.json", "utf8"))

// Listeners first (no FK deps)
for (const l of dump.listeners) {
  await db.listener.upsert({
    where: { id: l.id },
    update: {},
    create: {
      id: l.id,
      navidromeUrl: l.navidromeUrl,
      navidromeUser: l.navidromeUser,
      navidromePass: l.navidromePass,
      circleWalletId: l.circleWalletId,
      ratePerListen: l.ratePerListen,
      createdAt: new Date(l.createdAt),
    },
  })
}

// Artists next (no FK deps)
for (const a of dump.artists) {
  await db.artist.upsert({
    where: { id: a.id },
    update: {},
    create: {
      id: a.id,
      musicBrainzId: a.musicBrainzId,
      name: a.name,
      circleWalletId: a.circleWalletId,
      totalEarned: a.totalEarned,
      createdAt: new Date(a.createdAt),
    },
  })
}

// Payments (FK on listener + artist). Generate a scrobbleKey for legacy rows.
for (const p of dump.payments) {
  await db.payment.upsert({
    where: { id: p.id },
    update: {},
    create: {
      id: p.id,
      listenerId: p.listenerId,
      artistId: p.artistId,
      trackTitle: p.trackTitle,
      amountUsdc: p.amountUsdc,
      settled: p.settled,
      settledAt: p.settledAt ? new Date(p.settledAt) : null,
      circlePayId: p.circlePayId,
      scrobbledAt: new Date(p.scrobbledAt),
      scrobbleKey: `imported:${p.id}`,
      createdAt: new Date(p.createdAt),
    },
  })
}

// Agent runs (no FK)
for (const r of dump.agentRuns) {
  await db.agentRun.upsert({
    where: { id: r.id },
    update: {},
    create: {
      id: r.id,
      scrobbleCount: r.scrobbleCount,
      resolvedCount: r.resolvedCount,
      paymentCount: r.paymentCount,
      totalUsdc: r.totalUsdc,
      status: r.status,
      errorMessage: r.errorMessage,
      startedAt: new Date(r.startedAt),
      finishedAt: new Date(r.finishedAt),
      createdAt: new Date(r.createdAt),
    },
  })
}

const [lc, ac, pc, rc] = await Promise.all([
  db.listener.count(),
  db.artist.count(),
  db.payment.count(),
  db.agentRun.count(),
])
console.log(`Imported into Postgres: listeners ${lc}, artists ${ac}, payments ${pc}, agentRuns ${rc}`)

await db.$disconnect()
