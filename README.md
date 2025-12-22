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













