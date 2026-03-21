-- Funding reconciliation states for top-ups
CREATE TYPE "TopUpFundingState" AS ENUM ('PSP_PENDING', 'PSP_CONFIRMED', 'ISSUER_PENDING', 'CARD_LOADED', 'FAILED');

ALTER TABLE "TopUp"
ADD COLUMN "fundingState" "TopUpFundingState" NOT NULL DEFAULT 'PSP_PENDING',
ADD COLUMN "pspCompletedAt" TIMESTAMP(3),
ADD COLUMN "issuerLoadedAt" TIMESTAMP(3),
ADD COLUMN "settlementFailureReason" TEXT;

CREATE TABLE "FundingSettlementEvent" (
  "id" TEXT NOT NULL,
  "topUpId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "fromState" "TopUpFundingState",
  "toState" "TopUpFundingState" NOT NULL,
  "message" TEXT,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FundingSettlementEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FundingSettlementEvent_topUpId_createdAt_idx" ON "FundingSettlementEvent"("topUpId", "createdAt");
CREATE INDEX "FundingSettlementEvent_source_createdAt_idx" ON "FundingSettlementEvent"("source", "createdAt");

ALTER TABLE "FundingSettlementEvent"
ADD CONSTRAINT "FundingSettlementEvent_topUpId_fkey" FOREIGN KEY ("topUpId") REFERENCES "TopUp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "TopUp_fundingState_createdAt_idx" ON "TopUp"("fundingState", "createdAt");

