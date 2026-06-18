import { openai } from "@/lib/ai"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { prompt } = await req.json()

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
  })

  return NextResponse.json({ text: response.choices[0]?.message?.content })
}
