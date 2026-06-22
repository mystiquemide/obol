# Obol — Product Requirements Document

**Version:** 1.0
**Date:** 2026-06-21
**Status:** Active — Hackathon MVP

---

## 1. Overview

### What It Is

Obol is an autonomous per-listen royalty payment agent for self-hosted Navidrome music servers. It reads your listening history (scrobbles) via the Navidrome Subsonic API, resolves each track's artist through MusicBrainz, and sends USDC nanopayments directly to artist wallets on the Arc (ARC-SEPOLIA) testnet — with zero user intervention after setup.

### The Problem

Self-hosted music listeners own their libraries. They pay artists nothing after the purchase. Streaming services extract 70% before artists see a cent, pay fractions of a cent per stream, and lock listeners into subscriptions. There is no lightweight, direct payment layer for the 20-year-old self-hosted music ecosystem (Navidrome, Subsonic, Jellyfin).

### Why It Matters

- 20+ years of Subsonic-compatible self-hosted players with no built-in payment layer
- Navidrome has ~40,000 active self-hosted installs (growing)
- Artists receive $0 from listeners who already own their music
- Circle's Developer Controlled Wallets + Arc Network enable sub-cent programmable payments at near-zero gas cost
- MusicBrainz covers 2M+ artists with verified identity data — no centralized artist registry needed

### Hackathon Context

Built for the Circle/Arc hackathon. Primary tracks: Circle Developer Controlled Wallets, Arc Network (ARC-SEPOLIA testnet). Demo-able end-to-end: listener connects Navidrome, agent runs, USDC flows to artist wallet, artist claims escrow.

---

## 2. User Roles

### Role A: Listener

A person who runs a self-hosted Navidrome music server and wants to passively support artists they listen to.

**Needs:**
- Connect their Navidrome instance in under 2 minutes
- Set a per-listen rate (default $0.001 USDC)
- Never think about payments again — agent runs on a schedule
- See a transparent log of what was paid and to whom

**Technical profile:** Comfortable running a local server; not necessarily a developer. May use ngrok to expose Navidrome publicly.

### Role B: Artist

A musician whose work is indexed in MusicBrainz who wants to claim accumulated royalties.

**Needs:**
- Discover that fans have been paying them
- Claim earnings with minimal friction (no Circle account required before claim)
- Receive USDC directly to a wallet they control

**Technical profile:** Non-technical. Should not need to understand blockchain to claim.

### Role C: Hackathon Judge

A Circle/Arc evaluator assessing technical depth, real-world utility, and demo quality.

**Needs:**
- See real on-chain transactions on ARC-SEPOLIA
- Understand the architecture quickly
- See a live agent run during the demo

---

## 3. Core Features

Prioritized for MVP.

| # | Feature | Priority |
|---|---------|----------|
| 1 | Navidrome connection + listener setup | P0 |
| 2 | Autonomous agent: scrobble fetch → artist resolve → payment queue | P0 |
| 3 | Circle Developer Controlled Wallet provisioning per listener | P0 |
| 4 | MusicBrainz artist resolution with escrow for unclaimed artists | P0 |
| 5 | USDC on-chain transfer to artist wallet on Arc testnet | P0 |
| 6 | Artist claim flow (/artists page) | P1 |
| 7 | Agent run log (dashboard + landing page) | P1 |
| 8 | Cron-based auto-run (every 5 minutes) | P1 |
| 9 | Per-listen rate configuration | P2 |
| 10 | Live payment feed on landing page | P2 |

---

## 4. User Stories

### Listener Stories

**L1 — Connect Navidrome**
As a listener, I want to enter my Navidrome URL, username, and password so that Obol can read my scrobble history.

**L2 — Set Rate**
As a listener, I want to set how much USDC I pay per listen so that I control my total spending.

**L3 — Run Agent Manually**
As a listener, I want to trigger the agent manually from the dashboard so that I can see it work immediately during setup without waiting for the cron.

**L4 — View Payment Log**
As a listener, I want to see a log of every run — tracks fetched, artists resolved, USDC paid — so that I have full transparency over where my money goes.

**L5 — See Connection Status**
As a listener, I want to see whether my Navidrome instance is connected and when the last run completed so that I know the agent is active.

### Artist Stories

**A1 — Search for My Name**
As an artist, I want to search for my name on the /artists page so that I can find out if fans have been paying me.

**A2 — See Accumulated Balance**
As an artist, I want to see how much USDC is held in escrow for me before I claim so that I can decide whether it is worth setting up a wallet.

**A3 — Claim Earnings**
As an artist, I want to submit a Circle wallet address to claim my accumulated USDC so that I receive the money fans have paid me.

**A4 — Wallet Address Verified**
As an artist, I want the system to validate my wallet address before submission so that I do not lose funds to a typo.

### Agent Stories

**AG1 — Fetch Now Playing**
As the agent, I want to call Navidrome's getNowPlaying endpoint so that I can capture real-time listening activity.

**AG2 — Fall Back to Random Tracks**
As the agent, I want to fall back to getRandomSongs for demo mode so that the system demonstrates value even when nothing is actively playing.

**AG3 — Resolve Artist via MusicBrainz**
As the agent, I want to look up each track's artist in MusicBrainz so that I attach verified artist identity to each payment.

**AG4 — Queue Payment**
As the agent, I want to create a Payment record for each resolved track so that there is a persistent audit trail.

**AG5 — Settle On-Chain**
As the agent, I want to transfer USDC from the listener's Circle wallet to each artist's Circle wallet so that artists receive real on-chain payments.

**AG6 — Log Every Action**
As the agent, I want to write a structured run log with timestamps so that listeners and judges can verify every decision.

---

## 5. Acceptance Criteria

### Feature 1: Navidrome Connection

- [ ] Listener can enter URL, username, password and save
- [ ] System validates the Navidrome endpoint returns HTTP 200 before saving
- [ ] On success, dashboard shows "Connected" state with connection timestamp
- [ ] On failure, dashboard shows a clear error (wrong URL, auth failed) — not a generic crash
- [ ] Credentials are stored encrypted (not plaintext in DB)

### Feature 2: Autonomous Agent Loop

- [ ] Agent fetches getNowPlaying; if empty, falls back to getRandomSongs (max 5 tracks)
- [ ] Each track results in exactly one Payment record (no duplicates within a run)
- [ ] Agent creates an AgentRun record on every execution (success or error)
- [ ] Agent completes a full run in under 30 seconds for 5 tracks
- [ ] Agent run is idempotent — re-running does not double-count scrobbles within the same time window

### Feature 3: Circle Wallet Provisioning

- [ ] A Circle Developer Controlled Wallet is provisioned for each new listener on first run
- [ ] Wallet ID is persisted to the Listener record
- [ ] If wallet creation fails, the agent logs the error and continues (payments queue, settle later)
- [ ] Balance is checked before every on-chain transfer — insufficient balance logs a warning, does not crash

### Feature 4: MusicBrainz Resolution

- [ ] Agent calls MusicBrainz API with artist name and/or MBID from Navidrome
- [ ] If MB lookup returns a match, MBID is stored on the Artist record
- [ ] If MB lookup fails or returns no match, a local ID is generated (`local-{name}`) — payment still queues
- [ ] MB API rate limit (1 req/sec) is respected — no 429 errors during normal runs

### Feature 5: On-Chain USDC Transfer

- [ ] Transfer only executes if listener wallet balance >= payment amount
- [ ] Transfer only executes if artist has a claimed circleWalletId
- [ ] Payment.settled = true and Payment.settledAt = now() after successful transfer
- [ ] Payment.circlePayId is stored for every completed on-chain transfer
- [ ] Failed transfers log the error; payment remains settled = false and retries next run

### Feature 6: Artist Claim Flow

- [ ] Artist can search by name on /artists and see their accumulated balance
- [ ] Artist can submit a wallet address
- [ ] System validates address format before accepting
- [ ] On successful claim, artist.circleWalletId is set and future payments settle on-chain
- [ ] Artist cannot claim for another artist's record

### Feature 7: Agent Log Display

- [ ] Dashboard shows the log from the most recent agent run
- [ ] Landing page Agent Log section shows the last run's summary (tracks, payments, total USDC)
- [ ] Log entries show relative timestamps ("2m ago")
- [ ] "No runs yet" state is shown when no AgentRun exists

### Feature 8: Cron Auto-Run

- [ ] /api/cron route is authenticated via CRON_SECRET header
- [ ] Cron runs the same agent logic as manual trigger
- [ ] Vercel cron is configured to run every 5 minutes (vercel.json)

---

## 6. RICE Backlog

| Feature | Reach | Impact | Confidence | Effort | Score | Priority |
|---------|-------|--------|------------|--------|-------|----------|
| Navidrome connection | 10 | 3 | 0.9 | 1 | **27** | P0 |
| Agent loop (scrobble → payment) | 10 | 3 | 0.9 | 2 | **13.5** | P0 |
| Circle wallet provisioning | 10 | 3 | 0.8 | 2 | **12** | P0 |
| USDC on-chain transfer | 10 | 3 | 0.8 | 2 | **12** | P0 |
| MusicBrainz resolution | 10 | 2 | 0.9 | 1 | **18** | P0 |
| Artist claim flow | 6 | 3 | 0.7 | 2 | **6.3** | P1 |
| Agent run log (dashboard) | 8 | 2 | 0.9 | 1 | **14.4** | P1 |
| Cron auto-run | 7 | 2 | 0.9 | 1 | **12.6** | P1 |
| Landing page live feed | 5 | 2 | 0.8 | 1 | **8** | P2 |
| Per-listen rate config | 5 | 1 | 0.9 | 1 | **4.5** | P2 |
| Artist escrow balance display | 4 | 2 | 0.7 | 1 | **5.6** | P2 |
| Postgres migration (Vercel) | 3 | 3 | 0.9 | 1 | **8.1** | P1 (deploy blocker) |

---

## 7. KPIs

### Primary (Hackathon)

| Metric | Target | How Measured |
|--------|--------|--------------|
| End-to-end agent run completes | 100% during demo | Manual run on demo day |
| On-chain USDC transactions visible | >= 1 real tx on ARC-SEPOLIA | Block explorer / Circle dashboard |
| Agent run time | < 30s for 5 tracks | AgentRun.finishedAt - startedAt |
| Artist resolve rate | >= 80% of tracks resolve to a known MBID | resolvedCount / scrobbleCount |

### Secondary (Post-Hackathon Traction)

| Metric | Target | How Measured |
|--------|--------|--------------|
| Navidrome instances connected | 100 in first month | Listener table count |
| USDC paid out | $50 cumulative in month 1 | Payment.amountUsdc SUM |
| Artist claim rate | >= 10% of artists with escrow claim within 30 days | Artist.circleWalletId set / total artists |
| Agent runs per day (active users) | >= 3 runs/day average | AgentRun count / active listeners |

---

## 8. Out of Scope (MVP)

These are explicitly excluded from the current build. Not forever — just not now.

- **Other music servers.** Only Navidrome/Subsonic. Jellyfin, Plex, and Last.fm import come later.
- **Mainnet payments.** ARC-SEPOLIA testnet only. Real money moves after security audit.
- **Listener authentication.** No login system. Single-listener mode only. Multi-user accounts are post-MVP.
- **Mobile app.** Web only.
- **Artist identity verification.** MusicBrainz ID is sufficient for MVP. No KYC.
- **Withdrawal UI for artists.** Artists get the wallet address; they manage their own Circle account from there.
- **Custom payment splits.** One artist per track. No splits for features, producers, or labels.
- **Historical scrobble import.** Agent only processes from the point of connection forward.
- **Refunds or disputes.** No chargeback mechanism. Payments are final.
- **Gas abstraction for artists.** Artists interact directly with Circle; we do not abstract wallet UX beyond the claim flow.

---

## 9. Go-to-Market

### Hackathon Submission (June 2026)

- Submit via Google Form: forms.gle/SMqLaw2pMGDe58LFA
- Demo video: under 3 minutes, Loom/YouTube/Vimeo
- Show: connect flow, manual agent run, on-chain tx confirmation, artist claim

### Post-Hackathon Distribution

**Channel 1 — Navidrome community**
Post in Navidrome GitHub Discussions and the self-hosted Reddit community (r/selfhosted, r/navidrome). Position as "pay the artists whose music you already own."

**Channel 2 — MusicBrainz community**
MusicBrainz is artist-friendly. A post in their community forums reaches artists who already care about music metadata and attribution.

**Channel 3 — Circle developer ecosystem**
Circle's own developer newsletter and Discord. Positioned as a showcase of Developer Controlled Wallets for a real consumer use case.

**Channel 4 — Indie artist Twitter/X**
Artists who self-release and care about direct fan relationships. Angle: "Your fans who run their own music servers have been paying you. Claim it."

### Pricing Model (Post-MVP)

- Obol takes 0% in MVP — purely a public good / hackathon demo
- Post-MVP: 2-3% protocol fee on settled payments, covering infra costs
- Rate is configurable by listener; Obol earns only when value flows

---

## Assumptions

1. Navidrome's Subsonic API is accessible via a public URL (ngrok or VPS) — this is a documented limitation and a setup requirement.
2. MusicBrainz artist data is sufficient for basic identity resolution without additional verification.
3. ARC-SEPOLIA testnet USDC faucet is available for funding listener wallets during demo.
4. Circle's Developer Controlled Wallet API remains stable on ARC-SEPOLIA for the hackathon period.
5. $0.001 USDC per listen is a reasonable default that listeners will accept and that covers future gas costs with margin.
