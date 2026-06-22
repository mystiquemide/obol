"use client"

import { useEffect, useRef, useState } from "react"

export default function HowItWorks() {
  const heroRef = useRef<HTMLDivElement>(null)
  const [heroVisible, setHeroVisible] = useState(false)

  const step1Ref = useRef<HTMLDivElement>(null)
  const [step1Visible, setStep1Visible] = useState(false)

  const step2Ref = useRef<HTMLDivElement>(null)
  const [step2Visible, setStep2Visible] = useState(false)

  const step3Ref = useRef<HTMLDivElement>(null)
  const [step3Visible, setStep3Visible] = useState(false)

  const archRef = useRef<HTMLDivElement>(null)
  const [archVisible, setArchVisible] = useState(false)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setHeroVisible(true); observer.disconnect() }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = step1Ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setStep1Visible(true); observer.disconnect() }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = step2Ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setStep2Visible(true); observer.disconnect() }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = step3Ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setStep3Visible(true); observer.disconnect() }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = archRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setArchVisible(true); observer.disconnect() }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const heroReveal: React.CSSProperties = {
    opacity: heroVisible ? 1 : 0,
    transform: heroVisible ? "translateY(0)" : "translateY(40px)",
    transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
  }

  const step1Reveal: React.CSSProperties = {
    opacity: step1Visible ? 1 : 0,
    transform: step1Visible ? "translateY(0)" : "translateY(40px)",
    transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
  }

  const step2Reveal: React.CSSProperties = {
    opacity: step2Visible ? 1 : 0,
    transform: step2Visible ? "translateY(0)" : "translateY(40px)",
    transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
  }

  const step3Reveal: React.CSSProperties = {
    opacity: step3Visible ? 1 : 0,
    transform: step3Visible ? "translateY(0)" : "translateY(40px)",
    transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
  }

  const archReveal: React.CSSProperties = {
    opacity: archVisible ? 1 : 0,
    transform: archVisible ? "translateY(0)" : "translateY(40px)",
    transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
  }

  const FLOW_STEPS = ["Navidrome", "Obol Agent", "MusicBrainz", "Arc Network", "Artist Wallet"]

  return (
    <div className="mobile-page">

      {/* ── Hero strip ── */}
      <section style={{ background: "#0F0F0F", paddingTop: "160px", paddingBottom: "80px", paddingLeft: "120px", paddingRight: "120px" }}>
        <div ref={heroRef} style={heroReveal}>
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
            How It Works
          </span>
          <h1
            style={{
              fontFamily: "var(--font-alpina)",
              fontWeight: 400,
              fontSize: "40px",
              color: "#E1DDD6",
              lineHeight: "48px",
              letterSpacing: "-0.4px",
              margin: "16px 0 0",
            }}
          >
            Three steps. Zero clicks after setup.
          </h1>
          <p
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 400,
              fontSize: "14px",
              color: "#6B665E",
              maxWidth: "520px",
              margin: "16px 0 0",
              lineHeight: "19.6px",
            }}
          >
            Connect once. Set your rate. Listen. Obol handles the rest.
          </p>
        </div>
      </section>

      {/* ── Step 1 ── */}
      <section style={{ background: "#E1DDD6", paddingTop: "100px", paddingBottom: "100px", paddingLeft: "120px", paddingRight: "120px" }}>
        <div ref={step1Ref} style={step1Reveal}>
          <span
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 500,
              fontSize: "11px",
              color: "#6B665E",
              display: "block",
            }}
          >
            01
          </span>
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
            Connect your Navidrome server.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 400,
              fontSize: "14px",
              color: "#000000",
              maxWidth: "600px",
              margin: "24px 0 0",
              lineHeight: "19.6px",
            }}
          >
            Paste your server URL and credentials. Obol verifies the connection and starts watching for scrobbles immediately. No plugins. No API keys. Just your existing Navidrome instance.
          </p>
          <p
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 400,
              fontSize: "11px",
              color: "#6B665E",
              margin: "16px 0 0",
            }}
          >
            Works with any Navidrome instance — self-hosted or cloud.
          </p>
        </div>
      </section>

      {/* ── Step 2 ── */}
      <section style={{ background: "#0F0F0F", paddingTop: "100px", paddingBottom: "100px", paddingLeft: "120px", paddingRight: "120px" }}>
        <div ref={step2Ref} style={step2Reveal}>
          <span
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 500,
              fontSize: "11px",
              color: "#6B665E",
              display: "block",
            }}
          >
            02
          </span>
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
            Set your rate.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 400,
              fontSize: "14px",
              color: "#E1DDD6",
              maxWidth: "600px",
              margin: "24px 0 0",
              lineHeight: "19.6px",
            }}
          >
            Default is $0.001 USDC per track. You approve a budget, not each payment. Obol never exceeds what you set. Adjust anytime.
          </p>
          <p
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 400,
              fontSize: "11px",
              color: "#6B665E",
              margin: "16px 0 0",
            }}
          >
            $1 = 1,000 plays. $10 = 10,000 plays.
          </p>
        </div>
      </section>

      {/* ── Step 3 ── */}
      <section style={{ background: "#E1DDD6", paddingTop: "100px", paddingBottom: "100px", paddingLeft: "120px", paddingRight: "120px" }}>
        <div ref={step3Ref} style={step3Reveal}>
          <span
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 500,
              fontSize: "11px",
              color: "#6B665E",
              display: "block",
            }}
          >
            03
          </span>
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
            Listen. That's it.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 400,
              fontSize: "14px",
              color: "#000000",
              maxWidth: "600px",
              margin: "24px 0 0",
              lineHeight: "19.6px",
            }}
          >
            Every track you play triggers a payment. Obol resolves the artist via MusicBrainz and settles in USDC on Arc in under 500ms. Artists earn while you listen. Nothing to manage.
          </p>
          <p
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 400,
              fontSize: "11px",
              color: "#6B665E",
              margin: "16px 0 0",
            }}
          >
            Fully autonomous. Agent-driven. Transparent onchain.
          </p>
        </div>
      </section>

      {/* ── Architecture ── */}
      <section style={{ background: "#0F0F0F", paddingTop: "100px", paddingBottom: "160px", paddingLeft: "120px", paddingRight: "120px" }}>
        <div ref={archRef} style={archReveal}>
          {/* Label row */}
          <div style={{ display: "flex", gap: "8px" }}>
            {["ARCHITECTURE", "ARCHITECTURE", "ARCHITECTURE"].map((word, i) => (
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
                {word}
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
            What happens when you press play.
          </h2>

          {/* Flow diagram */}
          <div style={{ marginTop: "48px", display: "flex", flexDirection: "column", gap: 0 }}>
            {FLOW_STEPS.map((step, i) => (
              <div key={i}>
                <div
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontWeight: 500,
                    fontSize: "14px",
                    color: "#E1DDD6",
                    lineHeight: "20px",
                  }}
                >
                  {step}
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <div
                    style={{
                      fontFamily: "var(--font-ibm-plex-mono), monospace",
                      fontWeight: 400,
                      fontSize: "14px",
                      color: "#10B981",
                      lineHeight: "20px",
                      margin: "12px 0",
                    }}
                  >
                    ↓
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Subtext */}
          <p
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 400,
              fontSize: "11px",
              color: "#6B665E",
              maxWidth: "520px",
              margin: "48px 0 0",
              lineHeight: "15.4px",
            }}
          >
            End-to-end: under 500ms. Every step is logged. Every payment is traceable onchain.
          </p>
        </div>
      </section>

      {/* ── Page links ── */}
      <section style={{ background: "#E1DDD6", padding: "60px 120px" }}>
        <div style={{ display: "flex", gap: "32px" }}>
          <a
            href="/dashboard"
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 400,
              fontSize: "12px",
              color: "#0F0F0F",
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
              color: "#6B665E",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            ← Back to home
          </a>
        </div>
      </section>

    </div>
  )
}
