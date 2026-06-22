import Link from "next/link"

const MONO = "var(--font-ibm-plex-mono), monospace"

const LINK_STYLE = {
  fontFamily: MONO,
  fontWeight: 400,
  fontSize: "11px",
  color: "rgba(225, 221, 214, 0.5)",
  textDecoration: "none",
}

export function Footer() {
  return (
    <footer
      className="flex items-center justify-between footer-wrap"
      style={{
        background: "#0F0F0F",
        padding: "40px 120px",
        borderTop: "1px solid rgba(225, 221, 214, 0.08)",
      }}
    >
      {/* Left: logo + wordmark */}
      <div className="flex items-center" style={{ gap: "8px" }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            border: "1px solid rgba(225, 221, 214, 0.4)",
            background: "transparent",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-alpina)",
              fontWeight: 400,
              fontSize: "12px",
              color: "#E1DDD6",
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            O
          </span>
        </div>
        <span
          style={{
            fontFamily: MONO,
            fontWeight: 400,
            fontSize: "11px",
            color: "rgba(225, 221, 214, 0.5)",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          Obol
        </span>
      </div>

      {/* Right: links + tagline */}
      <div className="flex items-center" style={{ gap: "24px" }}>
        <Link href="https://github.com/mystiquemide/obol" style={LINK_STYLE}>
          GitHub
        </Link>
        <Link href="/dashboard" style={LINK_STYLE}>
          Dashboard
        </Link>
        <span
          style={{
            fontFamily: MONO,
            fontWeight: 400,
            fontSize: "11px",
            color: "#6B665E",
          }}
        >
          Powered by Circle + Arc
        </span>
      </div>
    </footer>
  )
}
