# Deployment

Obol is a Next.js app that deploys cleanly to Vercel. Postgres is hosted separately
(Neon). You can also run it with Docker.

## Prerequisites

- A Postgres database (a free [Neon](https://neon.tech) project works well)
- A [Groq](https://console.groq.com) API key (free)
- [Circle](https://console.circle.com) sandbox API key + entity secret, with a wallet
  funded from [faucet.circle.com](https://faucet.circle.com)
- Node 20+ if building locally

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Pooled Postgres connection (Neon `-pooler` host) |
| `DIRECT_URL` | yes | Non-pooled connection, used for migrations |
| `GROQ_API_KEY` | yes | Agent artist disambiguation |
| `CIRCLE_API_KEY` | yes | Circle Developer Controlled Wallets |
| `CIRCLE_ENTITY_SECRET` | yes | Circle entity secret |
| `GROQ_MODEL` | no | Defaults to `llama-3.3-70b-versatile` |
| `NAVIDROME_URL` / `NAVIDROME_USER` / `NAVIDROME_PASS` | no | Optional; agent uses sample tracks without it |
| `CRON_SECRET` | no | Protects the scheduled run endpoint |

See `.env.example` for the full template.

## Local production build

```bash
npm install
cp .env.example .env        # fill in values
npx prisma db push          # sync schema to your database
npm run build
npm start                   # http://localhost:3000
```

## Vercel

1. Push the repository to GitHub.
2. In Vercel, **Import Project** and select the repo. Framework auto-detects as Next.js.
3. Add the environment variables above in **Project Settings → Environment Variables**.
4. Deploy. The build command (`prisma generate && next build`) is set in `vercel.json`.

Every push to `main` then deploys automatically.

> Note: the scheduled run in `vercel.json` is configured for every few minutes. On
> Vercel's Hobby tier, cron runs once per day. Use the dashboard's Auto-run toggle for
> frequent runs, or upgrade for sub-daily cron.

## Docker

```bash
docker build -t obol .
docker run -p 3000:3000 --env-file .env obol
# or
docker compose up --build
```

The image uses Next.js standalone output. Postgres is external (point `DATABASE_URL`
at your database).

## Post-deploy verification

```bash
curl https://<your-domain>/api/health           # { status: "ok", db: "up" }
curl https://<your-domain>/api/x402/catalog      # catalog JSON
curl https://<your-domain>/api/agent/status      # lifetime stats
```

Then open `/listen`, press play, and confirm the payment settles and the tx hash links
to the Arc explorer.

## Troubleshooting

- **First request is slow or errors once.** Serverless Postgres (Neon free tier) sleeps
  when idle; the first query wakes it. Database calls retry automatically.
- **Build fails fetching fonts.** `next/font` downloads fonts at build time and needs
  network access; retry the build.
- **Payments don't settle on-chain.** Confirm the funding wallet has testnet USDC and
  the artist has a claimed wallet; unclaimed artists accrue in escrow.
