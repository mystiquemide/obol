// List Anthropic models the key can see (metadata call — works without credits).
import { readFileSync } from "fs"

const env = readFileSync(".env", "utf8")
for (const line of env.split("\n")) {
  const [k, ...v] = line.split("=")
  if (k && v.length) process.env[k.trim()] = v.join("=").replace(/^"|"$/g, "").trim()
}

const res = await fetch("https://api.anthropic.com/v1/models?limit=100", {
  headers: {
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
  },
})
console.log("status", res.status)
const data = await res.json()
if (data.data) {
  for (const m of data.data) console.log(`  ${m.id}  (${m.display_name ?? ""})`)
} else {
  console.log(JSON.stringify(data))
}
