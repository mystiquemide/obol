import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms you agree to when you use Obol.",
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

export default function Terms() {
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
          Terms of use.
        </h1>
        <p style={{ ...body, marginTop: "24px" }}>
          By connecting a music server or claiming an artist profile, you agree to these terms. They're
          short and written to be read.
        </p>

        <h2 style={heading}>What Obol is</h2>
        <p style={body}>
          Obol is beta software running on a test network. It reads your listening and sends small USDC
          payments to artists on the Arc testnet. Testnet USDC has no real-world monetary value, and
          nothing here is a financial product or investment.
        </p>

        <h2 style={heading}>Authorizing the agent</h2>
        <p style={body}>
          When you connect a server, you authorize the agent to read your listening history and move
          funds from your wallet to artists on your behalf, based on what you play. On-chain transfers
          are irreversible once settled. You're responsible for the credentials and wallet you connect.
        </p>

        <h2 style={heading}>For artists</h2>
        <p style={body}>
          If you claim a profile, you're responsible for the accuracy of the wallet address you provide.
          Payments go to that address exactly as entered. We can't recover funds sent to a wrong or
          mistyped address.
        </p>

        <h2 style={heading}>No warranty</h2>
        <p style={body}>
          The service is provided as-is, without warranty of any kind. We don't guarantee uptime, that
          payments always settle, or that the agent runs without error. To the extent the law allows, we
          aren't liable for losses arising from your use of the service.
        </p>

        <h2 style={heading}>Changes</h2>
        <p style={body}>
          We may update these terms as the product changes. Continuing to use Obol after an update means
          you accept the revised terms.
        </p>

        <p style={{ ...body, marginTop: "48px", color: "rgba(225, 221, 214, 0.5)" }}>
          Questions? Open an issue on{" "}
          <Link href="https://github.com/mystiquemide/obol" style={{ color: "rgba(225, 221, 214, 0.72)", textDecoration: "none", borderBottom: "1px solid rgba(225,221,214,0.3)" }}>
            GitHub
          </Link>{" "}
          or read the{" "}
          <Link href="/privacy" style={{ color: "rgba(225, 221, 214, 0.72)", textDecoration: "none", borderBottom: "1px solid rgba(225,221,214,0.3)" }}>
            privacy notice
          </Link>.
        </p>
      </div>
    </section>
  )
}
