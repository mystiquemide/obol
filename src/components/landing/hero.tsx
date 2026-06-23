import Link from "next/link"

export function Hero() {
  return (
    <section className="relative hero-section" style={{ background: "#0F0F0F", overflow: "hidden", height: "100vh" }}>
      {/* Hero background image */}
      <img
        src="/hero-bg.jpg"
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 20%",
          opacity: 1,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Subtle gradient — top and bottom only, face stays untouched */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to bottom, rgba(15,15,15,0.25) 0%, rgba(15,15,15,0.45) 60%, rgba(15,15,15,0.85) 100%)",
        zIndex: 1,
        pointerEvents: "none",
      }} />
      <div className="hero-content" style={{ maxWidth: "720px", position: "relative", zIndex: 2, paddingLeft: "120px", display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>

        {/* Label row */}
        <div className="flex items-center" style={{ gap: "10px", marginBottom: "40px" }}>
          <span
            className="hero-label"
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 500,
              fontSize: "11px",
              color: "#E1DDD6",
              textTransform: "uppercase",
              letterSpacing: "-0.22px",
            }}
          >
            Built on Arc + Circle
          </span>
        </div>

        {/* Headline */}
        <h1
          className="hero-headline"
          style={{
            fontFamily: "var(--font-alpina)",
            fontWeight: 400,
            fontSize: "40px",
            color: "#E1DDD6",
            lineHeight: "48px",
            letterSpacing: "-0.4px",
            margin: 0,
          }}
        >
          Your music collection pays its creators.
        </h1>

        {/* Subtext */}
        <p
          className="hero-subtext"
          style={{
            fontFamily: "var(--font-ibm-plex-mono), monospace",
            fontWeight: 400,
            fontSize: "16px",
            color: "rgba(225,221,214,0.7)",
            lineHeight: "24.2px",
            letterSpacing: "-0.44px",
            marginTop: "24px",
            marginBottom: 0,
          }}
        >
          Obol reads your Navidrome scrobbles, resolves artists via MusicBrainz, and sends USDC nanopayments autonomously.
        </p>

        {/* CTAs — lead with the pay-per-play demo (works for everyone, no setup);
            the dashboard path is for self-hosters, so it's secondary. */}
        <div className="flex items-center hero-ctas" style={{ gap: "32px", marginTop: "40px" }}>
          <Link
            href="/listen"
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 400,
              fontSize: "12px",
              color: "#0F0F0F",
              textTransform: "uppercase",
              textDecoration: "none",
              background: "#E1DDD6",
              border: "none",
              padding: "8px 16px",
              borderRadius: 0,
            }}
          >
            Play a track
          </Link>
          <Link
            href="/dashboard"
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontWeight: 400,
              fontSize: "12px",
              color: "#E1DDD6",
              textTransform: "uppercase",
              textDecoration: "none",
              background: "none",
              border: "none",
              padding: 0,
              borderRadius: 0,
            }}
          >
            Connect your server
          </Link>
        </div>

      </div>
    </section>
  )
}
