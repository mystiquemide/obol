// LLM-powered artist disambiguation for the agent loop.
// When MusicBrainz returns several candidates for a track, the agent reasons
// about which one is the real performing artist instead of blindly taking [0].
//
// Provider-agnostic: defaults to Groq (free tier, fast, OpenAI-compatible) when
// GROQ_API_KEY is set, otherwise Anthropic. MOCK_LLM=true short-circuits the
// network call so the whole chain can be verified without any credits.
import Anthropic from "@anthropic-ai/sdk"

function provider(): "groq" | "anthropic" {
  if (process.env.LLM_PROVIDER === "groq" || process.env.LLM_PROVIDER === "anthropic") {
    return process.env.LLM_PROVIDER
  }
  return process.env.GROQ_API_KEY ? "groq" : "anthropic"
}

const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile"
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001"

let anthropic: Anthropic | null = null
function getAnthropic() {
  if (!anthropic) anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return anthropic
}

// Single completion call. Returns the raw text the model produced.
// `via` reports which model answered, for the agent log.
async function complete(prompt: string): Promise<{ text: string; via: string }> {
  if (process.env.MOCK_LLM === "true") {
    const m = prompt.match(/id=([^\s|]+)/i)
    const text = JSON.stringify({
      id: m ? m[1] : "",
      reason: "(mock) top match score and the artist type fits the track",
    })
    return { text, via: "mock" }
  }

  if (provider() === "groq") {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 200,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
    })
    if (!res.ok) {
      throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 100)}`)
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    return { text: data.choices?.[0]?.message?.content ?? "", via: `Groq ${GROQ_MODEL}` }
  }

  // Anthropic
  const res = await getAnthropic().messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  })
  const block = res.content[0]
  const text = block?.type === "text" ? block.text : ""
  return { text, via: `Claude ${ANTHROPIC_MODEL}` }
}

export interface ArtistCandidate {
  id: string
  name: string
  disambiguation?: string
  type?: string
  country?: string
  score?: number
}

export interface Disambiguation {
  chosenId: string | null
  reasoning: string
  usedLlm: boolean
  via?: string
}

export async function disambiguateArtist(params: {
  trackTitle: string
  artistName: string
  candidates: ArtistCandidate[]
}): Promise<Disambiguation> {
  const { trackTitle, artistName, candidates } = params
  if (candidates.length === 0) return { chosenId: null, reasoning: "no candidates", usedLlm: false }
  if (candidates.length === 1)
    return { chosenId: candidates[0].id, reasoning: "single candidate", usedLlm: false }

  const list = candidates
    .map(
      (c, i) =>
        `${i + 1}. id=${c.id} | name="${c.name}"` +
        (c.disambiguation ? ` | note: ${c.disambiguation}` : "") +
        (c.type ? ` | type: ${c.type}` : "") +
        (c.country ? ` | country: ${c.country}` : "") +
        (c.score != null ? ` | mbScore: ${c.score}` : "")
    )
    .join("\n")

  const prompt = `A listener just played the track "${trackTitle}" credited to "${artistName}". MusicBrainz returned these candidate artists:

${list}

Which single candidate is most likely the real performing artist of this track? Consider the artist type, disambiguation notes, and match score. Reply with ONLY a JSON object, no prose: {"id": "<chosen id>", "reason": "<one short sentence>"}.`

  try {
    const { text, via } = await complete(prompt)
    const slice = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)
    const parsed = JSON.parse(slice) as { id?: string; reason?: string }
    const chosen = candidates.find((c) => c.id === parsed.id)
    if (!chosen)
      return { chosenId: candidates[0].id, reasoning: "model picked an unknown id, used top match", usedLlm: true, via }
    return { chosenId: chosen.id, reasoning: parsed.reason ?? "chosen by the model", usedLlm: true, via }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      chosenId: candidates[0].id,
      reasoning: `LLM unavailable (${msg.slice(0, 60)}), used top match`,
      usedLlm: false,
    }
  }
}
