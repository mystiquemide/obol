// Verify the Groq key + model with the real disambiguation prompt.
import { readFileSync } from "fs"

const env = readFileSync(".env", "utf8")
for (const line of env.split("\n")) {
  const [k, ...v] = line.split("=")
  if (k && v.length) process.env[k.trim()] = v.join("=").replace(/^"|"$/g, "").trim()
}

// 1. List models to confirm our model id is valid.
const models = await fetch("https://api.groq.com/openai/v1/models", {
  headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
})
console.log("models status", models.status)
const md = await models.json()
const ids = (md.data ?? []).map((m) => m.id)
console.log("our model present:", ids.includes(process.env.GROQ_MODEL), "(", process.env.GROQ_MODEL, ")")

// 2. Real disambiguation call.
const prompt = `A listener just played the track "Smells Like Teen Spirit" credited to "Nirvana". MusicBrainz returned these candidate artists:

1. id=5b11f4ce-a62d-471e-81fc-a69a8278c7da | name="Nirvana" | note: 1980s-1990s US grunge band | type: Group | country: US | mbScore: 100
2. id=9282c8b4-ca0b-4c6b-b7e3-4f7762dfde4b | name="Nirvana" | note: 60s band from the UK | type: Group | country: GB | mbScore: 75
3. id=abc | name="Approaching Nirvana" | type: Group | mbScore: 73

Which single candidate is most likely the real performing artist of this track? Consider the artist type, disambiguation notes, and match score. Reply with ONLY a JSON object, no prose: {"id": "<chosen id>", "reason": "<one short sentence>"}.`

const t0 = Date.now()
const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
  body: JSON.stringify({
    model: process.env.GROQ_MODEL,
    max_tokens: 200,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  }),
})
console.log("chat status", res.status, "latency", Date.now() - t0, "ms")
const data = await res.json()
console.log("raw:", data.choices?.[0]?.message?.content ?? JSON.stringify(data).slice(0, 200))
