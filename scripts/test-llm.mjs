// Validate the Anthropic model ID + key with the disambiguation prompt.
import Anthropic from "@anthropic-ai/sdk"
import { readFileSync } from "fs"

const env = readFileSync(".env", "utf8")
for (const line of env.split("\n")) {
  const [k, ...v] = line.split("=")
  if (k && v.length) process.env[k.trim()] = v.join("=").replace(/^"|"$/g, "").trim()
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const prompt = `A listener just played the track "One More Time" credited to "Daft Punk". MusicBrainz returned these candidate artists:

1. id=aaa | name="Daft Punk" | note: French electronic duo | type: Group | country: FR | mbScore: 100
2. id=bbb | name="Daft Punk" | note: tribute act | type: Group | mbScore: 72
3. id=ccc | name="Daft Punk Tribute" | type: Group | mbScore: 55

Which single candidate is most likely the real performing artist of this track? Reply with ONLY a JSON object, no prose: {"id": "<chosen id>", "reason": "<one short sentence>"}.`

const models = ["claude-haiku-4-5-20251001", "claude-sonnet-4-6", "claude-3-5-haiku-latest"]

for (const model of models) {
  try {
    const res = await client.messages.create({
      model,
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    })
    const block = res.content[0]
    const text = block?.type === "text" ? block.text : ""
    console.log(`[OK] ${model} -> ${text.replace(/\n/g, " ")}`)
    break
  } catch (e) {
    console.log(`[FAIL] ${model} -> ${e?.status ?? ""} ${e?.message?.slice(0, 120)}`)
  }
}
