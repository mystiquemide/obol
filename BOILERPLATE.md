# Boilerplate: AI SaaS

Pre-built hackathon starter. Clone, strip what you don't need, build your idea.

## What's Inside

| Layer | Stack | Notes |
|-------|-------|-------|
| Framework | Next.js 15 + TypeScript | App Router, src/ directory |
| Styling | Tailwind CSS v4 | Dark theme default |
| Auth | NextAuth v5 (beta) | GitHub + Google providers, JWT sessions, Prisma adapter |
| Database | Prisma + SQLite | Swap to Postgres by changing one line in schema.prisma |
| AI | OpenAI SDK + Anthropic SDK | Pre-wired API routes at `/api/ai/openai` and `/api/ai/anthropic` |
| UI | 5 components | Button, Card, Modal, Toast, Skeleton |
| Landing | 3 sections | Hero, Features, CTA |
| Deploy | Vercel + Railway | Configs for both |

## What to Strip

Delete these if not needed:

```
□ Auth not needed → delete:
   - src/lib/auth.ts
   - src/middleware.ts
   - src/app/api/auth/
   - Remove next-auth from package.json

□ Database not needed → delete:
   - prisma/
   - src/lib/db.ts
   - Remove prisma, @prisma/client from package.json

□ AI not needed → delete:
   - src/lib/ai.ts
   - src/app/api/ai/
   - Remove openai, @anthropic-ai/sdk from package.json

□ Vercel not needed → delete vercel.json
□ Railway not needed → delete railway.toml
```

## What to Customize

```
□ App name → update title in src/app/layout.tsx
□ Brand colors → update tailwind config or use CSS variables
□ Logo → replace favicon.ico in public/
□ Landing copy → edit src/components/landing/*.tsx
□ Landing page → rebuild using sr71-method (The Landing Page) skill
□ Dashboard → rebuild with your actual data and UI
```

## Demo Mode

Set `NEXT_PUBLIC_DEMO_MODE=true` in `.env` to enable pre-seeded demo data. Judges can click through a realistic-looking product without any real backend.

Demo data lives in `src/lib/demo-data.ts`. Customize it for your project.

## Setup After Clone

```bash
npm install
cp .env.example .env
# Fill in required env vars
npx prisma generate
npx prisma db push
npm run dev
```

## Deploy

**Vercel:** Push to GitHub, import in Vercel, set env vars, done.
**Railway:** Push to GitHub, import in Railway, set env vars, done.
