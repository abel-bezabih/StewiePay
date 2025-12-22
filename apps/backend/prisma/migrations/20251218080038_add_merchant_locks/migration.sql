-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "allowedCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "allowedMerchants" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "blockedCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "blockedMerchants" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "merchantLockMode" TEXT;
