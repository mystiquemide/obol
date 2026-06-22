"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

const MONO = "var(--font-ibm-plex-mono), monospace"

export function Nav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const onDashboard = pathname === "/dashboard"

  return (
    <>
      <nav className="fixed top-0 z-50 w-full" style={{ height: "56px", background: "transparent" }}>
        <div className="flex items-center justify-between h-full" style={{ padding: "0 48px" }}>

          {/* Logo + Wordmark */}
          <Link href="/" className="flex items-center" style={{ gap: "10px", textDecoration: "none" }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: "28px",
                height: "28px",
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
                  fontSize: "18px",
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
                fontWeight: 500,
                fontSize: "14px",
                color: "#E1DDD6",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              Obol
            </span>
          </Link>

          {/* Center Links — hidden on mobile */}
          <div className="nav-links flex items-center" style={{ gap: "40px" }}>
            <Link
              href="/listen"
              style={{
                fontFamily: MONO,
                fontWeight: 400,
                fontSize: "11px",
                color: "#E1DDD6",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              Listen
            </Link>
            <Link
              href="/how-it-works"
              style={{
                fontFamily: MONO,
                fontWeight: 400,
                fontSize: "11px",
                color: "#E1DDD6",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              How it works
            </Link>
            <Link
              href="/artists"
              style={{
                fontFamily: MONO,
                fontWeight: 400,
                fontSize: "11px",
                color: "#E1DDD6",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              For artists
            </Link>
          </div>

          {/* CTA — hidden on mobile, hidden on dashboard */}
          {!onDashboard && (
            <div className="nav-desktop-cta">
              <Link
                href="/dashboard"
                style={{
                  fontFamily: MONO,
                  fontWeight: 400,
                  fontSize: "12px",
                  color: "#0F0F0F",
                  background: "#E1DDD6",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  padding: "8px 16px",
                  borderRadius: "0px",
                  display: "inline-block",
                  border: "none",
                }}
              >
                Open dashboard
              </Link>
            </div>
          )}

          {/* Hamburger — hidden on desktop, shown on mobile */}
          <button
            className="nav-hamburger"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                width: "24px",
                height: "18px",
              }}
            >
              <span style={{ display: "block", width: "18px", height: "2px", background: "#E1DDD6" }} />
              <span style={{ display: "block", width: "18px", height: "2px", background: "#E1DDD6" }} />
              <span style={{ display: "block", width: "18px", height: "2px", background: "#E1DDD6" }} />
            </div>
          </button>

        </div>
      </nav>

      {/* Mobile full-screen overlay */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#0F0F0F",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            style={{
              position: "absolute",
              top: "32px",
              right: "32px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: MONO,
              fontSize: "24px",
              color: "#E1DDD6",
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>

          {/* Links */}
          <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "32px" }}>
            <Link
              href="/listen"
              onClick={() => setOpen(false)}
              style={{
                fontFamily: MONO,
                fontWeight: 400,
                fontSize: "16px",
                color: "#E1DDD6",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              Listen
            </Link>
            <Link
              href="/how-it-works"
              onClick={() => setOpen(false)}
              style={{
                fontFamily: MONO,
                fontWeight: 400,
                fontSize: "16px",
                color: "#E1DDD6",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              How it works
            </Link>
            <Link
              href="/artists"
              onClick={() => setOpen(false)}
              style={{
                fontFamily: MONO,
                fontWeight: 400,
                fontSize: "16px",
                color: "#E1DDD6",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              For artists
            </Link>
            {!onDashboard && (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                style={{
                  fontFamily: MONO,
                  fontWeight: 400,
                  fontSize: "16px",
                  color: "#0F0F0F",
                  background: "#E1DDD6",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  padding: "8px 16px",
                }}
              >
                Open dashboard
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
