"use client"

import { useState, useEffect } from "react"

const MONO = "var(--font-ibm-plex-mono), monospace"
const ALPINA = "var(--font-alpina)"

interface AgentRun {
  scrobbleCount: number
  resolvedCount: number
  paymentCount: number
  totalUsdc: number
  status: string
  errorMessage: string | null
  startedAt: string
  finishedAt: string
}

function timeAgo(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function buildLog(run: AgentRun): string[] {
  const lines: string[] = []
  if (run.scrobbleCount > 0)
    lines.push(`Fetched ${run.scrobbleCount} track${run.scrobbleCount !== 1 ? "s" : ""} from Navidrome`)
  if (run.resolvedCount > 0)
    lines.push(`Resolved ${run.resolvedCount} artist${run.resolvedCount !== 1 ? "s" : ""} via MusicBrainz`)
  if (run.paymentCount > 0)
    lines.push(`Queued ${run.paymentCount} payment${run.paymentCount !== 1 ? "s" : ""}`)
  if (run.totalUsdc > 0)
    lines.push(`Settled $${run.totalUsdc.toFixed(4)} USDC total`)
  if (run.status === "error" && run.errorMessage)
    lines.push(`Error: ${run.errorMessage}`)
  if (lines.length === 0)
    lines.push("Run completed. No new scrobbles detected.")
  return lines
}

const SKELETON_WIDTHS = ["80%", "60%", "90%", "40%"]

export function AgentLog() {
  const [lastRun, setLastRun] = useState<AgentRun | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/agent/status")
        const data = await res.json()
        setLastRun(data.lastRun ?? null)
      } catch {
        // keep existing state on network error
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const lines = lastRun ? buildLog(lastRun) : []
  const ts = lastRun ? timeAgo(lastRun.startedAt) : ""

  return (
    <section style={{ background: "#E1DDD6", padding: "120px 120px" }}>

      {/* Section divider labels */}
      <div className="flex items-center" style={{ gap: "8px" }}>
        {["THE AGENT LOG", "THE AGENT LOG", "THE AGENT LOG"].map((label, i) => (
          <span
            key={i}
            style={{
              fontFamily: MONO,
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

      {/* Headline */}
      <h2
        style={{
          fontFamily: ALPINA,
          fontWeight: 400,
          fontSize: "38px",
          color: "#0F0F0F",
          lineHeight: "38px",
          letterSpacing: "-0.76px",
          margin: 0,
          marginTop: "16px",
        }}
      >
        Every payment is visible. Nothing is hidden.
      </h2>

      {/* Log block */}
      <div className="flex items-start" style={{ marginTop: "48px" }}>
        <div
          style={{
            background: "#0F0F0F",
            padding: "24px",
            borderRadius: 0,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            flex: 1,
          }}
        >

          {/* STATE A: LOADING */}
          {loading && (
            <>
              {SKELETON_WIDTHS.map((w, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px", lineHeight: "20px" }}>
                  <div
                    className="skeleton-pulse"
                    style={{
                      width: "48px",
                      height: "11px",
                      background: "rgba(225,221,214,0.10)",
                      flexShrink: 0,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                  <div
                    className="skeleton-pulse"
                    style={{
                      width: w,
                      height: "11px",
                      background: "rgba(225,221,214,0.10)",
                      animationDelay: `${i * 0.15 + 0.07}s`,
                    }}
                  />
                </div>
              ))}
            </>
          )}

          {/* STATE B: EMPTY */}
          {!loading && !lastRun && (
            <div style={{ padding: "8px 0" }}>
              <p
                style={{
                  fontFamily: ALPINA,
                  fontWeight: 400,
                  fontSize: "22px",
                  color: "#6B665E",
                  margin: 0,
                  lineHeight: "28px",
                }}
              >
                No runs yet.
              </p>
              <p
                style={{
                  fontFamily: MONO,
                  fontWeight: 400,
                  fontSize: "13px",
                  color: "rgba(225, 221, 214, 0.7)",
                  margin: "12px 0 0",
                  lineHeight: "19px",
                  maxWidth: "480px",
                }}
              >
                The agent wakes up every 5 minutes to check for new scrobbles, resolve artists, and settle payments.
              </p>
            </div>
          )}

          {/* STATE C: DATA */}
          {!loading && lastRun && (
            <>
              {lines.map((line, i) => {
                const isLast = i === lines.length - 1
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "16px",
                      lineHeight: "20px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: MONO,
                        fontWeight: 400,
                        fontSize: "11px",
                        color: "rgba(225, 221, 214, 0.6)",
                        flexShrink: 0,
                        minWidth: "60px",
                      }}
                    >
                      {ts}
                    </span>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontWeight: 400,
                        fontSize: "13px",
                        color: "#E1DDD6",
                      }}
                    >
                      {line}
                      {isLast && (
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
                    </span>
                  </div>
                )
              })}
            </>
          )}

        </div>
      </div>

      {/* Footnote */}
      <p
        style={{
          fontFamily: MONO,
          fontWeight: 400,
          fontSize: "13px",
          color: "#57534B",
          lineHeight: "19px",
          letterSpacing: "-0.22px",
          margin: 0,
          marginTop: "32px",
          maxWidth: "560px",
        }}
      >
        Obol runs on a schedule. No human action required. Every run is logged. Every payment is traceable on Arc.
      </p>

    </section>
  )
}
