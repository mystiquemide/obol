"use client"

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#0F0F0F", margin: 0 }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "monospace" }}>
          <p style={{ fontSize: "14px", color: "#E1DDD6" }}>We&apos;re having trouble loading this.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: "20px", fontSize: "12px", color: "#10B981", background: "none", border: "none", cursor: "pointer", textTransform: "uppercase" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
