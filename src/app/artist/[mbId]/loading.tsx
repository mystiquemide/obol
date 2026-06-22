const MONO = "var(--font-ibm-plex-mono), monospace"

export default function Loading() {
  return (
    <div style={{ background: "#0F0F0F", minHeight: "100vh", paddingTop: "160px", paddingLeft: "120px" }}>
      <p style={{ fontFamily: MONO, fontSize: "13px", color: "#6B665E" }}>Loading receipt…</p>
    </div>
  )
}
