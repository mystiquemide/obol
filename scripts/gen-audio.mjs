// Generate short, pleasant demo audio clips (WAV) for the x402 catalog.
// Seeded pentatonic melody + soft pad. Not "real music" — clearly demo audio —
// but it plays reliably in any browser and matches each track's key.
import { mkdirSync, writeFileSync } from "fs"

const SR = 22050
const SECONDS = 14

function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PENTA = [0, 2, 4, 7, 9, 12, 14, 16] // major pentatonic semitone offsets

function noteFreq(rootMidi, semi) {
  return 440 * Math.pow(2, (rootMidi + semi - 69) / 12)
}

function bell(t, freq) {
  // sine + soft harmonics, exponential decay (bell/marimba-ish)
  const env = Math.exp(-t * 3.2)
  const s =
    Math.sin(2 * Math.PI * freq * t) +
    0.5 * Math.sin(2 * Math.PI * freq * 2 * t) +
    0.25 * Math.sin(2 * Math.PI * freq * 3 * t)
  return env * s
}

function genTrack({ rootMidi, bpm, seed }) {
  const total = SR * SECONDS
  const buf = new Float32Array(total)
  const beat = 60 / bpm
  const noteLen = beat / 2 // eighth notes
  const rand = mulberry32(seed)

  // melody
  const notesCount = Math.floor(SECONDS / noteLen)
  let prev = 0
  for (let n = 0; n < notesCount; n++) {
    // gentle random walk over the pentatonic scale
    prev = Math.max(0, Math.min(PENTA.length - 1, prev + Math.round((rand() - 0.5) * 4)))
    const freq = noteFreq(rootMidi, PENTA[prev])
    const start = Math.floor(n * noteLen * SR)
    const dur = Math.floor(noteLen * 1.8 * SR)
    for (let i = 0; i < dur && start + i < total; i++) {
      const t = i / SR
      buf[start + i] += 0.5 * bell(t, freq)
    }
  }

  // soft pad: root + fifth, slow tremolo
  for (let i = 0; i < total; i++) {
    const t = i / SR
    const trem = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.15 * t)
    const root = noteFreq(rootMidi - 12, 0)
    const fifth = noteFreq(rootMidi - 12, 7)
    const pad = 0.12 * trem * (Math.sin(2 * Math.PI * root * t) + 0.7 * Math.sin(2 * Math.PI * fifth * t))
    // global fade in/out
    let fade = 1
    if (t < 0.5) fade = t / 0.5
    if (t > SECONDS - 1.5) fade = Math.max(0, (SECONDS - t) / 1.5)
    buf[i] = (buf[i] + pad) * fade
  }

  return buf
}

function toWav(samples) {
  // soft-clip and convert to 16-bit PCM
  const data = Buffer.alloc(samples.length * 2)
  let peak = 0
  for (const s of samples) peak = Math.max(peak, Math.abs(s))
  const norm = peak > 0 ? 0.85 / peak : 1
  for (let i = 0; i < samples.length; i++) {
    let v = Math.tanh(samples[i] * norm)
    data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), i * 2)
  }
  const header = Buffer.alloc(44)
  header.write("RIFF", 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write("WAVE", 8)
  header.write("fmt ", 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(1, 22) // mono
  header.writeUInt32LE(SR, 24)
  header.writeUInt32LE(SR * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write("data", 36)
  header.writeUInt32LE(data.length, 40)
  return Buffer.concat([header, data])
}

const TRACKS = {
  cipher: { rootMidi: 57, bpm: 96, seed: 11 }, // A minor-ish
  atlantis: { rootMidi: 60, bpm: 84, seed: 22 }, // C
  "destiny-day": { rootMidi: 62, bpm: 110, seed: 33 }, // D
  "upbeat-party": { rootMidi: 64, bpm: 124, seed: 44 }, // E
  "inspiring-corporate": { rootMidi: 65, bpm: 100, seed: 55 }, // F
  "poupi-the-bird": { rootMidi: 67, bpm: 132, seed: 66 }, // G
  "the-builder": { rootMidi: 59, bpm: 108, seed: 77 }, // B
  default: { rootMidi: 60, bpm: 100, seed: 88 },
}

mkdirSync("public/audio", { recursive: true })
for (const [slug, cfg] of Object.entries(TRACKS)) {
  const wav = toWav(genTrack(cfg))
  writeFileSync(`public/audio/${slug}.wav`, wav)
  console.log(`public/audio/${slug}.wav (${(wav.length / 1024).toFixed(0)} KB)`)
}
console.log("done")
