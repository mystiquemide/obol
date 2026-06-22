import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()
const r = await db.x402Redemption.findMany({ orderBy: { createdAt: "desc" }, take: 5 })
console.log("redemptions:", r.length)
for (const x of r) console.log("  ", x.trackId, x.txHash.slice(0, 16), "$" + x.amountUsdc)
const p = await db.payment.findFirst({ where: { scrobbleKey: { startsWith: "x402:" } }, orderBy: { createdAt: "desc" }, include: { artist: true } })
console.log("x402 payment:", p ? `${p.trackTitle} -> ${p.artist.name}, tx ${p.txHash.slice(0, 16)}, earned now $${p.artist.totalEarned}` : "none")
await db.$disconnect()
