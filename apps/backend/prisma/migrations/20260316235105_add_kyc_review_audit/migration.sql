-- CreateTable
CREATE TABLE "KycReviewEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "previousStatus" "KycStatus" NOT NULL,
    "newStatus" "KycStatus" NOT NULL,
    "rejectionReason" TEXT,
    "reviewNote" TEXT,
    "reviewerIp" TEXT,
    "reviewerUserAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KycReviewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KycReviewEvent_userId_createdAt_idx" ON "KycReviewEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "KycReviewEvent_reviewerId_createdAt_idx" ON "KycReviewEvent"("reviewerId", "createdAt");

-- AddForeignKey
ALTER TABLE "KycReviewEvent" ADD CONSTRAINT "KycReviewEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycReviewEvent" ADD CONSTRAINT "KycReviewEvent_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
