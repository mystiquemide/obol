"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { txUrl, shortHash } from "@/lib/explorer"
import { useReveal } from "@/lib/use-reveal"

interface Payment {
  id: string
  trackTitle: string
  amountUsdc: number
  settled: boolean
  settledAt: string | null
  scrobbledAt: string
  txHash: string | null
  artist: { name: string; musicBrainzId: string }
}

interface Artist {
  id: string
  name: string
  musicBrainzId: string
  totalEarned: number
  circleWalletId: string | null
  resolvedVia: string | null
  resolvedNote: string | null
}

interface AgentRun {
  id: string
  scrobbleCount: number
  resolvedCount: number
  paymentCount: number
  totalUsdc: number
  status: string
  startedAt: string
  finishedAt: string
}

interface Stats {
  totalPaid: number
  settledCount: number
  pendingCount: number
  artistCount: number
  spentToday: number
}

export default function Dashboard() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [lastRun, setLastRun] = useState<AgentRun | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [autoRun, setAutoRun] = useState(false)
  const runningRef = useRef(false)

  // Connection form state
  const [serverUrl, setServerUrl] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [connected, setConnected] = useState(false)
  const [connectedUrl, setConnectedUrl] = useState("")
  const [connectedSince, setConnectedSince] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(false)

  // Scroll-reveal handles for each section
  const heroR = useReveal()
  const connectR = useReveal()
  const rateR = useReveal()
  const statsR = useReveal()
  const historyR = useReveal()
  const agentLogR = useReveal()
  const accountR = useReveal()

  // Rate state
  const RATE_PRESETS = [0.0001, 0.001, 0.005, 0.01]
  const [selectedRate, setSelectedRate] = useState(0.001)

  // Daily spend cap
  const CAP_PRESETS = [0.5, 1, 5, 10]
  const [dailyCap, setDailyCap] = useState(1)

  // Load existing connection and rate on mount
  useEffect(() => {
    fetch("/api/listener/setup")
      .then((r) => r.json())
      .then(({ listener }) => {
        if (listener) {
          if (listener.ratePerListen) setSelectedRate(listener.ratePerListen)
          if (typeof listener.dailyCapUsdc === "number") setDailyCap(listener.dailyCapUsdc)
        }
      })
      .catch(() => {})
  }, [])

  const fetchStatus = useCallback(async () => {
    const res = await fetch("/api/agent/status")
    const data = await res.json()
    setPayments(data.recentPayments ?? [])
    setArtists(data.topArtists ?? [])
    setLastRun(data.lastRun ?? null)
    setStats(data.stats ?? null)
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  useEffect(() => {
    runningRef.current = running
  }, [running])

  // Auto-run: while enabled, fire the agent every 30s (skips if a run is in flight).
  const executeRunRef = useRef<((demo: boolean) => Promise<void>) | null>(null)
  useEffect(() => {
    if (!autoRun) return
    const id = setInterval(() => {
      if (!runningRef.current) executeRunRef.current?.(false)
    }, 30000)
    return () => clearInterval(id)
  }, [autoRun])

  // Streams the agent run and appends each log line as it arrives.
  async function executeRun(demo: boolean) {
    setRunning(true)
    setLog([demo ? "Agent starting in demo mode..." : "Agent starting..."])
    let firstLine = true
    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demo }),
      })
      if (!res.body) {
        setLog((prev) => [...prev, "We lost the connection to the agent. Try running it again."])
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
          const trimmed = part.trim()
          if (!trimmed.startsWith("data:")) continue
          const json = trimmed.slice(trimmed.indexOf("data:") + 5).trim()
          let msg: { type: string; line?: string; result?: { log?: string[] }; error?: string }
          try {
            msg = JSON.parse(json)
          } catch {
            continue
          }
          if (msg.type === "log" && msg.line) {
            const line = msg.line
            setLog((prev) => {
              if (firstLine) {
                firstLine = false
                return [line]
              }
              return [...prev, line]
            })
          } else if (msg.type === "done") {
            if (msg.result?.log) setLog(msg.result.log)
            await fetchStatus()
          } else if (msg.type === "error") {
            setLog((prev) => [...prev, msg.error ?? "The run stopped early. Try again."])
          }
        }
      }
    } catch {
      setLog((prev) => [...prev, "We lost the connection to the agent. Try running it again."])
    } finally {
      setRunning(false)
      setDone(true)
      setTimeout(() => setDone(false), 2000)
    }
  }

  async function runDemo() {
    setDemoMode(true)
    setConnected(true)
    setConnectedUrl("Demo mode")
    rateR.ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    await executeRun(true)
  }

  async function runAgent() {
    await executeRun(false)
  }

  executeRunRef.current = executeRun

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    setConnecting(true)
    setConnectError(null)
    try {
      const res = await fetch("/api/listener/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ navidromeUrl: serverUrl, navidromeUser: username, navidromePass: password, ratePerListen: selectedRate }),
      })
      const data = await res.json()
      if (data.ok) {
        setConnected(true)
        setConnectedUrl(serverUrl)
        setConnectedSince(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }))
        await fetchStatus()
      } else {
        setConnectError(data.error ?? "Connection failed")
      }
    } catch {
      setConnectError("Could not reach the server")
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="mobile-page">

      {/* ── Hero strip ── */}
      <section style={{ background: "#0F0F0F", paddingTop: "160px", paddingBottom: "60px", paddingLeft: "120px", paddingRight: "120px" }}>
        <div ref={heroR.ref} style={heroR.style}>
          <a
            href="/"
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 400,
              fontSize: "11px",
              color: "#6B665E",
              textTransform: "uppercase",
              textDecoration: "none",
              display: "inline-block",
              marginBottom: "32px",
            }}
          >
            ← Home
          </a>
          <span
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 500,
              fontSize: "11px",
              color: "#E1DDD6",
              textTransform: "uppercase",
              letterSpacing: "-0.22px",
              display: "block",
            }}
          >
            Dashboard
          </span>
          <h1
            style={{
              fontFamily: "var(--font-alpina)",
              fontWeight: 400,
              fontSize: "40px",
              color: "#E1DDD6",
              lineHeight: "48px",
              letterSpacing: "-0.4px",
              margin: "16px 0",
            }}
          >
            Your music. Your rate.
          </h1>
          <p
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 400,
              fontSize: "14px",
              color: "#6B665E",
              maxWidth: "520px",
              margin: 0,
              lineHeight: "19.6px",
            }}
          >
            Manage your Navidrome connection, payment rate, and history.
          </p>
        </div>
      </section>

      {/* ── Choose your path ── */}
      <section style={{ background: "#0F0F0F", padding: "0 120px 80px" }}>
        <div
          className="paths-row"
          style={{ display: "flex", gap: "1px", background: "rgba(225,221,214,0.12)", border: "1px solid rgba(225,221,214,0.12)" }}
        >
          {/* Listener path */}
          <div className="path-card" style={{ flex: 1, background: "#0F0F0F", padding: "32px 36px" }}>
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", color: "#6B665E", textTransform: "uppercase", letterSpacing: "-0.22px" }}>
              For listeners
            </span>
            <h3 style={{ fontFamily: "var(--font-alpina)", fontWeight: 400, fontSize: "24px", color: "#E1DDD6", lineHeight: "28px", margin: "12px 0 0" }}>
              Just press play
            </h3>
            <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "13px", color: "#6B665E", lineHeight: "19px", margin: "12px 0 0", maxWidth: "340px" }}>
              No server, no setup, no wallet. Play a track and the artist is paid in USDC, instantly. This is the easy way in.
            </p>
            <a
              href="/listen"
              style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "12px", color: "#10B981", textTransform: "uppercase", textDecoration: "none", borderBottom: "1px solid rgba(16,185,129,0.4)", display: "inline-block", marginTop: "20px" }}
            >
              Open the player →
            </a>
          </div>

          {/* Self-hoster path */}
          <div className="path-card" style={{ flex: 1, background: "#0F0F0F", padding: "32px 36px" }}>
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", color: "#6B665E", textTransform: "uppercase", letterSpacing: "-0.22px" }}>
              For self-hosters
            </span>
            <h3 style={{ fontFamily: "var(--font-alpina)", fontWeight: 400, fontSize: "24px", color: "#E1DDD6", lineHeight: "28px", margin: "12px 0 0" }}>
              Connect your library
            </h3>
            <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "13px", color: "#6B665E", lineHeight: "19px", margin: "12px 0 0", maxWidth: "340px" }}>
              Run Navidrome or any Subsonic server? Connect it below and the agent pays artists automatically as you listen.
            </p>
            <button
              type="button"
              onClick={() => connectR.ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "12px", color: "#6B665E", textTransform: "uppercase", background: "none", border: "none", padding: 0, cursor: "pointer", marginTop: "20px" }}
            >
              Set it up below ↓
            </button>
          </div>
        </div>
      </section>

      {/* ── Connection ── */}
      <section style={{ background: "#E1DDD6", padding: "100px 120px" }}>
        <div ref={connectR.ref} style={connectR.style}>

          {/* Label row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {["CONNECTION", "CONNECTION", "CONNECTION"].map((label, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontWeight: 400,
                  fontSize: "11px",
                  color: "#0F0F0F",
                  textTransform: "uppercase",
                  letterSpacing: "-0.22px",
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* H2 */}
          <h2
            style={{
              fontFamily: "var(--font-alpina)",
              fontWeight: 400,
              fontSize: "38px",
              color: "#0F0F0F",
              lineHeight: "38px",
              letterSpacing: "-0.76px",
              margin: "16px 0 0",
            }}
          >
            Where your music lives.
          </h2>

          {/* Context */}
          <p
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 400,
              fontSize: "12px",
              color: "#6B665E",
              margin: "24px 0 0",
              lineHeight: "18px",
              maxWidth: "420px",
            }}
          >
            Works with Navidrome, Airsonic, and any Subsonic-compatible server. If you self-host your music library, you already have what you need.
          </p>

          {/* Form */}
          <form onSubmit={handleConnect} style={{ marginTop: "32px", maxWidth: "420px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input
                className="dashboard-input"
                type="text"
                name="serverUrl"
                autoComplete="url"
                placeholder="Navidrome server URL"
                aria-label="Navidrome server URL"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                required
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontWeight: 400,
                  fontSize: "14px",
                  color: "#0F0F0F",
                  background: "transparent",
                  border: "1px solid rgba(15,15,15,0.15)",
                  borderRadius: 0,
                  padding: "12px 16px",
                  width: "100%",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <input
                className="dashboard-input"
                type="text"
                name="username"
                autoComplete="username"
                placeholder="Username"
                aria-label="Navidrome username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontWeight: 400,
                  fontSize: "14px",
                  color: "#0F0F0F",
                  background: "transparent",
                  border: "1px solid rgba(15,15,15,0.15)",
                  borderRadius: 0,
                  padding: "12px 16px",
                  width: "100%",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <input
                className="dashboard-input"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Password"
                aria-label="Navidrome password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontWeight: 400,
                  fontSize: "14px",
                  color: "#0F0F0F",
                  background: "transparent",
                  border: "1px solid rgba(15,15,15,0.15)",
                  borderRadius: 0,
                  padding: "12px 16px",
                  width: "100%",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={connecting}
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontWeight: 400,
                fontSize: "12px",
                color: "#E1DDD6",
                background: "#0F0F0F",
                textTransform: "uppercase",
                border: "none",
                borderRadius: 0,
                padding: "12px 24px",
                marginTop: "24px",
                cursor: connecting ? "not-allowed" : "pointer",
                opacity: connecting ? 0.5 : 1,
                display: "block",
              }}
            >
              {connecting ? "Connecting..." : "Connect"}
            </button>

            {/* Error */}
            {connectError && (
              <p
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontWeight: 400,
                  fontSize: "11px",
                  color: "#0F0F0F",
                  marginTop: "16px",
                  opacity: 0.5,
                }}
              >
                {connectError}
              </p>
            )}

            {/* Status line */}
            {connected && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px" }}>
                <span
                  className="pulse-dot"
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#10B981",
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontWeight: 400,
                    fontSize: "11px",
                    color: "#6B665E",
                  }}
                >
                  Connected to {connectedUrl}
                </span>
              </div>
            )}
          </form>

          {/* Demo path */}
          <div style={{ marginTop: "40px", maxWidth: "420px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(15,15,15,0.1)" }} />
              <span
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontWeight: 400,
                  fontSize: "11px",
                  color: "#6B665E",
                  textTransform: "uppercase",
                  flexShrink: 0,
                }}
              >
                or
              </span>
              <div style={{ flex: 1, height: "1px", background: "rgba(15,15,15,0.1)" }} />
            </div>

            <button
              type="button"
              onClick={runDemo}
              disabled={running}
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontWeight: 400,
                fontSize: "12px",
                color: "#0F0F0F",
                background: "transparent",
                border: "none",
                borderRadius: 0,
                padding: 0,
                marginTop: "24px",
                textTransform: "uppercase",
                cursor: running ? "not-allowed" : "pointer",
                opacity: running ? 0.5 : 1,
                textDecoration: "underline",
                textUnderlineOffset: "4px",
              }}
            >
              {running && demoMode ? "Running demo..." : "Try demo mode"}
            </button>

            <p
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontWeight: 400,
                fontSize: "11px",
                color: "#6B665E",
                margin: "8px 0 0",
                lineHeight: "16px",
              }}
            >
              No server needed. Runs the agent with sample tracks so you can see the payment flow.
            </p>
          </div>

        </div>
      </section>

      {/* ── Rate ── */}
      <section style={{ background: "#0F0F0F", padding: "100px 120px" }}>
        <div ref={rateR.ref} style={rateR.style}>

          {/* Label row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {["RATE", "RATE", "RATE"].map((label, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontWeight: 400,
                  fontSize: "11px",
                  color: "#E1DDD6",
                  textTransform: "uppercase",
                  letterSpacing: "-0.22px",
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* H2 */}
          <h2
            style={{
              fontFamily: "var(--font-alpina)",
              fontWeight: 400,
              fontSize: "38px",
              color: "#E1DDD6",
              lineHeight: "38px",
              letterSpacing: "-0.76px",
              margin: "16px 0 0",
            }}
          >
            What one listen is worth.
          </h2>

          {/* Rate display */}
          <div style={{ marginTop: "48px" }}>
            <p
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontWeight: 500,
                fontSize: "28px",
                color: "#10B981",
                letterSpacing: "-0.56px",
                margin: 0,
                lineHeight: 1,
              }}
            >
              ${selectedRate.toFixed(selectedRate < 0.001 ? 4 : selectedRate < 0.01 ? 3 : 2)}
            </p>
            <p
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontWeight: 400,
                fontSize: "11px",
                color: "#6B665E",
                textTransform: "uppercase",
                margin: "6px 0 0",
              }}
            >
              USDC per track
            </p>
          </div>

          {/* Rate presets */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px", marginTop: "40px" }}>
            {RATE_PRESETS.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => {
                  setSelectedRate(rate)
                  fetch("/api/listener/setup", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ratePerListen: rate }),
                  }).catch(() => {})
                }}
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontWeight: 400,
                  fontSize: "14px",
                  color: selectedRate === rate ? "#10B981" : "rgba(225,221,214,0.6)",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                ${rate.toFixed(rate < 0.001 ? 4 : rate < 0.01 ? 3 : 2)}
              </button>
            ))}
          </div>

          {/* Subtext */}
          <p
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 400,
              fontSize: "11px",
              color: "#6B665E",
              margin: "24px 0 0",
            }}
          >
            Adjust anytime. Takes effect on next play.
          </p>

          {demoMode && (
            <p
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontWeight: 400,
                fontSize: "11px",
                color: "#6B665E",
                margin: "16px 0 0",
              }}
            >
              Demo mode - using sample tracks. Connect a server above to use your own library.
            </p>
          )}

          {/* Daily spend cap */}
          <div style={{ marginTop: "56px" }}>
            <span
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontWeight: 500,
                fontSize: "11px",
                color: "#6B665E",
                textTransform: "uppercase",
                letterSpacing: "-0.22px",
              }}
            >
              Daily budget
            </span>
            {/* Meter */}
            <div style={{ marginTop: "16px", maxWidth: "360px" }}>
              <div style={{ height: "4px", background: "rgba(225,221,214,0.1)", position: "relative", overflow: "hidden" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${Math.min(100, ((stats?.spentToday ?? 0) / dailyCap) * 100)}%`,
                    background: "#10B981",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <p
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontWeight: 400,
                  fontSize: "11px",
                  color: "#6B665E",
                  margin: "10px 0 0",
                }}
              >
                ${(stats?.spentToday ?? 0).toFixed(4)} spent today of ${dailyCap.toFixed(2)} cap
              </p>
            </div>
            {/* Cap presets */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px", marginTop: "20px" }}>
              {CAP_PRESETS.map((cap) => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => {
                    setDailyCap(cap)
                    fetch("/api/listener/setup", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ dailyCapUsdc: cap }),
                    }).catch(() => {})
                  }}
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontWeight: 400,
                    fontSize: "14px",
                    color: dailyCap === cap ? "#10B981" : "rgba(225,221,214,0.6)",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  ${cap.toFixed(2)}
                </button>
              ))}
            </div>
            <p
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontWeight: 400,
                fontSize: "11px",
                color: "#6B665E",
                margin: "16px 0 0",
              }}
            >
              The agent stops paying once the daily cap is reached.
            </p>
          </div>

          {/* Run agent + auto-run */}
          <div style={{ display: "flex", alignItems: "center", gap: "32px", marginTop: "40px" }}>
            <button
              type="button"
              onClick={runAgent}
              disabled={running}
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontWeight: 400,
                fontSize: "12px",
                color: done ? "#10B981" : "#E1DDD6",
                background: "transparent",
                border: "none",
                borderRadius: 0,
                padding: 0,
                textTransform: "uppercase",
                cursor: running ? "not-allowed" : "pointer",
                opacity: running ? 0.5 : 1,
              }}
            >
              {running ? "Running..." : done ? "Done" : "Run agent"}
            </button>
            <button
              type="button"
              onClick={() => setAutoRun((v) => !v)}
              aria-pressed={autoRun}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontWeight: 400,
                fontSize: "12px",
                color: autoRun ? "#10B981" : "rgba(225,221,214,0.6)",
                background: "transparent",
                border: "none",
                padding: 0,
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              <span
                className={autoRun ? "pulse-dot" : undefined}
                style={{ width: "6px", height: "6px", borderRadius: "50%", background: autoRun ? "#10B981" : "#6B665E", display: "inline-block" }}
              />
              {autoRun ? "Auto-run on" : "Auto-run off"}
            </button>
          </div>

          {/* Agent log */}
          {log.length > 0 && (
            <div style={{ marginTop: "40px" }}>
              <span
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontWeight: 500,
                  fontSize: "11px",
                  color: "#6B665E",
                  textTransform: "uppercase",
                  letterSpacing: "-0.22px",
                  display: "block",
                  marginBottom: "16px",
                }}
              >
                Agent Log
              </span>
              <div
                style={{
                  borderTop: "1px solid rgba(225,221,214,0.08)",
                  paddingTop: "24px",
                  paddingBottom: "24px",
                  maxHeight: "300px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {log.map((line, i) => (
                  <div
                    key={i}
                    className="log-line"
                    style={{
                      fontFamily: "var(--font-ibm-plex-mono), monospace",
                      fontWeight: 400,
                      fontSize: "14px",
                      color: "#E1DDD6",
                      lineHeight: "20px",
                    }}
                  >
                    {renderLogLine(line)}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ background: "#E1DDD6", padding: "100px 120px" }}>
        <div ref={statsR.ref} style={statsR.style}>

          {/* Label row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {["STATS", "STATS", "STATS"].map((label, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontWeight: 400,
                  fontSize: "11px",
                  color: "#0F0F0F",
                  textTransform: "uppercase",
                  letterSpacing: "-0.22px",
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* H2 */}
          <h2
            style={{
              fontFamily: "var(--font-alpina)",
              fontWeight: 400,
              fontSize: "38px",
              color: "#0F0F0F",
              lineHeight: "38px",
              letterSpacing: "-0.76px",
              margin: "16px 0 0",
            }}
          >
            Your listening footprint.
          </h2>

          {/* Stats row */}
          <div className="stack-mobile" style={{ display: "flex", alignItems: "center", gap: "40px", marginTop: "48px" }}>
            <StatMetric
              value={`$${(stats?.totalPaid ?? 0).toFixed(2)}`}
              label="Total paid"
            />
            <div className="stack-mobile-divider" style={{ width: "1px", height: "40px", background: "rgba(15,15,15,0.1)", flexShrink: 0 }} />
            <StatMetric
              value={(stats?.settledCount ?? 0).toLocaleString()}
              label="Tracks played"
            />
            <div className="stack-mobile-divider" style={{ width: "1px", height: "40px", background: "rgba(15,15,15,0.1)", flexShrink: 0 }} />
            <StatMetric
              value={String(stats?.artistCount ?? 0)}
              label="Artists supported"
            />
          </div>

        </div>
      </section>

      {/* ── History ── */}
      <section style={{ background: "#0F0F0F", padding: "100px 120px" }}>
        <div ref={historyR.ref} style={historyR.style}>

          {/* Label row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {["HISTORY", "HISTORY", "HISTORY"].map((label, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontWeight: 400,
                  fontSize: "11px",
                  color: "#E1DDD6",
                  textTransform: "uppercase",
                  letterSpacing: "-0.22px",
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* H2 */}
          <h2
            style={{
              fontFamily: "var(--font-alpina)",
              fontWeight: 400,
              fontSize: "38px",
              color: "#E1DDD6",
              lineHeight: "38px",
              letterSpacing: "-0.76px",
              margin: "16px 0 0",
            }}
          >
            Every listen accounted for.
          </h2>

          {/* Payment rows */}
          <div style={{ marginTop: "48px", display: "flex", flexDirection: "column", gap: "24px" }}>
            {payments.slice(0, 5).map((p) => (
              <div key={p.id} className="stack-mobile" style={{ display: "flex", alignItems: "baseline", gap: "80px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontWeight: 400,
                    fontSize: "14px",
                    color: "#E1DDD6",
                    minWidth: "200px",
                  }}
                >
                  {p.trackTitle}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontWeight: 400,
                    fontSize: "14px",
                    color: "#6B665E",
                    minWidth: "160px",
                  }}
                >
                  {p.artist.name}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontWeight: 500,
                    fontSize: "14px",
                    color: "#10B981",
                    minWidth: "100px",
                  }}
                >
                  ${p.amountUsdc.toFixed(4)}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontWeight: 400,
                    fontSize: "11px",
                    color: "#6B665E",
                    minWidth: "70px",
                  }}
                >
                  {timeAgo(p.scrobbledAt)}
                </span>
                {p.txHash ? (
                  <a
                    href={txUrl(p.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View on Arc explorer"
                    style={{
                      fontFamily: "var(--font-ibm-plex-mono), monospace",
                      fontWeight: 400,
                      fontSize: "11px",
                      color: "#10B981",
                      textDecoration: "none",
                      borderBottom: "1px solid rgba(16,185,129,0.4)",
                    }}
                  >
                    {shortHash(p.txHash)} ↗
                  </a>
                ) : (
                  <span
                    style={{
                      fontFamily: "var(--font-ibm-plex-mono), monospace",
                      fontWeight: 400,
                      fontSize: "11px",
                      color: "#6B665E",
                    }}
                  >
                    {p.settled ? "escrow" : "pending"}
                  </span>
                )}
              </div>
            ))}

            {payments.length === 0 && (
              <p
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontWeight: 400,
                  fontSize: "14px",
                  color: "#6B665E",
                }}
              >
                No payments yet. Run the agent to start.
              </p>
            )}
          </div>

        </div>
      </section>

      {/* ── Agent Log ── */}
      <section style={{ background: "#0F0F0F", padding: "100px 120px" }}>
        <div ref={agentLogR.ref} style={agentLogR.style}>

          {/* Label row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {["AGENT LOG", "AGENT LOG", "AGENT LOG"].map((label, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontWeight: 500,
                  fontSize: "11px",
                  color: "#6B665E",
                  textTransform: "uppercase",
                  letterSpacing: "-0.22px",
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Top rule */}
          <div style={{ height: "1px", background: "rgba(225,221,214,0.08)", margin: "24px 0" }} />

          {/* Log lines */}
          <div
            style={{
              maxHeight: "280px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {log.length === 0 ? (
              <span
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontWeight: 400,
                  fontSize: "13px",
                  color: "#6B665E",
                  lineHeight: "20px",
                }}
              >
                Nothing here yet. Hit Run agent above and the live log shows up here.
              </span>
            ) : (
              log.map((line, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontWeight: 400,
                    fontSize: "13px",
                    color: "#E1DDD6",
                    lineHeight: "20px",
                  }}
                >
                  {renderLogLine(line)}
                  {i === log.length - 1 && (
                    <span
                      className="blink-cursor"
                      style={{
                        display: "inline-block",
                        width: "2px",
                        height: "13px",
                        background: "#10B981",
                        marginLeft: "3px",
                        verticalAlign: "text-bottom",
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      </section>

      {/* ── Agent Decisions ── */}
      <section style={{ background: "#E1DDD6", padding: "100px 120px" }}>
        <div>
          {/* Label row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {["AGENT DECISIONS", "AGENT DECISIONS"].map((label, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontWeight: 400,
                  fontSize: "11px",
                  color: "#0F0F0F",
                  textTransform: "uppercase",
                  letterSpacing: "-0.22px",
                }}
              >
                {label}
              </span>
            ))}
          </div>

          <h2
            style={{
              fontFamily: "var(--font-alpina)",
              fontWeight: 400,
              fontSize: "38px",
              color: "#0F0F0F",
              lineHeight: "38px",
              letterSpacing: "-0.76px",
              margin: "16px 0 0",
            }}
          >
            How the agent identified each artist.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 400,
              fontSize: "12px",
              color: "#6B665E",
              margin: "12px 0 0",
              maxWidth: "560px",
              lineHeight: "18px",
            }}
          >
            Every play is matched to a real performer. When MusicBrainz is ambiguous, the agent reasons over the candidates with an LLM and records why.
          </p>

          <div style={{ marginTop: "48px", display: "flex", flexDirection: "column", gap: "24px" }}>
            {artists.length === 0 && (
              <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "14px", color: "#6B665E" }}>
                Run the agent to see how it resolves artists.
              </span>
            )}
            {artists.filter((a) => a.name !== "Unknown Artist").slice(0, 6).map((a) => (
              <div key={a.id} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
                  <a
                    href={`/artist/${encodeURIComponent(a.musicBrainzId)}`}
                    style={{ fontFamily: "var(--font-alpina)", fontSize: "22px", color: "#0F0F0F", lineHeight: "26px", textDecoration: "none", borderBottom: "1px solid rgba(15,15,15,0.2)" }}
                  >
                    {a.name}
                  </a>
                  <span
                    style={{
                      fontFamily: "var(--font-ibm-plex-mono), monospace",
                      fontSize: "10px",
                      color: a.resolvedVia?.startsWith("Groq") || a.resolvedVia?.startsWith("Claude") ? "#10B981" : "#6B665E",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      border: `1px solid ${a.resolvedVia?.startsWith("Groq") || a.resolvedVia?.startsWith("Claude") ? "rgba(16,185,129,0.4)" : "rgba(15,15,15,0.2)"}`,
                      padding: "2px 8px",
                    }}
                  >
                    {a.resolvedVia ?? "MusicBrainz"}
                  </span>
                </div>
                {a.resolvedNote && (
                  <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "12px", color: "#6B665E", lineHeight: "17px", maxWidth: "620px" }}>
                    {a.resolvedNote}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Account ── */}
      <section style={{ background: "#0F0F0F", paddingTop: "100px", paddingBottom: "160px", paddingLeft: "120px", paddingRight: "120px" }}>
        <div ref={accountR.ref} style={accountR.style}>

          {/* Label row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {["ACCOUNT", "ACCOUNT", "ACCOUNT"].map((label, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontWeight: 400,
                  fontSize: "11px",
                  color: "#E1DDD6",
                  textTransform: "uppercase",
                  letterSpacing: "-0.22px",
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* H2 */}
          <h2
            style={{
              fontFamily: "var(--font-alpina)",
              fontWeight: 400,
              fontSize: "38px",
              color: "#E1DDD6",
              lineHeight: "38px",
              letterSpacing: "-0.76px",
              margin: "16px 0 0",
            }}
          >
            Your setup.
          </h2>

          {/* Label-value grid */}
          <div style={{ marginTop: "48px", display: "flex", flexDirection: "column", gap: "20px" }}>
            {[
              { label: "Server",          value: connectedUrl || "Not connected" },
              { label: "Username",        value: connected ? username : "-" },
              { label: "Rate",            value: `$${selectedRate.toFixed(4)} USDC per track` },
              { label: "Total paid",      value: `$${(stats?.totalPaid ?? 0).toFixed(2)} USDC` },
              { label: "Connected since", value: connectedSince ?? "-" },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", alignItems: "baseline", gap: "40px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontWeight: 400,
                    fontSize: "11px",
                    color: "#6B665E",
                    width: "160px",
                    flexShrink: 0,
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontWeight: 400,
                    fontSize: "14px",
                    color: "#E1DDD6",
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Rule */}
          <div style={{ height: "1px", background: "rgba(225,221,214,0.1)", margin: "48px 0" }} />

          {/* Link pair */}
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <a
              href="/dashboard"
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontWeight: 400,
                fontSize: "12px",
                color: "#E1DDD6",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              View dashboard →
            </a>
            <a
              href="/"
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontWeight: 400,
                fontSize: "12px",
                color: "#E1DDD6",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              ← Back to home
            </a>
          </div>

        </div>
      </section>

    </div>
  )
}

function StatMetric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p
        style={{
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontWeight: 500,
          fontSize: "28px",
          color: "#0F0F0F",
          letterSpacing: "-0.56px",
          margin: 0,
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontWeight: 400,
          fontSize: "11px",
          color: "#6B665E",
          textTransform: "uppercase",
          margin: "6px 0 0",
        }}
      >
        {label}
      </p>
    </div>
  )
}

// Render a log line, turning any on-chain tx hash into an Arc explorer link.
function renderLogLine(line: string): React.ReactNode {
  const m = line.match(/0x[a-fA-F0-9]{64}/)
  if (!m) return line
  const hash = m[0]
  const idx = line.indexOf(hash)
  return (
    <>
      {line.slice(0, idx)}
      <a
        href={txUrl(hash)}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#10B981", textDecoration: "none", borderBottom: "1px solid rgba(16,185,129,0.4)" }}
      >
        {shortHash(hash)} ↗
      </a>
      {line.slice(idx + hash.length)}
    </>
  )
}

function timeAgo(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.floor(hrs / 24)} days ago`
}
