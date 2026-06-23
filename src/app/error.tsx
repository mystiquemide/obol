"use client"

import { useEffect } from "react"

const MONO = "var(--font-ibm-plex-mono), monospace"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{ background: "#0F0F0F", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <p style={{ fontFamily: MONO, fontSize: "11px", color: "#6B665E", textTransform: "uppercase", letterSpacing: "1px" }}>We&apos;re having trouble</p>
      <p style={{ fontFamily: MONO, fontSize: "14px", color: "#E1DDD6", marginTop: "12px", maxWidth: "420px", textAlign: "center", lineHeight: "20px" }}>
        This page hit a snag on our end. Give it another try, or head back home.
      </p>
      <div style={{ display: "flex", gap: "24px", marginTop: "28px" }}>
        <button
          type="button"
          onClick={reset}
          style={{ fontFamily: MONO, fontSize: "12px", color: "#10B981", background: "none", border: "none", cursor: "pointer", textTransform: "uppercase", borderBottom: "1px solid rgba(16,185,129,0.4)" }}
        >
          Try again
        </button>
        <a href="/" style={{ fontFamily: MONO, fontSize: "12px", color: "#6B665E", textDecoration: "none", textTransform: "uppercase" }}>
          Home
        </a>
      </div>
    </div>
  )
}
