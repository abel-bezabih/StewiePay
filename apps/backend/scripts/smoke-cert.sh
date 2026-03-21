#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000/api}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@stewiepay.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-AdminPass123!}"
USER_EMAIL="${USER_EMAIL:-user@stewiepay.local}"
USER_PASSWORD="${USER_PASSWORD:-UserPass123!}"

json_get() {
  local key="$1"
  python3 -c "import json,sys; data=json.load(sys.stdin); print(data.get('$key',''))"
}

echo "== StewiePay backend smoke certification =="
echo "BASE_URL=$BASE_URL"

HEALTH="$(curl -sS "$BASE_URL/health")"
echo "health: $HEALTH"

INTEGRATIONS="$(curl -sS "$BASE_URL/health/integrations")"
echo "integrations: $INTEGRATIONS"

ADMIN_LOGIN="$(curl -sS -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")"
USER_LOGIN="$(curl -sS -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}")"
ADMIN_TOKEN="$(printf '%s' "$ADMIN_LOGIN" | json_get token)"
USER_TOKEN="$(printf '%s' "$USER_LOGIN" | json_get token)"

if [[ -z "$ADMIN_TOKEN" || -z "$USER_TOKEN" ]]; then
  echo "ERROR: failed to login admin/user. Run seed and verify credentials." >&2
  echo "admin_login=$ADMIN_LOGIN" >&2
  echo "user_login=$USER_LOGIN" >&2
  exit 1
fi

USER_ME="$(curl -sS "$BASE_URL/auth/me" -H "Authorization: Bearer $USER_TOKEN")"
USER_ID="$(printf '%s' "$USER_ME" | json_get id)"
if [[ -z "$USER_ID" ]]; then
  echo "ERROR: failed to fetch user profile." >&2
  exit 1
fi

KYC_STATUS="$(curl -sS "$BASE_URL/users/kyc/status" -H "Authorization: Bearer $USER_TOKEN")"
KYC_STATE="$(printf '%s' "$KYC_STATUS" | json_get kycStatus)"
if [[ "$KYC_STATE" != "VERIFIED" ]]; then
  curl -sS -X PATCH "$BASE_URL/users/kyc/$USER_ID/status" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"VERIFIED","reviewNote":"smoke-cert-script"}' >/dev/null
fi
echo "kyc_status: $(curl -sS "$BASE_URL/users/kyc/status" -H "Authorization: Bearer $USER_TOKEN")"

CARD_CREATE="$(curl -sS -X POST "$BASE_URL/cards" -H "Authorization: Bearer $USER_TOKEN" -H "Content-Type: application/json" -d '{"type":"BURNER","currency":"ETB"}')"
CARD_ID="$(printf '%s' "$CARD_CREATE" | json_get id)"
if [[ -z "$CARD_ID" ]]; then
  echo "ERROR: card creation failed." >&2
  echo "card_create=$CARD_CREATE" >&2
  exit 1
fi
echo "card_create: $CARD_CREATE"

SUB_CREATE="$(curl -sS -X POST "$BASE_URL/subscriptions" -H "Authorization: Bearer $USER_TOKEN" -H "Content-Type: application/json" -d "{\"cardId\":\"$CARD_ID\",\"merchant\":\"Netflix\",\"amountHint\":399,\"currency\":\"ETB\"}")"
SUB_ID="$(printf '%s' "$SUB_CREATE" | json_get id)"
if [[ -z "$SUB_ID" ]]; then
  echo "ERROR: subscription create failed." >&2
  echo "subscription_create=$SUB_CREATE" >&2
  exit 1
fi
echo "subscription_create: $SUB_CREATE"
echo "subscription_update: $(curl -sS -X PATCH "$BASE_URL/subscriptions/$SUB_ID" -H "Authorization: Bearer $USER_TOKEN" -H "Content-Type: application/json" -d '{"amountHint":499}')"
echo "subscription_delete: $(curl -sS -X DELETE "$BASE_URL/subscriptions/$SUB_ID" -H "Authorization: Bearer $USER_TOKEN")"

REF="smoke-$(date +%s)"
TOPUP_INIT="$(curl -sS -X POST "$BASE_URL/topups/initiate" -H "Authorization: Bearer $USER_TOKEN" -H "Content-Type: application/json" -d "{\"amount\":100,\"currency\":\"ETB\",\"reference\":\"$REF\"}")"
TOPUP_ID="$(printf '%s' "$TOPUP_INIT" | json_get id)"
if [[ -z "$TOPUP_ID" ]]; then
  echo "ERROR: top-up initiation failed." >&2
  echo "topup_initiate=$TOPUP_INIT" >&2
  exit 1
fi
echo "topup_initiate: $TOPUP_INIT"
echo "reconciliation: $(curl -sS "$BASE_URL/topups/$TOPUP_ID/reconciliation" -H "Authorization: Bearer $USER_TOKEN")"

echo "webhook_jobs: $(curl -sS "$BASE_URL/webhooks/jobs" -H "Authorization: Bearer $ADMIN_TOKEN")"
echo "webhook_retry_failed: $(curl -sS -X POST "$BASE_URL/webhooks/jobs/retry-failed?limit=5" -H "Authorization: Bearer $ADMIN_TOKEN")"

echo "== Smoke certification passed =="
