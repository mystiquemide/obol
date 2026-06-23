"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Coins, Wallet, Shield } from "lucide-react"

export function ForArtists() {
  const router = useRouter()
  const [query, setQuery] = useState("")

  function go() {
    const dest = query.trim()
      ? `/artists?q=${encodeURIComponent(query.trim())}`
      : "/artists"
    router.push(dest)
  }

  return (
    <section
      id="artists"
      className="section-pad"
      style={{
        background: "#0F0F0F",
        padding: "160px 120px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Warm radial glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "30%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse at center, rgba(245, 158, 11, 0.05) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Content layer above glow */}
      <div style={{ position: "relative", zIndex: 1 }}>

      {/* Section divider labels */}
      <div className="flex items-center" style={{ gap: "8px" }}>
        {["FOR ARTISTS", "FOR ARTISTS", "FOR ARTISTS"].map((label, i) => (
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

      {/* Headline */}
      <h2
        style={{
          fontFamily: "var(--font-alpina)",
          fontWeight: 400,
          fontSize: "38px",
          color: "#E1DDD6",
          lineHeight: "38px",
          letterSpacing: "-0.76px",
          margin: 0,
          marginTop: "16px",
          maxWidth: "680px",
        }}
      >
        Already earning. You just haven't claimed it yet.
      </h2>

      {/* Body */}
      <p
        style={{
          fontFamily: "var(--font-alpina)",
          fontWeight: 400,
          fontSize: "22px",
          color: "#E1DDD6",
          lineHeight: "24.2px",
          letterSpacing: "-0.44px",
          margin: 0,
          marginTop: "24px",
          maxWidth: "620px",
        }}
      >
        If your music is on MusicBrainz, Obol already knows who you are. Every time a listener plays your track, your balance grows. Claim your wallet to withdraw.
      </p>

      {/* Search + CTA row + artist image */}
      <div className="flex items-start" style={{ gap: "64px", marginTop: "48px" }}>
        <div className="flex items-center" style={{ gap: "24px" }}>
          <input
            type="text"
            name="artistName"
            autoComplete="off"
            placeholder="Search MusicBrainz name"
            aria-label="Search your artist name on MusicBrainz"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") go() }}
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 400,
              fontSize: "14px",
              color: "#E1DDD6",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid rgba(225, 221, 214, 0.3)",
              borderRadius: 0,
              padding: "0 0 8px 0",
              width: "280px",
              outline: "none",
            }}
          />
          <button
            onClick={go}
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 400,
              fontSize: "11px",
              color: "#0F0F0F",
              background: "#E1DDD6",
              textTransform: "uppercase",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: 0,
              display: "inline-block",
              border: "none",
              cursor: "pointer",
            }}
          >
            Claim my wallet
          </button>
        </div>
      </div>

      {/* Feature row */}
      <div style={{ marginTop: "80px" }}>
        <div
          style={{
            height: "1px",
            background: "rgba(225, 221, 214, 0.1)",
            width: "100%",
          }}
        />
        <div
          className="flex fa-features"
          style={{ paddingTop: "32px", gap: "80px" }}
        >
          <Feature
            icon={<div style={{ opacity: 0.5 }}><Coins size={20} color="#E1DDD6" /></div>}
            label="Earnings accumulate in escrow"
          />
          <Feature
            icon={<div style={{ opacity: 0.5 }}><Wallet size={20} color="#E1DDD6" /></div>}
            label="Claim with any USDC wallet"
          />
          <Feature
            icon={<div style={{ opacity: 0.5 }}><Shield size={20} color="#E1DDD6" /></div>}
            label="Verified via MusicBrainz ID"
          />
        </div>
      </div>

      </div>{/* end content layer */}
    </section>
  )
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ marginBottom: "12px" }}>{icon}</div>
      <p
        style={{
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontWeight: 400,
          fontSize: "13px",
          color: "rgba(225, 221, 214, 0.7)",
          lineHeight: "19px",
          margin: 0,
        }}
      >
        {label}
      </p>
    </div>
  )
}
