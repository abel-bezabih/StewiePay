# StewiePay Release Day Runbook

Use this runbook for staging sign-off and production release.

## 1) Preflight (local machine)

From repo root:

```bash
yarn install
yarn certify:release
```

Release must not proceed unless `yarn certify:release` is fully green.

## 2) Environment checklist (staging + production)

Backend (`apps/backend/.env` or deployment secrets):

- `NODE_ENV="production"`
- `STRICT_INTEGRATION_CONFIG="true"`
- `JWT_SECRET` is strong (32+ chars, non-placeholder)
- `BACKEND_PUBLIC_URL` points to real public backend URL
- `CORS_ORIGIN_ALLOWLIST` contains only real app/admin origins
- `ISSUER_PROVIDER` is real provider for that environment (`http` when external issuer is active)
- `PSP_PROVIDER` is real provider (`chapa` or `http` as configured)
- `ISSUER_WEBHOOK_SECRET`, `PSP_WEBHOOK_SECRET`/`CHAPA_WEBHOOK_SECRET` are real strong secrets

Mobile (`apps/mobile/.env` for builds):

- `EXPO_PUBLIC_API_BASE` points to staging/prod backend `/api`
- `EXPO_PUBLIC_SENTRY_DSN` and env values are correct for target environment

## 3) Staging certification

Start backend in staging config, then run:

```bash
curl -sS "$BACKEND_PUBLIC_URL/api/health"
curl -sS "$BACKEND_PUBLIC_URL/api/health/integrations"
```

Expected:

- `/health` returns `status: ok`
- `/health/integrations` returns `ready: true`

Then run full flow test in staging app:

1. signup
2. email verify
3. KYC submit/verify path
4. create card
5. top-up initiate
6. reconciliation view
7. freeze/unfreeze
8. subscription create/update/delete

## 4) Production release sequence

1. Deploy backend with production secrets.
2. Verify:
   - `GET /api/health`
   - `GET /api/health/integrations` (`ready: true`)
3. Deploy mobile build pointing to production API base.
4. Execute smoke on live environment with one controlled account:
   - login
   - card create
   - top-up initiate
   - webhook job list (admin)
5. Confirm monitoring:
   - backend Sentry events flowing
   - mobile Sentry events flowing

## 5) Rollback rules

Rollback immediately if any of these occurs:

- `/api/health/integrations` is not ready in production
- payment/top-up initiation fails for multiple attempts
- webhook queue growth without processing
- authentication or KYC path is broken

Rollback action:

1. restore last known good backend release
2. restore last known good mobile build/channel
3. re-run root `yarn certify:release` locally before retrying deploy

