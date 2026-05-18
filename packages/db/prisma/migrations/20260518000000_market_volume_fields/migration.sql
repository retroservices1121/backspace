-- AlterTable: volume snapshots from the venue (Polymarket Gamma).
ALTER TABLE "Market" ADD COLUMN "volumeUsd" DECIMAL(20,6);
ALTER TABLE "Market" ADD COLUMN "volume24hUsd" DECIMAL(20,6);
ALTER TABLE "Market" ADD COLUMN "liquidityUsd" DECIMAL(20,6);

-- Sort indexes for the /markets catalog page (filter on status, order by volume).
CREATE INDEX "Market_status_volumeUsd_idx" ON "Market"("status", "volumeUsd");
CREATE INDEX "Market_status_volume24hUsd_idx" ON "Market"("status", "volume24hUsd");
