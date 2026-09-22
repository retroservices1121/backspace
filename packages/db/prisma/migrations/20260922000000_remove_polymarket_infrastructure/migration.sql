-- Backspace prediction markets now use Gate DexBuilder live data.
-- Remove the historical Polymarket snapshot cache and Safe-address field.
DROP TABLE IF EXISTS "PolymarketPositionSnapshot";
ALTER TABLE "Wallet" DROP COLUMN IF EXISTS "safeAddress";
ALTER TYPE "MarketVenue" RENAME VALUE 'POLYMARKET' TO 'LEGACY_EXTERNAL';
