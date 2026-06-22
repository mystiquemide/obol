import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db

// Neon's free tier autosuspends when idle, so the first query after a pause can
// throw P1001/connection-closed. Retry transparently so callers don't see it.
export async function dbRetry<T>(fn: () => Promise<T>, tries = 4, delayMs = 1500): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < tries; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      const code = (e as { code?: string })?.code
      const msg = e instanceof Error ? e.message : ""
      const isColdStart =
        code === "P1001" ||
        code === "P1017" ||
        msg.includes("Can't reach database server") ||
        msg.includes("Server has closed the connection")
      if (!isColdStart || i === tries - 1) throw e
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
  throw lastErr
}
