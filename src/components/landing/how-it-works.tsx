"use client"

import { useRef, useState, useEffect } from "react"
import { Music, Sliders, Zap } from "lucide-react"

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

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

  const reveal = (delay: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(40px)",
    transition: `opacity 0.8s ease-out ${delay}ms, transform 0.8s ease-out ${delay}ms`,
  })

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="hiw-section"
      style={{ background: "#E1DDD6", paddingTop: "160px", paddingBottom: "120px", position: "relative" }}
    >

      {/* Label + headline */}
      <div style={{ ...reveal(0), position: "relative", zIndex: 1 }}>
        <div className="flex items-center hiw-label-row" style={{ paddingLeft: "120px", gap: "8px" }}>
          {["HOW IT WORKS", "HOW IT WORKS", "HOW IT WORKS"].map((label, i) => (
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
          className="hiw-headline"
          style={{
            fontFamily: "var(--font-alpina)",
            fontWeight: 400,
            fontSize: "38px",
            color: "#0F0F0F",
            lineHeight: "38px",
            letterSpacing: "-0.76px",
            margin: 0,
            marginTop: "16px",
            paddingLeft: "120px",
            paddingRight: "120px",
            maxWidth: "720px",
          }}
        >
          Connect once. Obol handles the rest.
        </h2>
      </div>

      {/* Steps */}
      <div
        className="flex hiw-steps"
        style={{ marginTop: "80px", paddingLeft: "120px", paddingRight: "120px", gap: "80px", position: "relative", zIndex: 1 }}
      >
        <Step
          icon={<div style={{ opacity: 0.4 }}><Music size={16} color="#0F0F0F" /></div>}
          number="01"
          title="Connect your Navidrome server"
          body="Paste your server URL and credentials. Obol verifies the connection and starts watching your library."
          style={reveal(0)}
        />
        <Divider />
        <Step
          icon={<div style={{ opacity: 0.4 }}><Sliders size={16} color="#0F0F0F" /></div>}
          number="02"
          title="Set your rate"
          body="Default is $0.001 USDC per track played. Adjust up or down. You approve a budget, not each payment."
          style={reveal(150)}
        />
        <Divider />
        <Step
          icon={<div style={{ opacity: 0.4 }}><Zap size={16} color="#0F0F0F" /></div>}
          number="03"
          title="Obol runs while you listen"
          body="Every song you play triggers a payment. Obol batches and settles in USDC on Arc. Artists earn in real time."
          style={reveal(300)}
        />
      </div>
    </section>
  )
}

function Step({
  icon,
  number,
  title,
  body,
  style,
}: {
  icon: React.ReactNode
  number: string
  title: string
  body: string
  style?: React.CSSProperties
}) {
  return (
    <div style={{ flex: 1, ...style }}>
      <div style={{ marginBottom: "16px" }}>{icon}</div>
      <span
        style={{
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontWeight: 500,
          fontSize: "11px",
          color: "#0F0F0F",
        }}
      >
        {number}
      </span>
      <h3
        className="hiw-step-title"
        style={{
          fontFamily: "var(--font-alpina)",
          fontWeight: 400,
          fontSize: "22px",
          color: "#0F0F0F",
          lineHeight: "24.2px",
          letterSpacing: "-0.44px",
          margin: 0,
          marginTop: "8px",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontWeight: 400,
          fontSize: "11px",
          color: "#000000",
          lineHeight: "15.4px",
          letterSpacing: "-0.22px",
          margin: 0,
          marginTop: "12px",
        }}
      >
        {body}
      </p>
    </div>
  )
}

function Divider() {
  return (
    <div
      className="hiw-divider"
      style={{
        width: "1px",
        background: "rgba(225, 221, 214, 0.1)",
        alignSelf: "stretch",
      }}
    />
  )
}
