# Architecture

Obol turns a listen into a payment. It does this two ways: an autonomous agent that
watches a listening history and pays per scrobble, and an x402 pay-per-play gate that
charges at the moment a track is played. Both settle USDC on Arc through Circle and
record an on-chain transaction hash.

## System

```mermaid
flowchart LR
  subgraph Client
    L[Listener / Browser]
    A[Artist]
  end

  subgraph App["Next.js app"]
    UI[Pages: listen, dashboard, artists, receipt]
    AR[Agent runner]
    X4[x402 gate + orchestrator]
    DB[(Postgres / Neon)]
  end

  subgraph External
    MB[MusicBrainz]
    GQ[Groq LLM]
    CR[Circle Wallets]
    NV[Navidrome / Subsonic]
  end

  ARC[(Arc Testnet — USDC)]

  L --> UI
  A --> UI
  UI --> AR
  UI --> X4
  AR --> NV
  AR --> MB
  AR --> GQ
  AR --> DB
  X4 --> DB
  AR --> CR
  X4 --> CR
  CR --> ARC
  ARC -. tx hash .-> DB
```

## x402 pay-per-play

The gate (`/api/x402/track/[id]`) is a real HTTP 402 endpoint. The orchestrator
(`/api/x402/play/[id]`) runs the same payment-requirements and verification logic
in-process, so it works behind tunnels and on serverless without a self-fetch.

```mermaid
sequenceDiagram
  participant U as Listener
  participant O as Play orchestrator
  participant C as Circle
  participant N as Arc Testnet
  participant D as Database

  U->>O: POST /api/x402/play/:id
  O-->>U: 402 Payment Required (amount, payTo, asset)
  O->>C: transfer USDC to artist wallet
  C->>N: settle on-chain
  N-->>C: tx hash
  O->>O: verify proof (state, recipient, amount)
  O->>D: record redemption (anti-replay) + payment
  O-->>U: 200 unlocked + tx hash + audio
```

## Agent settle loop

```mermaid
sequenceDiagram
  participant Ag as Agent runner
  participant N as Navidrome
  participant MB as MusicBrainz
  participant G as Groq
  participant C as Circle
  participant D as Database

  Ag->>N: fetch now-playing / recent (or sample tracks)
  loop each track
    Ag->>MB: resolve artist candidates
    alt ambiguous
      Ag->>G: pick the real performer (reasoned)
    end
    Ag->>D: queue payment (idempotent scrobble key)
  end
  Ag->>D: pending payments
  loop each settled artist with a wallet
    Ag->>C: transfer USDC
    C-->>Ag: tx hash
    Ag->>D: mark settled + store hash
  end
```

## Roles and boundaries

- **App layer (Next.js).** Orchestration, payment requirements, on-chain verification,
  catalog, escrow accounting. Holds no private keys.
- **Circle.** Custodies developer-controlled wallets and signs transactions server-side.
- **Arc Testnet.** Final settlement and the source of truth for proof (tx hash).
- **External reads.** MusicBrainz (identity), Groq (disambiguation), Navidrome (listening
  data). None of these move funds.

Unclaimed artists accrue earnings in escrow against their MusicBrainz ID; on-chain
transfer happens once they claim or onboard a wallet.

## Key design decisions

- **In-process x402 verification.** The orchestrator does not HTTP-fetch its own gate;
  it reuses the gate's logic directly. This avoids loopback failures behind tunnels and
  on serverless while keeping the gate a real external 402 endpoint.
- **Idempotent payments.** Each scrobble has a stable key, so re-running the agent never
  double-pays the same play.
- **Spend caps + rate limits.** Public play and run endpoints are throttled per client
  and bounded by a daily spend cap.
- **Cold-start resilience.** Database calls retry through serverless-Postgres cold starts.
- **Pluggable LLM.** Disambiguation runs on Groq by default, with an Anthropic fallback,
  behind a single provider abstraction.
