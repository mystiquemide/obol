"use client"

import { useEffect, useRef, useState } from "react"
import { txUrl, shortHash } from "@/lib/explorer"

const MONO = "var(--font-ibm-plex-mono), monospace"
const ALPINA = "var(--font-alpina)"

interface CatalogTrack {
  id: string
  title: string
  artist: string
  priceUsdc: number
  duration: string
  payTo: string
}

interface Step {
  label: string
  detail?: string
  done?: boolean
}

interface PlayState {
  steps: Step[]
  challenge?: { amountUsdc: number; payTo: string; network: string }
  txHash?: string
  unlocked?: boolean
  nowPlaying?: { title: string; artist: string; audioUrl: string | null }
  error?: string
}

export default function Listen() {
  const [tracks, setTracks] = useState<CatalogTrack[]>([])
  const [catalogStatus, setCatalogStatus] = useState<"loading" | "ready" | "error">("loading")
  const [active, setActive] = useState<string | null>(null)
  const [state, setState] = useState<PlayState>({ steps: [] })
  const audioRef = useRef<HTMLAudioElement>(null)

  function loadCatalog() {
    setCatalogStatus("loading")
    fetch("/api/x402/catalog")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json()
      })
      .then((d) => {
        setTracks(d.tracks ?? [])
        setCatalogStatus("ready")
      })
      .catch(() => setCatalogStatus("error"))
  }
  useEffect(() => {
    loadCatalog()
  }, [])

  // Play the unlocked track once its audio is set.
  useEffect(() => {
    const url = state.nowPlaying?.audioUrl
    if (url && audioRef.current) {
      audioRef.current.muted = false
      audioRef.current.src = url
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }, [state.nowPlaying?.audioUrl])

  async function play(track: CatalogTrack) {
    if (active) return
    // Prime the audio element within the user gesture so it can autoplay later,
    // after the payment, when browsers would otherwise block programmatic play.
    if (audioRef.current) {
      audioRef.current.muted = true
      audioRef.current.play().catch(() => {})
    }
    setActive(track.id)
    setState({ steps: [] })

    try {
      const res = await fetch(`/api/x402/play/${track.id}`, { method: "POST" })
      if (!res.body) {
        setState((s) => ({ ...s, error: "no stream" }))
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split("\n\n")
        buffer = parts.pop() ?? ""
        for (const part of parts) {
          const t = part.trim()
          if (!t.startsWith("data:")) continue
          let msg: Record<string, unknown>
          try {
            msg = JSON.parse(t.slice(t.indexOf("data:") + 5).trim())
          } catch {
            continue
          }
          applyEvent(msg)
        }
      }
    } catch (e) {
      setState((s) => ({ ...s, error: String(e) }))
    } finally {
      setActive(null)
    }
  }

  function applyEvent(msg: Record<string, unknown>) {
    setState((prev) => {
      const next: PlayState = { ...prev, steps: [...prev.steps] }
      if (next.steps.length) next.steps[next.steps.length - 1] = { ...next.steps[next.steps.length - 1], done: true }
      switch (msg.type) {
        case "step":
          next.steps.push({ label: String(msg.label), detail: msg.detail ? String(msg.detail) : undefined })
          break
        case "challenge":
          next.challenge = { amountUsdc: Number(msg.amountUsdc), payTo: String(msg.payTo), network: String(msg.network) }
          next.steps.push({ label: "402 Payment Required", detail: `${msg.amountUsdc} USDC → ${shortHash(String(msg.payTo))}`, done: true })
          break
        case "settled":
          next.txHash = String(msg.txHash)
          next.steps.push({ label: "Settled on Arc", detail: shortHash(String(msg.txHash)), done: true })
          break
        case "unlocked": {
          next.unlocked = true
          const r = msg.resource as { track?: { title?: string; artist?: string; audioUrl?: string | null } } | undefined
          if (r?.track) {
            next.nowPlaying = {
              title: String(r.track.title ?? ""),
              artist: String(r.track.artist ?? ""),
              audioUrl: r.track.audioUrl ?? null,
            }
          }
          break
        }
        case "done":
          if (next.steps.length) next.steps[next.steps.length - 1].done = true
          break
        case "error":
          next.error = String(msg.error)
          break
      }
      return next
    })
  }

  return (
    <div className="mobile-page" style={{ background: "#0F0F0F", minHeight: "100vh" }}>
      <section style={{ paddingTop: "160px", paddingBottom: "40px", paddingLeft: "120px", paddingRight: "120px" }}>
        <span style={{ fontFamily: MONO, fontSize: "11px", color: "#6B665E", textTransform: "uppercase", letterSpacing: "-0.22px" }}>
          x402 · pay-per-play
        </span>
        <h1 style={{ fontFamily: ALPINA, fontWeight: 400, fontSize: "44px", color: "#E1DDD6", lineHeight: "48px", letterSpacing: "-0.5px", margin: "16px 0 0" }}>
          Press play. Pay the artist.
        </h1>
        <p style={{ fontFamily: MONO, fontSize: "13px", color: "#6B665E", maxWidth: "560px", margin: "16px 0 0", lineHeight: "19px" }}>
          No subscription, no server, no wallet popup. Each play hits an HTTP 402, settles a USDC nanopayment to the artist on Arc, and unlocks, in about a second.
        </p>
      </section>

      <section style={{ padding: "20px 120px 160px" }}>
        {catalogStatus === "loading" && (
          <p style={{ fontFamily: MONO, fontSize: "13px", color: "#6B665E" }}>Loading catalog…</p>
        )}
        {catalogStatus === "error" && (
          <div>
            <p style={{ fontFamily: MONO, fontSize: "13px", color: "#6B665E", margin: 0 }}>
              Couldn&apos;t load the catalog.
            </p>
            <button
              type="button"
              onClick={loadCatalog}
              style={{ fontFamily: MONO, fontSize: "12px", color: "#10B981", background: "none", border: "none", padding: 0, marginTop: "10px", textTransform: "uppercase", cursor: "pointer", borderBottom: "1px solid rgba(16,185,129,0.4)" }}
            >
              Retry
            </button>
          </div>
        )}
        {catalogStatus === "ready" && tracks.length === 0 && (
          <p style={{ fontFamily: MONO, fontSize: "13px", color: "#6B665E" }}>
            No tracks yet. Artists can list their music on the For Artists page.
          </p>
        )}
        {catalogStatus === "ready" &&
          Array.from(new Set(tracks.map((t) => t.artist))).map((artistName) => (
          <div key={artistName} style={{ marginBottom: "40px" }}>
            <span style={{ fontFamily: MONO, fontSize: "11px", color: "#6B665E", textTransform: "uppercase", letterSpacing: "-0.22px" }}>
              {artistName}
            </span>
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "1px", background: "rgba(225,221,214,0.08)" }}>
              {tracks.filter((t) => t.artist === artistName).map((t) => (
            <div
              key={t.id}
              className="stack-mobile"
              style={{ display: "flex", alignItems: "center", gap: "32px", background: "#0F0F0F", padding: "24px 0" }}
            >
              <button
                type="button"
                onClick={() => play(t)}
                disabled={!!active}
                aria-label={`Play ${t.title}`}
                style={{
                  fontFamily: MONO,
                  fontSize: "12px",
                  color: active === t.id ? "#10B981" : "#0F0F0F",
                  background: active === t.id ? "transparent" : "#E1DDD6",
                  border: active === t.id ? "1px solid #10B981" : "none",
                  padding: "10px 18px",
                  textTransform: "uppercase",
                  cursor: active ? "not-allowed" : "pointer",
                  opacity: active && active !== t.id ? 0.4 : 1,
                  minWidth: "92px",
                }}
              >
                {active === t.id ? "Paying…" : "▶ Play"}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: ALPINA, fontSize: "22px", color: "#E1DDD6", lineHeight: "26px" }}>{t.title}</div>
                <div style={{ fontFamily: MONO, fontSize: "12px", color: "#6B665E", marginTop: "2px" }}>
                  {t.artist} · {t.duration}
                </div>
              </div>
              <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: "14px", color: "#10B981" }}>
                ${t.priceUsdc.toFixed(4)}
              </div>
            </div>
              ))}
            </div>
          </div>
        ))}

        {/* Always-mounted audio so it can be primed on the Play click */}
        <audio
          ref={audioRef}
          controls
          style={{
            marginTop: "32px",
            width: "100%",
            maxWidth: "420px",
            display: state.unlocked && state.nowPlaying ? "block" : "none",
          }}
        />

        {/* Live handshake panel */}
        {(state.steps.length > 0 || state.error) && (
          <div style={{ marginTop: "48px", borderTop: "1px solid rgba(225,221,214,0.08)", paddingTop: "32px" }}>
            <span style={{ fontFamily: MONO, fontSize: "11px", color: "#6B665E", textTransform: "uppercase", letterSpacing: "-0.22px" }}>
              x402 handshake
            </span>
            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {state.steps.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                  <span style={{ fontFamily: MONO, fontSize: "12px", color: s.done ? "#10B981" : "#6B665E", minWidth: "16px" }}>
                    {s.done ? "✓" : "·"}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: "13px", color: "#E1DDD6" }}>{s.label}</span>
                  {s.detail && <span style={{ fontFamily: MONO, fontSize: "12px", color: "#6B665E" }}>{s.detail}</span>}
                </div>
              ))}
            </div>

            {state.txHash && (
              <a
                href={txUrl(state.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: MONO, fontSize: "12px", color: "#10B981", textDecoration: "none", borderBottom: "1px solid rgba(16,185,129,0.4)", display: "inline-block", marginTop: "20px" }}
              >
                View payment on Arc · {shortHash(state.txHash)} ↗
              </a>
            )}

            {state.unlocked && state.nowPlaying && (
              <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="pulse-dot" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                <span style={{ fontFamily: MONO, fontSize: "13px", color: "#10B981" }}>
                  Now playing — {state.nowPlaying.title} · {state.nowPlaying.artist}
                </span>
              </div>
            )}

            {state.error && (
              <p style={{ fontFamily: MONO, fontSize: "12px", color: "#6B665E", marginTop: "16px" }}>Error: {state.error}</p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
