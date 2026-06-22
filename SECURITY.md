# Security Policy

## Reporting a vulnerability

If you find a security issue, please email **splashmediahub@gmail.com** with the
details and steps to reproduce. Do not open a public issue for security reports.
We aim to acknowledge within 72 hours and will keep you updated on the fix.

## Supported versions

The `main` branch receives security updates. Tagged releases are supported until
the next minor release.

## Scope and current posture

Obol settles value on-chain, so we treat payments carefully. A few things worth
knowing about the current state:

- **Network.** Settlement runs on Arc Testnet (Circle's L1). No mainnet funds are
  at risk in this configuration.
- **Spend protection.** The public play and agent endpoints are rate-limited per
  client and bounded by a daily spend cap, so an anonymous caller cannot drain the
  funding wallet. The in-memory limiter is per-instance; a durable limiter
  (e.g. Upstash) is on the roadmap for multi-instance deployments.
- **Secrets.** All credentials live in environment variables. Nothing sensitive is
  committed; see `.env.example` for the required variables.
- **Known limitation.** Music-server credentials are currently stored unencrypted
  at rest. Encrypting them is a tracked roadmap item.

## Dependencies

Dependabot watches npm and GitHub Actions dependencies and opens update PRs
weekly. CodeQL runs static analysis on every push and pull request.
