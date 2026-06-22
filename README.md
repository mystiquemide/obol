# Obol

**An autonomous per-listen royalty agent for music, settled in USDC on Arc.**

Streaming pays artists fractions of a cent and locks listeners into subscriptions. Self-hosted music listeners own their libraries and pay artists nothing after the purchase. Obol fixes that: it pays artists a few hundredths of a cent per listen, automatically, on-chain, with no subscription and no clicks.

Built for the Lepton Agents Hackathon (Canteen · Circle · Arc).

---

## Two ways it works

**1. The agent (for self-hosted libraries).** Connect a Navidrome/Subsonic server. The agent watches what you play, resolves each track's artist via MusicBrainz (using an LLM to disambiguate when MusicBrainz is ambiguous), and settles a USDC nanopayment to the artist on Arc. Unclaimed artists accrue earnings in escrow against their MusicBrainz ID until they claim a wallet.

**2. x402 pay-per-play (for everyone).** Go to `/listen` and press play. The request hits an HTTP `402 Payment Required`, Obol auto-pays the artist in USDC on Arc, and the track unlocks, in about a second. No server, no subscription, no wallet popup. This removes the self-hosting barrier entirely.

Every payment, both paths, resolves to a real on-chain transaction with a clickable link to the Arc explorer.

---

## The demo

1. `/listen` — press play on a track. Watch the x402 handshake live: `GET → 402 → pay on Arc → settle (real tx) → unlock → music plays`.
2. Click the tx hash to see the payment confirmed on `testnet.arcscan.app`.
3. `/artists` — search your name, see USDC waiting in escrow, claim a wallet, or list your own tracks (they go live on `/listen` and pay you on-chain).
4. `/dashboard` — run the agent, watch it stream its reasoning, see lifetime stats, a daily spend cap, and the agent's artist-resolution decisions.
5. `/artist/[mbId]` — a public, shareable receipt: an artist's total earned and full on-chain ledger.

---

## Tech

- **Next.js 16** (App Router), TypeScript
- **Prisma 5 + Neon Postgres**
- **Circle Developer Controlled Wallets** + **Arc Testnet** (USDC settlement)
- **Groq** (Llama 3.3 70B) for agent artist disambiguation; pluggable to Anthropic
- **MusicBrainz** for artist identity, **Navidrome/Subsonic** for listening data
- Server-Sent Events for live agent + x402 handshake streaming

## Circle / Arc integration

- Each listener gets a Circle Developer Controlled Wallet; artists are provisioned wallets on claim/onboard.
- USDC transfers settle on `ARC-TESTNET` (Circle's L1, not Arbitrum), using the native USDC `tokenId`.
- On-chain tx hashes are resolved from Circle's `getTransaction` and verified for the x402 gate (recipient + amount + state).
- x402 follows the HTTP flow (`402` + payment requirements, `X-PAYMENT` retry, `X-PAYMENT-RESPONSE`). Our scheme is labeled `arc-onchain`: settled via Circle on Arc and verified by tx hash, not the EIP-3009 facilitator scheme (Circle wallets sign server-side; there's no x402 facilitator on Arc).

---

## Local setup

```bash
npm install
cp .env.example .env         # fill in the values (see below)
npx prisma db push           # sync schema to your Neon database
node scripts/gen-audio.mjs   # generate demo audio clips into public/audio
node scripts/seed-tracks.mjs # seed the x402 catalog (after artists exist)
npm run dev                  # http://localhost:3000
```

You need: a free [Neon](https://neon.tech) Postgres database, a free [Groq](https://console.groq.com) API key, and a [Circle](https://console.circle.com) sandbox API key + entity secret (fund a wallet via [faucet.circle.com](https://faucet.circle.com)). Navidrome is optional, the agent falls back to demo tracks without it.

See `.env.example` for the full list of variables.

---

## Honest notes

- **Testnet only.** All settlement is on Arc Testnet. No mainnet, no real money.
- **Demo audio.** The `/listen` clips are generated demo audio, not the real recordings. Real files can be dropped into `public/audio` per track. The catalog artists (Kevin MacLeod, Scott Holmes, Komiku) are real Creative Commons musicians.
- **x402 scheme.** Faithful to the HTTP flow, settled on Arc via Circle rather than the canonical EIP-3009 facilitator scheme, see above.

## Status

Feature-complete and verified end to end: real on-chain settlement on both paths, idempotent payments, spend caps, rate-limited public endpoints, mobile-responsive, accessible.
