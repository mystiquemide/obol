# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-22

### Added

- Autonomous agent that reads listening activity, resolves artists via MusicBrainz
  (with LLM disambiguation), and settles USDC payments per listen on Arc.
- x402 pay-per-play: an HTTP 402 payment gate that settles a USDC nanopayment on
  Arc and unlocks the track, with clickable on-chain proof.
- Artist escrow, wallet claim, self-onboarding, and public on-chain receipt pages.
- Listener dashboard with a live agent log, lifetime stats, per-listen rate, and a
  daily spend cap.
- Database-backed catalog (Prisma + Postgres), idempotent payments, rate-limited
  public endpoints, mobile-responsive and accessible UI.
- Health check endpoint, error boundaries, and a Docker build.
- CI (lint, type-check, test, build), CodeQL analysis, and Dependabot.
- Project docs: README, architecture, deployment, contributing, security, and a
  code of conduct.
