import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()
const payments = await db.payment.findMany({
  where: { circlePayId: { not: null } },
  include: { artist: true },
  orderBy: { settledAt: "desc" },
  take: 10,
})
console.log(`Payments with on-chain tx: ${payments.length}`)
for (const p of payments) {
  console.log(`  ${p.artist.name} | $${p.amountUsdc} | tx: ${p.circlePayId} | ${p.settledAt?.toISOString()}`)
}
await db.$disconnect()
