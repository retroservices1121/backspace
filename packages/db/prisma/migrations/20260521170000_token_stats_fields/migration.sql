-- AlterTable: Solana token market data snapshots from Jupiter v2 search.
-- Refreshed by lib/dflow/snapshot-stats, read by /api/tokens for the
-- trending / gainers / losers sorts on the /tokens catalog page.
ALTER TABLE "Token" ADD COLUMN "priceUsd" DECIMAL(20,10);
ALTER TABLE "Token" ADD COLUMN "priceChange24h" DECIMAL(10,6);
ALTER TABLE "Token" ADD COLUMN "volumeUsd24h" DECIMAL(20,4);
ALTER TABLE "Token" ADD COLUMN "liquidityUsd" DECIMAL(20,4);
ALTER TABLE "Token" ADD COLUMN "statsAt" TIMESTAMP(3);

-- Sort indexes for the /tokens catalog (filter on isActive, order by
-- the stat column). NULLS LAST behaviour is the Postgres default for
-- DESC ordering and matches the silent-fallback semantics we want
-- (unpriced tokens drop to the bottom).
CREATE INDEX "Token_isActive_volumeUsd24h_idx" ON "Token"("isActive", "volumeUsd24h");
CREATE INDEX "Token_isActive_priceChange24h_idx" ON "Token"("isActive", "priceChange24h");
