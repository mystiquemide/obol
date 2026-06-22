const MONO = "var(--font-ibm-plex-mono), monospace"
const ALPINA = "var(--font-alpina)"

export default function NotFound() {
  return (
    <div style={{ background: "#0F0F0F", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <p style={{ fontFamily: ALPINA, fontSize: "64px", color: "#E1DDD6", lineHeight: 1, margin: 0 }}>404</p>
      <p style={{ fontFamily: MONO, fontSize: "13px", color: "#6B665E", marginTop: "16px" }}>This page doesn&apos;t exist.</p>
      <a href="/" style={{ fontFamily: MONO, fontSize: "12px", color: "#10B981", textDecoration: "none", textTransform: "uppercase", marginTop: "24px", borderBottom: "1px solid rgba(16,185,129,0.4)" }}>
        Back home
      </a>
    </div>
  )
}
