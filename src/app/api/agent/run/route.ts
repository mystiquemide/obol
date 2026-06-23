import { db } from "@/lib/db"
import { runAgent } from "@/lib/agent/runner"
import { rateLimit, clientIp } from "@/lib/ratelimit"

// Streams the agent run as newline-delimited JSON events so the dashboard
// can show the log live instead of waiting for the whole run to finish.
export async function POST(req: Request) {
  const rl = rateLimit(`run:${clientIp(req)}`, 6, 60_000)
  if (!rl.ok) {
    return new Response(JSON.stringify({ ok: false, error: "You're going a bit fast. Give it a few seconds and try again." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(rl.retryAfter) },
    })
  }

  const body = await req.json().catch(() => ({}))
  const demo = !!body.demo

  // Get or create the default listener up front so errors surface cleanly.
  // Always the oldest listener so every route operates on the same row.
  let listener = await db.listener.findFirst({ orderBy: { createdAt: "asc" } })
  if (!listener) {
    listener = await db.listener.create({
      data: {
        navidromeUrl: process.env.NAVIDROME_URL ?? "http://localhost:4533",
        navidromeUser: process.env.NAVIDROME_USER ?? "",
        navidromePass: process.env.NAVIDROME_PASS ?? "",
        ratePerListen: 0.001,
      },
    })
  }
  const listenerId = listener.id

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))

      try {
        const result = await runAgent(listenerId, {
          forceDemo: demo,
          onLog: (line) => send({ type: "log", line }),
        })
        send({ type: "done", result })
      } catch {
        send({ type: "error", error: "The run stopped early on our end. Give it another try." })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
