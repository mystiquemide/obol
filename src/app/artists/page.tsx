"use client"

import { useEffect, useRef, useState } from "react"

interface MbArtist {
  id: string
  name: string
  disambiguation: string
}

export default function Artists() {
  const heroRef = useRef<HTMLDivElement>(null)
  const [heroVisible, setHeroVisible] = useState(false)

  const verifyRef = useRef<HTMLDivElement>(null)
  const [verifyVisible, setVerifyVisible] = useState(false)

  const claimRef = useRef<HTMLDivElement>(null)
  const [claimVisible, setClaimVisible] = useState(false)

  const faqRef = useRef<HTMLDivElement>(null)
  const [faqVisible, setFaqVisible] = useState(false)

  const [walletAddress, setWalletAddress] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<MbArtist[]>([])
  const [selectedArtist, setSelectedArtist] = useState<MbArtist | null>(null)
  const [searching, setSearching] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [claimed, setClaimed] = useState(false)
  const [escrowBalance, setEscrowBalance] = useState<number | null>(null)
  const [escrowLoading, setEscrowLoading] = useState(false)
  const [claimedAlready, setClaimedAlready] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Self-onboarding form
  const [obName, setObName] = useState("")
  const [obWallet, setObWallet] = useState("")
  const [obTracks, setObTracks] = useState<{ title: string; price: string }[]>([
    { title: "", price: "0.001" },
  ])
  const [obSubmitting, setObSubmitting] = useState(false)
  const [obError, setObError] = useState<string | null>(null)
  const [obDone, setObDone] = useState<{ count: number } | null>(null)

  async function handleOnboard() {
    setObError(null)
    setObSubmitting(true)
    try {
      const res = await fetch("/api/artist/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: obName,
          walletAddress: obWallet,
          tracks: obTracks
            .filter((t) => t.title.trim())
            .map((t) => ({ title: t.title, priceUsdc: parseFloat(t.price) || 0.001 })),
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setObDone({ count: data.tracks.length })
      } else {
        setObError(data.error ?? "Could not list your music")
      }
    } catch {
      setObError("Could not reach the server")
    } finally {
      setObSubmitting(false)
    }
  }

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
    const el = verifyRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVerifyVisible(true); observer.disconnect() }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = claimRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setClaimVisible(true); observer.disconnect() }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = faqRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setFaqVisible(true); observer.disconnect() }
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

  const verifyReveal: React.CSSProperties = {
    opacity: verifyVisible ? 1 : 0,
    transform: verifyVisible ? "translateY(0)" : "translateY(40px)",
    transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
  }

  const claimReveal: React.CSSProperties = {
    opacity: claimVisible ? 1 : 0,
    transform: claimVisible ? "translateY(0)" : "translateY(40px)",
    transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
  }

  const faqReveal: React.CSSProperties = {
    opacity: faqVisible ? 1 : 0,
    transform: faqVisible ? "translateY(0)" : "translateY(40px)",
    transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
  }

  function handleSearch(query: string) {
    setSearchQuery(query)
    setSelectedArtist(null)
    setClaimError(null)
    setClaimed(false)
    if (!query.trim()) { setShowResults(false); setResults([]); return }
    if (searchTimer.current) clearTimeout(searchTimer.current)
    setSearching(true)
    setShowResults(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/artist/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.artists ?? [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  async function handleSelectArtist(artist: MbArtist) {
    setSelectedArtist(artist)
    setEscrowBalance(null)
    setClaimedAlready(false)
    setEscrowLoading(true)
    try {
      const res = await fetch(`/api/artist/escrow?mbId=${encodeURIComponent(artist.id)}`)
      const data = await res.json()
      if (data.ok) {
        setEscrowBalance(data.totalEarned ?? 0)
        setClaimedAlready(!!data.claimed)
      } else {
        setEscrowBalance(0)
      }
    } catch {
      setEscrowBalance(0)
    } finally {
      setEscrowLoading(false)
    }
  }

  async function handleClaim() {
    if (!selectedArtist) { setClaimError("Select your artist first"); return }
    if (!walletAddress.trim()) { setClaimError("Enter your USDC wallet address"); return }
    setClaiming(true)
    setClaimError(null)
    try {
      const res = await fetch("/api/artist/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musicBrainzId: selectedArtist.id, name: selectedArtist.name, walletAddress }),
      })
      const data = await res.json()
      if (data.ok) {
        setClaimed(true)
        setEscrowBalance(data.artist.totalEarned)
      } else {
        setClaimError(data.error ?? "Claim failed")
      }
    } catch {
      setClaimError("Could not reach the server")
    } finally {
      setClaiming(false)
    }
  }

  const FAQ_ITEMS = [
    {
      q: "How do listeners find my music?",
      a: "They don't need to. Obol pays you when anyone with a Navidrome server plays your tracks. If it's on MusicBrainz, it's earning.",
    },
    {
      q: "What if I'm not on MusicBrainz?",
      a: "Add your music. It's free, open-source, and takes under 10 minutes.",
    },
    {
      q: "How much do I earn per stream?",
      a: "The listener sets their rate. Default is $0.001 USDC per play. 100% goes to you. Obol takes nothing.",
    },
  ]

  return (
    <div className="mobile-page">

      {/* ── Hero strip ── */}
      <section style={{ background: "#0F0F0F", paddingTop: "160px", paddingBottom: "80px", paddingLeft: "120px", paddingRight: "120px", position: "relative", overflow: "hidden" }}>
        {/* Gold vinyl image — full section coverage */}
        <img
          src="/for-artists-bg.jpg"
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        {/* Top + bottom edge fades into dark */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, #0F0F0F 0%, transparent 18%, transparent 80%, #0F0F0F 100%)", pointerEvents: "none", zIndex: 0 }} />
        {/* Left side text readability */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(15,15,15,0.65) 0%, rgba(15,15,15,0.2) 40%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
        <div ref={heroRef} style={{ ...heroReveal, position: "relative", zIndex: 1 }}>
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
            For Artists
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
            Your music is already earning.
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
            Claim your wallet and withdraw anytime. Obol takes nothing.
          </p>
        </div>
      </section>

      {/* ── Verify ── */}
      <section style={{ background: "#E1DDD6", paddingTop: "100px", paddingBottom: "100px", paddingLeft: "120px", paddingRight: "120px" }}>
        <div ref={verifyRef} style={verifyReveal}>
          {/* Label row */}
          <div style={{ display: "flex", gap: "8px" }}>
            {["VERIFY", "VERIFY", "VERIFY"].map((word, i) => (
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
              color: "#0F0F0F",
              lineHeight: "38px",
              letterSpacing: "-0.76px",
              margin: "16px 0 0",
            }}
          >
            Who are you on MusicBrainz?
          </h2>

          {/* Search input */}
          <input
            className="artists-search-input"
            type="text"
            placeholder="Search your artist name"
            aria-label="Search your artist name on MusicBrainz"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              display: "block",
              marginTop: "48px",
              maxWidth: "420px",
              width: "100%",
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 400,
              fontSize: "14px",
              color: "#0F0F0F",
              background: "transparent",
              border: "1px solid rgba(15,15,15,0.15)",
              borderRadius: 0,
              padding: "12px 16px",
              outline: "none",
            }}
          />

          {/* Results list */}
          {showResults && (
            <div style={{ marginTop: "32px" }}>
              {searching && (
                <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", color: "#6B665E" }}>
                  Searching MusicBrainz...
                </p>
              )}
              {!searching && results.length === 0 && searchQuery.length > 0 && (
                <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", color: "#6B665E" }}>
                  No artists found. Check the spelling or try a shorter name.
                </p>
              )}
              {results.map((result, i) => (
                <div
                  key={result.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedArtist?.id === result.id}
                  aria-label={`Select ${result.name}`}
                  onClick={() => handleSelectArtist(result)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      handleSelectArtist(result)
                    }
                  }}
                  style={{
                    marginBottom: i < results.length - 1 ? "24px" : 0,
                    paddingLeft: selectedArtist?.id === result.id ? "12px" : "0",
                    borderLeft: selectedArtist?.id === result.id ? "2px solid #10B981" : "2px solid transparent",
                    cursor: "pointer",
                    transition: "padding-left 0.15s ease, border-color 0.15s ease",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-alpina)", fontWeight: 400, fontSize: "22px", color: "#0F0F0F", lineHeight: "28px" }}>
                    {result.name}
                  </span>
                  {" "}
                  {result.disambiguation && (
                    <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontWeight: 400, fontSize: "11px", color: "#6B665E" }}>
                      {result.disambiguation}
                    </span>
                  )}

                  {selectedArtist?.id === result.id && (
                    <div style={{ marginTop: "12px" }}>
                      {escrowLoading ? (
                        <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", color: "#6B665E" }}>
                          Checking escrow
                        </span>
                      ) : escrowBalance !== null && escrowBalance > 0 ? (
                        <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "13px", color: "#10B981" }}>
                          ${escrowBalance.toFixed(4)} USDC waiting for you{claimedAlready ? " (already claimed)" : ""}
                        </span>
                      ) : (
                        <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", color: "#6B665E" }}>
                          No earnings yet. Claim your wallet so future plays pay out.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Claim ── */}
      <section style={{ background: "#0F0F0F", paddingTop: "100px", paddingBottom: "100px", paddingLeft: "120px", paddingRight: "120px" }}>
        <div ref={claimRef} style={claimReveal}>
          {/* Label row */}
          <div style={{ display: "flex", gap: "8px" }}>
            {["CLAIM", "CLAIM", "CLAIM"].map((word, i) => (
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
            Where should we send it?
          </h2>

          {/* Balance display */}
          <div style={{ marginTop: "48px" }}>
            <div
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontWeight: 500,
                fontSize: "28px",
                color: "#10B981",
                letterSpacing: "-0.56px",
              }}
            >
              ${escrowBalance !== null ? escrowBalance.toFixed(4) : "0.00"}
            </div>
            <div
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontWeight: 400,
                fontSize: "11px",
                color: "#6B665E",
                textTransform: "uppercase",
                marginTop: "6px",
              }}
            >
              USDC IN ESCROW
            </div>
          </div>

          {/* Wallet input */}
          <input
            className="artists-wallet-input"
            type="text"
            placeholder="USDC wallet address"
            aria-label="Your USDC wallet address"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            style={{
              display: "block",
              marginTop: "40px",
              maxWidth: "420px",
              width: "100%",
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 400,
              fontSize: "14px",
              color: "#E1DDD6",
              background: "transparent",
              border: "1px solid rgba(225,221,214,0.15)",
              borderRadius: 0,
              padding: "12px 16px",
              outline: "none",
            }}
          />

          {/* Claim button */}
          {!claimed ? (
            <button
              type="button"
              onClick={handleClaim}
              disabled={claiming}
              style={{
                display: "block",
                marginTop: "24px",
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontWeight: 400,
                fontSize: "12px",
                textTransform: "uppercase",
                background: "#E1DDD6",
                color: "#0F0F0F",
                padding: "12px 24px",
                border: "none",
                borderRadius: 0,
                cursor: claiming ? "not-allowed" : "pointer",
                opacity: claiming ? 0.5 : 1,
              }}
            >
              {claiming ? "CLAIMING..." : "CLAIM MY EARNINGS"}
            </button>
          ) : (
            <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
              <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", color: "#10B981" }}>
                Wallet claimed. Payments will be sent automatically.
              </span>
            </div>
          )}

          {/* Error */}
          {claimError && (
            <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", color: "#0F0F0F", opacity: 0.5, margin: "12px 0 0" }}>
              {claimError}
            </p>
          )}

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
            Obol never holds your funds. Payouts are instant.
          </p>
        </div>
      </section>

      {/* ── List your music (self-onboarding) ── */}
      <section style={{ background: "#F5F2EC", paddingTop: "100px", paddingBottom: "100px", paddingLeft: "120px", paddingRight: "120px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {["LIST YOUR MUSIC", "LIST YOUR MUSIC"].map((word, i) => (
            <span key={i} style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontWeight: 400, fontSize: "11px", color: "#0F0F0F", textTransform: "uppercase", letterSpacing: "-0.22px" }}>
              {word}
            </span>
          ))}
        </div>
        <h2 style={{ fontFamily: "var(--font-alpina)", fontWeight: 400, fontSize: "38px", color: "#0F0F0F", lineHeight: "38px", letterSpacing: "-0.76px", margin: "16px 0 0" }}>
          Put your tracks on Obol.
        </h2>
        <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "12px", color: "#6B665E", maxWidth: "520px", margin: "12px 0 0", lineHeight: "18px" }}>
          Add your name, a wallet, and your tracks. They go live on the Listen page, and every play pays you in USDC on Arc, instantly.
        </p>

        {obDone ? (
          <div style={{ marginTop: "40px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
              <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "12px", color: "#10B981" }}>
                {obDone.count} track{obDone.count === 1 ? "" : "s"} listed. Find them on the Listen page.
              </span>
            </div>
            <a href="/listen" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "12px", color: "#0F0F0F", textDecoration: "none", borderBottom: "1px solid rgba(15,15,15,0.3)", display: "inline-block", marginTop: "16px" }}>
              Go to Listen →
            </a>
          </div>
        ) : (
          <div style={{ marginTop: "40px", maxWidth: "440px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <input
              type="text"
              placeholder="Artist name"
              aria-label="Artist name"
              value={obName}
              onChange={(e) => setObName(e.target.value)}
              className="artists-search-input"
              style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "14px", color: "#0F0F0F", background: "transparent", border: "1px solid rgba(15,15,15,0.15)", borderRadius: 0, padding: "12px 16px", outline: "none", width: "100%", boxSizing: "border-box" }}
            />
            <input
              type="text"
              placeholder="USDC wallet address (0x...)"
              aria-label="Your USDC wallet address"
              value={obWallet}
              onChange={(e) => setObWallet(e.target.value)}
              className="artists-search-input"
              style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "14px", color: "#0F0F0F", background: "transparent", border: "1px solid rgba(15,15,15,0.15)", borderRadius: 0, padding: "12px 16px", outline: "none", width: "100%", boxSizing: "border-box" }}
            />

            {obTracks.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder={`Track ${i + 1} title`}
                  aria-label={`Track ${i + 1} title`}
                  value={t.title}
                  onChange={(e) => setObTracks((rows) => rows.map((r, j) => (j === i ? { ...r, title: e.target.value } : r)))}
                  className="artists-search-input"
                  style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "14px", color: "#0F0F0F", background: "transparent", border: "1px solid rgba(15,15,15,0.15)", borderRadius: 0, padding: "12px 16px", outline: "none", flex: 1, minWidth: 0 }}
                />
                <input
                  type="text"
                  placeholder="0.001"
                  aria-label={`Track ${i + 1} price in USDC`}
                  value={t.price}
                  onChange={(e) => setObTracks((rows) => rows.map((r, j) => (j === i ? { ...r, price: e.target.value } : r)))}
                  className="artists-search-input"
                  style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "14px", color: "#0F0F0F", background: "transparent", border: "1px solid rgba(15,15,15,0.15)", borderRadius: 0, padding: "12px 16px", outline: "none", width: "90px" }}
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() => setObTracks((r) => [...r, { title: "", price: "0.001" }])}
              style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", color: "#6B665E", background: "none", border: "none", padding: 0, textTransform: "uppercase", cursor: "pointer", alignSelf: "flex-start" }}
            >
              + Add another track
            </button>

            <button
              type="button"
              onClick={handleOnboard}
              disabled={obSubmitting}
              style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "12px", color: "#E1DDD6", background: "#0F0F0F", textTransform: "uppercase", border: "none", borderRadius: 0, padding: "12px 24px", cursor: obSubmitting ? "not-allowed" : "pointer", opacity: obSubmitting ? 0.5 : 1, alignSelf: "flex-start", marginTop: "8px" }}
            >
              {obSubmitting ? "Listing…" : "List my music"}
            </button>

            {obError && (
              <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", color: "#0F0F0F", opacity: 0.5, margin: 0 }}>{obError}</p>
            )}
          </div>
        )}
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: "#E1DDD6", paddingTop: "100px", paddingBottom: "160px", paddingLeft: "120px", paddingRight: "120px", position: "relative", overflow: "hidden" }}>

        {/* Artist images — right side, 2×2 grid */}
        <div className="artists-faq-images" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "58%", display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", zIndex: 0, pointerEvents: "none" }}>
          {/* Weeknd — face is mid-image behind the orange glow */}
          <div style={{ position: "relative", overflow: "hidden" }}>
            <img src="/faq-artist-1.jpg" alt="" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 45%" }} />
          </div>
          {/* Bruno Mars — face upper-center */}
          <div style={{ position: "relative", overflow: "hidden" }}>
            <img src="/faq-artist-3.jpg" alt="" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 25%" }} />
          </div>
          {/* Adele — face upper portion */}
          <div style={{ position: "relative", overflow: "hidden" }}>
            <img src="/faq-artist-4.jpg" alt="" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }} />
          </div>
          {/* Ed Sheeran — face lower since arms raised */}
          <div style={{ position: "relative", overflow: "hidden" }}>
            <img src="/faq-artist-2.jpg" alt="" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 65%" }} />
          </div>
          {/* Bottom fade into cream only — top bleeds to section edge */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 0%, transparent 82%, #E1DDD6 100%)", pointerEvents: "none" }} />
          {/* Left edge fade into cream */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #E1DDD6 0%, transparent 25%)", pointerEvents: "none" }} />
        </div>

        <div ref={faqRef} className="artists-faq-content" style={{ ...faqReveal, position: "relative", zIndex: 1, maxWidth: "56%" }}>
          {/* Label row */}
          <div style={{ display: "flex", gap: "8px" }}>
            {["QUESTIONS", "QUESTIONS", "QUESTIONS"].map((word, i) => (
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
              color: "#0F0F0F",
              lineHeight: "38px",
              letterSpacing: "-0.76px",
              margin: "16px 0 0",
            }}
          >
            How it works for artists.
          </h2>

          {/* Q&A items */}
          <div style={{ marginTop: "48px", display: "flex", flexDirection: "column", gap: "32px" }}>
            {FAQ_ITEMS.map(({ q, a }, i) => (
              <div key={i}>
                <p
                  style={{
                    fontFamily: "var(--font-alpina)",
                    fontWeight: 400,
                    fontSize: "22px",
                    color: "#0F0F0F",
                    lineHeight: "24.2px",
                    letterSpacing: "-0.44px",
                    margin: 0,
                  }}
                >
                  {q}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontWeight: 400,
                    fontSize: "11px",
                    color: "#6B665E",
                    lineHeight: "15.4px",
                    letterSpacing: "-0.22px",
                    maxWidth: "540px",
                    margin: "8px 0 0",
                  }}
                >
                  {a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Page links ── */}
      <section style={{ background: "#0F0F0F", padding: "60px 120px" }}>
        <div style={{ display: "flex", gap: "32px" }}>
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
