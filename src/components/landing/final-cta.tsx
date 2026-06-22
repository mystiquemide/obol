import Link from "next/link"

const MONO = "var(--font-ibm-plex-mono), monospace"

export function FinalCta() {
  return (
    <section
      className="section-pad"
      style={{
        background: "#0F0F0F",
        padding: "160px 120px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* MJ image — right side, full section height */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "52%",
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <img
          src="/final-cta-bg.jpg"
          alt=""
          aria-hidden="true"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            display: "block",
          }}
        />
        {/* Blend left edge into dark */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, #0F0F0F 0%, rgba(15,15,15,0.55) 22%, transparent 52%)",
          }}
        />
        {/* Bottom fade */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "20%",
            background: "linear-gradient(to top, #0F0F0F, transparent)",
          }}
        />
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Headline */}
        <h2
          className="fcta-headline"
          style={{
            fontFamily: "var(--font-alpina)",
            fontWeight: 400,
            fontSize: "38px",
            color: "#E1DDD6",
            lineHeight: "38px",
            letterSpacing: "-0.76px",
            margin: 0,
            maxWidth: "680px",
          }}
        >
          The payment layer self-hosted music has needed for 20 years.
        </h2>

        {/* CTAs */}
        <div className="flex items-center fcta-ctas" style={{ gap: "24px", marginTop: "48px" }}>
          <Link
            href="/dashboard"
            style={{
              fontFamily: MONO,
              fontWeight: 400,
              fontSize: "12px",
              color: "#E1DDD6",
              textTransform: "uppercase",
              textDecoration: "none",
              background: "none",
              border: "none",
              borderRadius: 0,
              padding: 0,
            }}
          >
            Connect Navidrome
          </Link>
          <Link
            href="/artists"
            style={{
              fontFamily: MONO,
              fontWeight: 400,
              fontSize: "12px",
              color: "#E1DDD6",
              textTransform: "uppercase",
              textDecoration: "none",
              background: "none",
              border: "none",
              borderRadius: 0,
              padding: 0,
            }}
          >
            Claim as artist
          </Link>
        </div>
      </div>
    </section>
  )
}
