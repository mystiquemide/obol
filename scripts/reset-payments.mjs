import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()
const r = await db.payment.updateMany({ where: { settled: true, circlePayId: null }, data: { settled: false, settledAt: null } })
console.log("Reset:", r.count, "payments to unsettled")
await db.$disconnect()
