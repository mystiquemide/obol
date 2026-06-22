# Contributing to Obol

Thanks for taking the time to contribute. Obol is building direct, per-listen payments between listeners and artists, and we welcome help from people who care about fairer music economics, payments infrastructure, or just clean TypeScript.

## Good first contributions

Look for issues labeled `good first issue`. Docs improvements, accessibility fixes, test coverage, and small UX polish are all genuinely useful and a great way to get familiar with the codebase.

## Local setup

You only need what's in the [README quickstart](./README.md#quick-start):

```bash
npm install
cp .env.example .env     # fill in the values
npx prisma db push
npm run dev
```

You'll need a free Postgres database (Neon), a free Groq API key, and Circle sandbox credentials. The agent falls back to sample tracks if you don't run a music server, so you can develop without one.

## Before you open a PR

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

All four should pass. CI runs the same checks on every pull request.

## Branches and commits

- Branch names: `feature/<short-name>`, `bugfix/<short-name>`, `chore/<short-name>`.
- Keep commits small and focused. Write messages a teammate can understand at a glance.
- Open the PR against `main`, describe what changed and why, and link the issue it closes (`Closes #123`).

## Code style

- TypeScript, no `any` where it can be avoided.
- Prettier and ESLint configs are in the repo; run `npm run format` before committing.
- Match the surrounding code's naming and structure rather than introducing a new pattern.

## Code of conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

Questions? Open a discussion or reach the maintainer at splashmediahub@gmail.com.
