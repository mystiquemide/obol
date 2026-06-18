import { anthropic } from "@/lib/ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { prompt } = await req.json()

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  })

  return NextResponse.json({ text: response.content[0]?.text })
}
