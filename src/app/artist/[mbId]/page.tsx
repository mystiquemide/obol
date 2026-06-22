// Public, shareable artist receipt — verifiable on-chain proof of every payment.
import { db } from "@/lib/db"
import { txUrl, shortHash, addressUrl } from "@/lib/explorer"
import type { Metadata } from "next"

const MONO = "var(--font-ibm-plex-mono), monospace"
const ALPINA = "var(--font-alpina)"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mbId: string }>
}): Promise<Metadata> {
  const { mbId } = await params
  const artist = await db.artist.findUnique({ where: { musicBrainzId: mbId } })
  if (!artist) return { title: "Artist not found — Obol" }
  return {
    title: `${artist.name} earned $${artist.totalEarned.toFixed(4)} on Obol`,
    description: `${artist.name} has been paid ${artist.totalEarned.toFixed(4)} USDC by listeners, settled on-chain on Arc.`,
  }
}

export default async function ArtistReceipt({
  params,
}: {
  params: Promise<{ mbId: string }>
}) {
  const { mbId } = await params

  const artist = await db.artist.findUnique({ where: { musicBrainzId: mbId } })

  if (!artist) {
    return (
      <div style={{ background: "#0F0F0F", minHeight: "100vh", padding: "160px 120px" }}>
        <p style={{ fontFamily: MONO, fontSize: "14px", color: "#6B665E" }}>
          No Obol record for this artist yet.
        </p>
        <a href="/artists" style={{ fontFamily: MONO, fontSize: "12px", color: "#10B981", textDecoration: "none" }}>
          Claim your music →
        </a>
      </div>
    )
  }

  const payments = await db.payment.findMany({
    where: { artistId: artist.id, settled: true },
    orderBy: { settledAt: "desc" },
    take: 50,
  })
  const onChain = payments.filter((p) => p.txHash)
  const plays = payments.length
  const claimed = artist.circleWalletId !== null

  return (
    <div className="mobile-page" style={{ background: "#0F0F0F", minHeight: "100vh" }}>
      {/* Header */}
      <section style={{ paddingTop: "160px", paddingBottom: "60px", paddingLeft: "120px", paddingRight: "120px" }}>
        <span style={{ fontFamily: MONO, fontSize: "11px", color: "#6B665E", textTransform: "uppercase", letterSpacing: "-0.22px" }}>
          Obol receipt
        </span>
        <h1 style={{ fontFamily: ALPINA, fontWeight: 400, fontSize: "44px", color: "#E1DDD6", lineHeight: "48px", letterSpacing: "-0.5px", margin: "16px 0 0" }}>
          {artist.name}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "16px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: claimed ? "#10B981" : "#6B665E", display: "inline-block" }} />
          <span style={{ fontFamily: MONO, fontSize: "11px", color: "#6B665E" }}>
            {claimed ? "Claimed — paid out to wallet" : "Unclaimed — earnings held in escrow"}
          </span>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: "#E1DDD6", padding: "80px 120px" }}>
        <div className="stack-mobile" style={{ display: "flex", alignItems: "center", gap: "48px" }}>
          <Metric value={`$${artist.totalEarned.toFixed(4)}`} label="Total earned (USDC)" />
          <div className="stack-mobile-divider" style={{ width: "1px", height: "40px", background: "rgba(15,15,15,0.1)" }} />
          <Metric value={String(plays)} label="Plays paid" />
          <div className="stack-mobile-divider" style={{ width: "1px", height: "40px", background: "rgba(15,15,15,0.1)" }} />
          <Metric value={String(onChain.length)} label="On-chain settlements" />
        </div>
        {claimed && artist.circleWalletId && (
          <a
            href={addressUrl(artist.circleWalletId)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: MONO, fontSize: "11px", color: "#0F0F0F", textDecoration: "none", borderBottom: "1px solid rgba(15,15,15,0.3)", display: "inline-block", marginTop: "32px" }}
          >
            Wallet {shortHash(artist.circleWalletId)} ↗
          </a>
        )}
      </section>

      {/* Payment ledger */}
      <section style={{ padding: "80px 120px 160px" }}>
        <span style={{ fontFamily: MONO, fontSize: "11px", color: "#6B665E", textTransform: "uppercase", letterSpacing: "-0.22px" }}>
          On-chain ledger
        </span>
        <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {payments.length === 0 && (
            <span style={{ fontFamily: MONO, fontSize: "14px", color: "#6B665E" }}>No settled payments yet.</span>
          )}
          {payments.slice(0, 25).map((p) => (
            <div key={p.id} className="stack-mobile" style={{ display: "flex", alignItems: "baseline", gap: "40px" }}>
              <span style={{ fontFamily: MONO, fontSize: "14px", color: "#E1DDD6", minWidth: "220px" }}>{p.trackTitle}</span>
              <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: "14px", color: "#10B981", minWidth: "90px" }}>${p.amountUsdc.toFixed(4)}</span>
              {p.txHash ? (
                <a href={txUrl(p.txHash)} target="_blank" rel="noopener noreferrer" style={{ fontFamily: MONO, fontSize: "11px", color: "#10B981", textDecoration: "none", borderBottom: "1px solid rgba(16,185,129,0.4)" }}>
                  {shortHash(p.txHash)} ↗
                </a>
              ) : (
                <span style={{ fontFamily: MONO, fontSize: "11px", color: "#6B665E" }}>escrow</span>
              )}
            </div>
          ))}
        </div>

        {!claimed && (
          <a href="/artists" style={{ fontFamily: MONO, fontSize: "12px", color: "#10B981", textDecoration: "none", display: "inline-block", marginTop: "48px", borderBottom: "1px solid rgba(16,185,129,0.4)" }}>
            Is this you? Claim your earnings →
          </a>
        )}
      </section>
    </div>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p style={{ fontFamily: MONO, fontWeight: 500, fontSize: "28px", color: "#0F0F0F", letterSpacing: "-0.56px", margin: 0, lineHeight: 1 }}>{value}</p>
      <p style={{ fontFamily: MONO, fontSize: "11px", color: "#6B665E", textTransform: "uppercase", margin: "6px 0 0" }}>{label}</p>
    </div>
  )
}
