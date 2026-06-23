"use client"

const MONO = "var(--font-ibm-plex-mono), monospace"
const BODY = "#33302A"
const MUTED = "#6B665E"

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "how-it-works", label: "How it works" },
  { id: "pay-per-play", label: "Pay-per-play (x402)" },
  { id: "the-agent", label: "The agent" },
  { id: "for-artists", label: "For artists" },
  { id: "quick-start", label: "Quick start" },
  { id: "api", label: "API reference" },
  { id: "faq", label: "FAQ" },
]

// Scrolls to a section without leaving a "#section" hash in the address bar.
export default function DocsSidebar() {
  function go(id: string) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  return (
    <aside className="docs-sidebar" style={{ position: "sticky", top: "96px", width: "220px", flexShrink: 0 }}>
      <span style={{ fontFamily: MONO, fontSize: "11px", color: MUTED, textTransform: "uppercase", letterSpacing: "1px" }}>Documentation</span>
      <nav style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
        {NAV.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => go(n.id)}
            style={{ fontFamily: MONO, fontSize: "13px", color: BODY, background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer" }}
          >
            {n.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
