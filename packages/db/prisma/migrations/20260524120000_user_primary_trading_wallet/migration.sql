-- Optional pointer to the user's preferred trading wallet. Lowercased
-- EVM address; nullable so auto-pick remains the default.
ALTER TABLE "User"
  ADD COLUMN "primaryTradingWalletAddress" TEXT;
