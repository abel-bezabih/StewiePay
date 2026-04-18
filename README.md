# StewiePay

## Product

StewiePay is a payments platform for **individuals and organizations**: identity verification (KYC), **account funding** (top-ups), **card programs** with configurable limits and controls (merchant rules, time windows), **transaction history**, and operational tooling for review and reconciliation. The mobile app is the primary end-user surface; the API enforces policy, state, and integration contracts with payment, card, and identity providers.

## How it’s made

| Layer | Stack |
|-------|--------|
| API | NestJS, Prisma, PostgreSQL |
| Mobile | Expo, React Native |
| Admin | Next.js |
| Auth | JWT + refresh tokens |
| Integrations | Adapter-style modules for PSP, card issuer, and KYC providers (configurable per environment) |

The repository is a **Yarn workspaces monorepo** (`apps/backend`, `apps/mobile`, `apps/admin`). Schema and migrations live under `apps/backend/prisma`. Shared tooling and TypeScript bases live under `packages/` where present.

## Prerequisites

- Node.js 20+
- Yarn 1.x (Classic)
- PostgreSQL

## Setup

```bash
yarn install
cp apps/backend/env.example apps/backend/.env
```

Configure `apps/backend/.env` and `apps/mobile/.env` locally. Do not commit environment files or secrets.

## Database

```bash
cd apps/backend
npx prisma migrate deploy
npx prisma generate
```

## Run

```bash
yarn workspace @stewiepay/backend start:dev
yarn workspace @stewiepay/admin dev
yarn workspace @stewiepay/mobile start
```

## Layout

| Path | Description |
|------|-------------|
| `apps/backend` | API & integrations |
| `apps/mobile` | Expo / React Native |
| `apps/admin` | Next.js admin |

## Scripts

Package-level scripts are defined in each `apps/*/package.json`. Release checks: `yarn certify:release` (repository root).
