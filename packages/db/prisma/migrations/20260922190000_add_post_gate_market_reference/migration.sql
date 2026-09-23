-- Posts keep only Gate's stable identifier. Market metadata remains live.
ALTER TABLE "Post" ADD COLUMN "gateMarketId" TEXT;
CREATE INDEX "Post_gateMarketId_idx" ON "Post"("gateMarketId");
