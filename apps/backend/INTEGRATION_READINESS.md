# StewiePay Integration Readiness

StewiePay is a card orchestration platform. It does not hold balances and does not perform FX conversion.

## Runtime readiness checks

Backend validates integration configuration at startup through `IntegrationReadinessService`.

- `STRICT_INTEGRATION_CONFIG=true` makes invalid integration configuration fail startup.
- In production, strict mode defaults to enabled.
- Health endpoint:
  - `GET /api/health/integrations`
  - returns providers selected and any blocking issues.

## Provider modes

### Issuer (`ISSUER_PROVIDER`)

- `dummy`: local testing only, not allowed in strict production.
- `http`: requires:
  - `ISSUER_BASE_URL`
  - `ISSUER_API_KEY`
  - `ISSUER_WEBHOOK_SECRET`

### PSP (`PSP_PROVIDER`)

- `dummy`: local testing only, not allowed in strict production.
- `http`: requires:
  - `PSP_BASE_URL`
  - `PSP_API_KEY`
  - `PSP_WEBHOOK_SECRET`
- `chapa`: requires:
  - `PSP_API_KEY`
  - `CHAPA_CALLBACK_URL`
  - `CHAPA_WEBHOOK_SECRET`

## Card orchestration contract

### Issuer adapter (`IssuerAdapter`)

- `issueCard({ ownerReference, type, limits, currency })`
- `freezeCard(issuerCardId)`
- `unfreezeCard(issuerCardId)`

Issuer is responsible for card issuance and any funding-side settlement mechanics.

## Funding orchestration contract

### PSP adapter (`PspAdapter`)

- `initiateTopUp({ amount, currency, reference, user/org metadata })`
- `verifyTopUp(providerReference)`

StewiePay records funding events (`TopUp`) and status transitions. It does not keep a wallet ledger.

## Webhook reliability model

- Webhook ingestion endpoint returns `202 Accepted` and queues jobs.
- Durable queue table: `WebhookJob`.
- Background worker retries failed jobs with exponential backoff.
- Admin recovery endpoints:
  - `GET /api/webhooks/jobs`
  - `POST /api/webhooks/jobs/:jobId/retry`
  - `POST /api/webhooks/jobs/retry-failed?limit=100`

## Staging sign-off checklist

1. `ISSUER_PROVIDER` and `PSP_PROVIDER` are set to real providers (not `dummy`).
2. `STRICT_INTEGRATION_CONFIG=true`.
3. `GET /api/health/integrations` returns `ready: true`.
4. Webhook secrets configured and verified.
5. End-to-end run passes:
   - signup/login
   - KYC submit/review
   - card create/freeze/unfreeze
   - topup initiate/verify
   - webhook ingestion + queue processing + retries
