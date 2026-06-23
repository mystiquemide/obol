import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Obol collects, why, and how it's handled.",
}

const MONO = "var(--font-ibm-plex-mono), monospace"
const ALPINA = "var(--font-alpina)"

const heading: React.CSSProperties = {
  fontFamily: ALPINA,
  fontWeight: 400,
  fontSize: "24px",
  color: "#E1DDD6",
  letterSpacing: "-0.48px",
  margin: "48px 0 16px",
}

const body: React.CSSProperties = {
  fontFamily: MONO,
  fontWeight: 400,
  fontSize: "14px",
  color: "rgba(225, 221, 214, 0.72)",
  lineHeight: "22px",
  letterSpacing: "-0.28px",
  margin: "0 0 16px",
  maxWidth: "640px",
}

export default function Privacy() {
  return (
    <section style={{ background: "#0F0F0F", padding: "120px 120px 160px" }}>
      <div style={{ maxWidth: "720px" }}>
        <p style={{ fontFamily: MONO, fontSize: "11px", color: "#6B665E", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
          Last updated 23 June 2026
        </p>
        <h1
          style={{
            fontFamily: ALPINA,
            fontWeight: 400,
            fontSize: "40px",
            color: "#E1DDD6",
            lineHeight: "44px",
            letterSpacing: "-0.8px",
            margin: "16px 0 0",
          }}
        >
          Privacy.
        </h1>
        <p style={{ ...body, marginTop: "24px" }}>
          Obol connects to your self-hosted music server, reads what you listen to, and pays the
          artists behind it. That means it touches a few pieces of data about you. Here's exactly
          what, and why.
        </p>

        <h2 style={heading}>What we collect</h2>
        <p style={body}>
          When you connect a server, we store its URL, your username, and your password so the agent
          can sign in and read your listening history on your behalf. We read your play history
          (scrobbles) to know which artists to pay. We send artist names to MusicBrainz to resolve
          them to a canonical identity. For each payment we record the track title, amount, timestamp,
          the sending and receiving wallet, and the on-chain transaction hash.
        </p>

        <h2 style={heading}>How it's stored</h2>
        <p style={body}>
          Your data lives in our application database. Server credentials are kept only to operate the
          agent. Encrypting stored credentials at rest is on the roadmap and not yet in place, so don't
          reuse a password here that protects anything you can't afford to expose.
        </p>

        <h2 style={heading}>Who we share it with</h2>
        <p style={body}>
          We don't sell your data and we don't run ads. Operating the service means a few third parties
          see parts of it: MusicBrainz (artist names, for resolution), Circle (wallet and payment
          settlement), and our database host. Each sees only what its job needs.
        </p>

        <h2 style={heading}>Payments and the chain</h2>
        <p style={body}>
          Payments settle in USDC on the Arc testnet. On-chain transactions are public by nature: wallet
          addresses and amounts are visible to anyone reading the chain. Testnet tokens carry no
          real-world monetary value.
        </p>

        <h2 style={heading}>Removing your data</h2>
        <p style={body}>
          Want your server credentials and records deleted? Open an issue on the{" "}
          <Link href="https://github.com/mystiquemide/obol" style={{ color: "#10B981", textDecoration: "none" }}>
            GitHub repository
          </Link>{" "}
          and we'll remove them. On-chain payment records can't be deleted, since the chain is immutable.
        </p>

        <p style={{ ...body, marginTop: "48px", color: "rgba(225, 221, 214, 0.5)" }}>
          See also the{" "}
          <Link href="/terms" style={{ color: "rgba(225, 221, 214, 0.72)", textDecoration: "none", borderBottom: "1px solid rgba(225,221,214,0.3)" }}>
            terms of use
          </Link>.
        </p>
      </div>
    </section>
  )
}
