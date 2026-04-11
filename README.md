# StewiePay

Monorepo (TypeScript): backend API, admin app, mobile app.

| Path | Stack |
|------|--------|
| `apps/backend` | NestJS |
| `apps/admin` | Next.js |
| `apps/mobile` | Expo / React Native |

## Setup

1. Install [Yarn 1](https://classic.yarnpkg.com/) (Classic).
2. From the repo root: `yarn install`
3. Copy `apps/backend/env.example` to `apps/backend/.env` and set values locally — **do not commit `.env`** or paste secrets into issues or PRs.

Run (examples):

```bash
yarn workspace @stewiepay/backend start:dev
yarn workspace @stewiepay/admin dev
yarn workspace @stewiepay/mobile start
```

Mobile: set `EXPO_PUBLIC_API_BASE` to your API URL (see `apps/mobile/.env`).

Database: from `apps/backend`, run `npx prisma migrate deploy` (or `migrate dev` in development) and `npx prisma generate`.

## Scripts

Release checks: `yarn certify:release` (from root). Per-package scripts are in each `package.json`.

## Security & privacy

- Treat this README and the public repo as **non-sensitive**. Do not add internal customer data, private URLs, or credentials here.
- Keep secrets in environment variables and your team’s secret store only.
