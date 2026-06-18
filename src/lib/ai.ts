import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function streamFromOpenAI(prompt: string) {
  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    stream: true,
  })
  return stream
}

export async function streamFromAnthropic(prompt: string) {
  const stream = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
    stream: true,
  })
  return stream
}
