# StewiePay Monorepo

TypeScript monorepo for StewiePay, containing:

- `apps/backend` — NestJS API and orchestration layer.
- `apps/admin` — Next.js admin panel.
- `apps/mobile` — Expo/React Native mobile app.
- `packages/config/*` — shared lint/format configs.
- `packages/tsconfig` — shared TypeScript base config.

## Getting started

1) Install Yarn 1 (Classic) if not already available.
2) From the repo root run `yarn install` to pull all workspace deps.
3) Run a workspace script, for example:
   - `yarn workspace @stewiepay/backend start:dev`
   - `yarn workspace @stewiepay/admin dev`
   - `yarn workspace @stewiepay/mobile start`

Note: Dependency installs were not executed in this environment (offline). Running the commands
above after installing dependencies will bring up placeholder screens/endpoints for Phase 1.

## V1 environment setup

- Mobile API base: set `EXPO_PUBLIC_API_BASE` to your backend URL (example: `http://<LAN_IP>:3000/api`).
- Cloudinary: configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `apps/backend/.env`.
- Backend env template lives at `apps/backend/env.example`.
- Sentry (optional): `SENTRY_DSN` for backend and `EXPO_PUBLIC_SENTRY_DSN` for mobile.
- Integration readiness guide: `apps/backend/INTEGRATION_READINESS.md`.
- Release day runbook: `RELEASE_DAY_RUNBOOK.md`.

## Certification commands

From repo root:

- Full release gate: `yarn certify:release`

Workspace-level commands:

- Backend smoke flow: `yarn workspace @stewiepay/backend certify:smoke`
- Backend typecheck: `yarn workspace @stewiepay/backend certify:typecheck`
- Mobile typecheck: `yarn workspace @stewiepay/mobile certify:typecheck`
- Mobile export bundle check: `yarn workspace @stewiepay/mobile certify:export`

## Prisma migrations

- Apply schema changes before running the backend:
  - `cd apps/backend`
  - `npx prisma migrate dev`
  - `npx prisma generate`





















