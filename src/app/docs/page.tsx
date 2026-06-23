import type { Metadata } from "next"
import DocsSidebar from "./sidebar"

export const metadata: Metadata = {
  title: "Documentation",
  description: "How Obol works: pay-per-play (x402), the payment agent, artist onboarding, setup, and API reference.",
}

const MONO = "var(--font-ibm-plex-mono), monospace"
const ALPINA = "var(--font-alpina)"
const INK = "#0F0F0F"
const BODY = "#33302A"
const MUTED = "#6B665E"
const GREEN = "#10B981"

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} style={{ fontFamily: ALPINA, fontWeight: 400, fontSize: "30px", color: INK, letterSpacing: "-0.6px", margin: "56px 0 16px", scrollMarginTop: "96px" }}>
      {children}
    </h2>
  )
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: MONO, fontSize: "14px", color: BODY, lineHeight: "23px", margin: "0 0 16px", maxWidth: "680px" }}>{children}</p>
}
function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre style={{ background: INK, color: "#E1DDD6", fontFamily: MONO, fontSize: "13px", lineHeight: "20px", padding: "16px 20px", overflowX: "auto", margin: "0 0 20px", maxWidth: "680px" }}>
      <code>{children}</code>
    </pre>
  )
}
function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ borderLeft: `2px solid ${GREEN}`, background: "rgba(16,185,129,0.06)", padding: "14px 18px", margin: "0 0 20px", maxWidth: "680px" }}>
      <p style={{ fontFamily: MONO, fontSize: "13px", color: BODY, lineHeight: "20px", margin: 0 }}>{children}</p>
    </div>
  )
}

export default function Docs() {
  return (
    <div className="mobile-page" style={{ background: "#F5F2EC", minHeight: "100vh" }}>
      <div className="docs-layout" style={{ display: "flex", gap: "48px", padding: "140px 80px 120px", alignItems: "flex-start" }}>
        {/* Sidebar */}
        <DocsSidebar />

        {/* Content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontFamily: MONO, fontSize: "11px", color: MUTED, textTransform: "uppercase", letterSpacing: "1px" }}>Docs</span>
          <h1 style={{ fontFamily: ALPINA, fontWeight: 400, fontSize: "44px", color: INK, letterSpacing: "-0.5px", margin: "12px 0 0" }}>
            Get started with Obol
          </h1>
          <P>Obol turns a listen into a payment to the artist, settled in USDC on-chain. This guide covers how it works, how to play and pay, how artists get listed and paid, how to run it yourself, and the API.</P>

          <H2 id="overview">Overview</H2>
          <P>Obol pays artists per listen, in real time, on-chain. There are two ways value moves:</P>
          <P>Pay-per-play uses an HTTP 402 payment gate so anyone can press play and pay the artist a USDC nanopayment on Arc. The agent watches a self-hosted listening history and settles a payment per scrobble. Both produce a real on-chain transaction you can verify.</P>
          <Callout>You do not need a crypto wallet or a subscription to listen. Payments settle through managed wallets behind the app, and every payment links to the Arc block explorer.</Callout>

          <H2 id="how-it-works">How it works</H2>
          <P>A play (or a scrobble) is matched to an artist, a USDC transfer is sent to that artist&apos;s wallet through Circle, the transfer settles on Arc, and the on-chain transaction hash is recorded against the payment. Unclaimed artists accrue earnings in escrow against their MusicBrainz identity until they claim a wallet.</P>

          <H2 id="pay-per-play">Pay-per-play (x402)</H2>
          <P>The <code>/listen</code> page is the simplest way to see Obol work. Press play on a track and watch the handshake: the request hits a 402, a USDC payment settles on Arc, the proof is verified, and the track unlocks.</P>
          <P>Under the hood, the gate is a real HTTP 402 endpoint. A request with no payment returns the amount, recipient, and asset; a request carrying a verified on-chain proof returns the unlocked resource.</P>
          <Code>{`# Challenge: ask for the resource, get payment requirements
curl -i https://<host>/api/x402/track/cipher
# HTTP/1.1 402 Payment Required
# { "x402Version": 1, "accepts": [{ "scheme": "arc-onchain", "payTo": "0x..", ... }] }`}</Code>
          <Callout>Obol&apos;s scheme is labeled <code>arc-onchain</code>: it settles via Circle on Arc and verifies by transaction hash, rather than the EIP-3009 facilitator scheme.</Callout>

          <H2 id="the-agent">The agent</H2>
          <P>For self-hosted libraries, connect a Navidrome or Subsonic server on the dashboard. The agent reads your listening, resolves each track&apos;s artist via MusicBrainz, and when the match is ambiguous it asks an LLM to pick the real performer and records the reasoning. It then queues and settles a USDC payment per listen.</P>
          <P>Trigger a run manually from the dashboard, turn on Auto-run, or let the scheduled run handle it. A per-listen rate and a daily spend cap keep spending under your control.</P>

          <H2 id="for-artists">For artists</H2>
          <P>On the For Artists page you can search your name, see how much USDC is waiting for you in escrow, and claim it to a wallet. You can also list your own tracks: add a name, a wallet, and your catalog, and your tracks go live on the Listen page and pay you on-chain.</P>
          <P>Every artist gets a public receipt page with a verifiable on-chain ledger of every payment received.</P>

          <H2 id="quick-start">Quick start</H2>
          <P>Run Obol locally with a free Postgres database, a Groq key, and Circle sandbox credentials.</P>
          <Code>{`npm install
cp .env.example .env          # fill in the values
npx prisma db push            # sync schema to your database
node scripts/gen-audio.mjs    # generate sample audio
node scripts/seed-tracks.mjs  # seed the catalog
npm run dev                   # http://localhost:3000`}</Code>
          <P>See the deployment guide for Vercel and Docker instructions.</P>

          <H2 id="api">API reference</H2>
          <P>The main endpoints:</P>
          <Code>{`GET  /api/x402/catalog          # list playable tracks
GET  /api/x402/track/:id        # 402 gate (payment requirements)
POST /api/x402/play/:id         # play + pay + unlock (streamed)
POST /api/agent/run             # run the payment agent (streamed)
GET  /api/agent/status          # lifetime stats + recent payments
GET  /api/artist/escrow?mbId=   # escrow balance for an artist
POST /api/artist/claim          # claim an artist to a wallet
POST /api/artist/onboard        # list an artist + tracks
GET  /api/health                # liveness + database check`}</Code>

          <H2 id="faq">FAQ</H2>
          <P><strong>Do I need a wallet to listen?</strong> No. Payments settle through managed wallets behind the app.</P>
          <P><strong>Is this real money?</strong> Settlement runs on Arc Testnet today. Mainnet follows a security review.</P>
          <P><strong>How do artists get paid if they haven&apos;t signed up?</strong> Earnings accrue in escrow against their MusicBrainz identity and release when they claim a wallet.</P>
          <P><strong>What music plays?</strong> The catalog uses sample audio for demonstration; production catalogs would use licensed recordings.</P>

          <div style={{ marginTop: "64px", paddingTop: "24px", borderTop: "1px solid rgba(15,15,15,0.1)", display: "flex", gap: "28px" }}>
            <a href="/listen" style={{ fontFamily: MONO, fontSize: "12px", color: GREEN, textDecoration: "none", textTransform: "uppercase" }}>Try it on /listen →</a>
            <a href="/" style={{ fontFamily: MONO, fontSize: "12px", color: MUTED, textDecoration: "none", textTransform: "uppercase" }}>← Home</a>
          </div>
        </main>
      </div>
    </div>
  )
}
