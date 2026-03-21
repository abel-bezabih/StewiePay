-- CreateIndex
CREATE INDEX "Transaction_cardId_timestamp_idx" ON "Transaction"("cardId", "timestamp");

-- CreateIndex
CREATE INDEX "Transaction_cardId_status_timestamp_idx" ON "Transaction"("cardId", "status", "timestamp");

-- CreateIndex
CREATE INDEX "TopUp_userId_createdAt_idx" ON "TopUp"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TopUp_orgId_createdAt_idx" ON "TopUp"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "TopUp_status_createdAt_idx" ON "TopUp"("status", "createdAt");

-- De-duplicate legacy top-up references before adding uniqueness
WITH ranked_topups AS (
    SELECT "id", "reference", ROW_NUMBER() OVER (PARTITION BY "reference" ORDER BY "createdAt" ASC, "id" ASC) AS rn
    FROM "TopUp"
)
UPDATE "TopUp" t
SET "reference" = t."reference" || '-' || SUBSTRING(t."id" FROM 1 FOR 8)
FROM ranked_topups r
WHERE t."id" = r."id" AND r.rn > 1;

-- CreateIndex
CREATE UNIQUE INDEX "TopUp_reference_key" ON "TopUp"("reference");

-- De-duplicate webhook logs before adding uniqueness
WITH ranked_webhooks AS (
    SELECT "id", ROW_NUMBER() OVER (PARTITION BY "webhookId", "source" ORDER BY "createdAt" ASC, "id" ASC) AS rn
    FROM "WebhookLog"
)
DELETE FROM "WebhookLog" w
USING ranked_webhooks r
WHERE w."id" = r."id" AND r.rn > 1;

-- CreateIndex
CREATE UNIQUE INDEX "WebhookLog_webhookId_source_key" ON "WebhookLog"("webhookId", "source");
