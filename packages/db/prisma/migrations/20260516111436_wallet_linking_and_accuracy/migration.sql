-- AlterTable
ALTER TABLE "User" ADD COLUMN     "publicAccuracy" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "safeAddress" TEXT,
ADD COLUMN     "source" TEXT;

-- CreateTable
CREATE TABLE "PolymarketPositionSnapshot" (
    "id" BIGSERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" BIGINT NOT NULL,
    "safeAddress" TEXT NOT NULL,
    "conditionId" TEXT NOT NULL,
    "outcomeAssetId" TEXT NOT NULL,
    "outcomeLabel" TEXT NOT NULL,
    "avgPrice" DECIMAL(18,8) NOT NULL,
    "size" DECIMAL(36,18) NOT NULL,
    "payoutUsd" DECIMAL(18,8) NOT NULL,
    "realizedPnlUsd" DECIMAL(18,8) NOT NULL,
    "won" BOOLEAN NOT NULL,
    "settledAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolymarketPositionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PolymarketPositionSnapshot_id_key" ON "PolymarketPositionSnapshot"("id");

-- CreateIndex
CREATE INDEX "PolymarketPositionSnapshot_userId_settledAt_idx" ON "PolymarketPositionSnapshot"("userId", "settledAt");

-- CreateIndex
CREATE INDEX "PolymarketPositionSnapshot_conditionId_idx" ON "PolymarketPositionSnapshot"("conditionId");

-- CreateIndex
CREATE UNIQUE INDEX "PolymarketPositionSnapshot_safeAddress_conditionId_outcomeA_key" ON "PolymarketPositionSnapshot"("safeAddress", "conditionId", "outcomeAssetId");

-- CreateIndex
CREATE INDEX "Wallet_source_idx" ON "Wallet"("source");

-- AddForeignKey
ALTER TABLE "PolymarketPositionSnapshot" ADD CONSTRAINT "PolymarketPositionSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
