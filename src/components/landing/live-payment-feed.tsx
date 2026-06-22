"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"

const MONO = "var(--font-ibm-plex-mono), monospace"
const ALPINA = "var(--font-alpina)"

interface Payment {
  id: string
  trackTitle: string
  amountUsdc: number
  settled: boolean
  artist: { name: string }
}

interface Stats {
  totalPaid: number
  settledCount: number
  artistCount: number
}

export function LivePaymentFeed() {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [rows, setRows] = useState<Payment[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/agent/status")
        const data = await res.json()
        setRows(data.recentPayments?.slice(0, 5) ?? [])
        setStats(data.stats ?? null)
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

  const reveal = (delay: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(40px)",
    transition: `opacity 0.8s ease-out ${delay}ms, transform 0.8s ease-out ${delay}ms`,
  })

  return (
    <section
      ref={sectionRef}
      className="section-pad"
      style={{ background: "#F5F2EC", padding: "100px 120px", position: "relative", overflow: "hidden" }}
    >
      {/* Retro image — right side, full section height */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "50%",
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <img
          src="/payment-bg.jpg"
          alt=""
          aria-hidden="true"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top center",
            display: "block",
          }}
        />
        {/* Blend left edge into cream */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, #F5F2EC 0%, rgba(245,242,236,0.55) 22%, transparent 52%)",
          }}
        />
        {/* Bottom fade */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "18%",
            background: "linear-gradient(to top, #F5F2EC, transparent)",
          }}
        />
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Label + headline */}
        <div style={reveal(0)}>
          <div className="flex items-center" style={{ gap: "8px" }}>
            {["LIVE PAYMENT FEED", "LIVE PAYMENT FEED", "LIVE PAYMENT FEED"].map((label, i) => (
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
            Payments flowing through right now on Arc Network.
          </h2>
        </div>

        {/* States */}
        <div style={{ marginTop: "64px" }}>

          {/* STATE A: LOADING */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center"
                  style={{ gap: "48px", padding: "20px 0", borderBottom: "1px solid rgba(15,15,15,0.06)" }}
                >
                  <div
                    className="skeleton-pulse"
                    style={{ width: "140px", height: "14px", background: "rgba(15,15,15,0.08)", flexShrink: 0 }}
                  />
                  <div
                    className="skeleton-pulse"
                    style={{ width: "100px", height: "14px", background: "rgba(15,15,15,0.06)", flexShrink: 0, animationDelay: "0.2s" }}
                  />
                  <div
                    className="skeleton-pulse"
                    style={{ width: "12px", height: "12px", borderRadius: "50%", background: "rgba(15,15,15,0.06)", flexShrink: 0, animationDelay: "0.4s" }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* STATE B: EMPTY */}
          {!loading && rows.length === 0 && (
            <div style={{ paddingTop: "24px" }}>
              <p
                style={{
                  fontFamily: ALPINA,
                  fontWeight: 400,
                  fontSize: "22px",
                  color: "#6B665E",
                  margin: 0,
                  lineHeight: "28px",
                  maxWidth: "480px",
                }}
              >
                No payments yet. Connect Navidrome and start listening.
              </p>
              <Link
                href="/dashboard"
                style={{
                  fontFamily: MONO,
                  fontWeight: 400,
                  fontSize: "12px",
                  color: "#10B981",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  display: "inline-block",
                  marginTop: "24px",
                }}
              >
                Connect Navidrome →
              </Link>
            </div>
          )}

          {/* STATE C: DATA */}
          {!loading && rows.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {rows.map((row, i) => (
                <div
                  key={row.id}
                  className="flex items-baseline feed-row"
                  style={{
                    gap: "48px",
                    padding: "20px 0",
                    borderBottom: "1px solid rgba(15,15,15,0.06)",
                    ...reveal(i * 80),
                  }}
                >
                  <span
                    className="feed-track"
                    style={{
                      fontFamily: ALPINA,
                      fontWeight: 400,
                      fontSize: "22px",
                      color: "#0F0F0F",
                      flex: "0 0 280px",
                    }}
                  >
                    {row.trackTitle}
                  </span>
                  <span
                    className="feed-artist"
                    style={{
                      fontFamily: MONO,
                      fontWeight: 400,
                      fontSize: "13px",
                      color: "#6B665E",
                      flex: "0 0 180px",
                    }}
                  >
                    {row.artist.name}
                  </span>
                  <span
                    className="feed-amount"
                    style={{
                      fontFamily: MONO,
                      fontWeight: 500,
                      fontSize: "13px",
                      color: "#0F0F0F",
                      flex: "0 0 80px",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    ${row.amountUsdc.toFixed(4)}
                  </span>
                  <div className="flex items-center" style={{ gap: "6px" }}>
                    <div
                      className="pulse-dot-slow"
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#10B981",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: MONO,
                        fontWeight: 400,
                        fontSize: "11px",
                        color: "#10B981",
                      }}
                    >
                      {row.settled ? "settled" : "pending"}
                    </span>
                  </div>
                </div>
              ))}

              {/* Stats bar */}
              <div
                className="feed-stats"
                style={{
                  marginTop: "48px",
                  paddingTop: "32px",
                  borderTop: "1px solid rgba(15,15,15,0.10)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "80px",
                  ...reveal(rows.length * 80 + 100),
                }}
              >
                <div>
                  <p className="feed-stat-num" style={{ fontFamily: MONO, fontWeight: 500, fontSize: "28px", color: "#0F0F0F", margin: 0, lineHeight: 1 }}>
                    {stats?.settledCount ?? 0}
                  </p>
                  <p style={{ fontFamily: MONO, fontWeight: 400, fontSize: "11px", color: "#6B665E", textTransform: "uppercase", margin: "6px 0 0" }}>
                    Payments
                  </p>
                </div>
                <div>
                  <p className="feed-stat-num" style={{ fontFamily: MONO, fontWeight: 500, fontSize: "28px", color: "#0F0F0F", margin: 0, lineHeight: 1 }}>
                    {stats?.artistCount ?? 0}
                  </p>
                  <p style={{ fontFamily: MONO, fontWeight: 400, fontSize: "11px", color: "#6B665E", textTransform: "uppercase", margin: "6px 0 0" }}>
                    Artists supported
                  </p>
                </div>
                <div>
                  <p className="feed-stat-num" style={{ fontFamily: MONO, fontWeight: 500, fontSize: "28px", color: "#0F0F0F", margin: 0, lineHeight: 1 }}>
                    ${(stats?.totalPaid ?? 0).toFixed(4)}
                  </p>
                  <p style={{ fontFamily: MONO, fontWeight: 400, fontSize: "11px", color: "#6B665E", textTransform: "uppercase", margin: "6px 0 0" }}>
                    USDC settled
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  )
}
