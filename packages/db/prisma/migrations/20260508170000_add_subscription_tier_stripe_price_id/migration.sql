-- Add Stripe price ID to subscription tiers so the user-side purchase
-- flow can hand a real price to /api/billing/subscription. Nullable
-- because creator-side onboarding (which mints the Stripe price)
-- isn't live yet — existing rows stay null and are non-purchasable
-- until backfilled.
ALTER TABLE "SubscriptionTier" ADD COLUMN "stripePriceId" TEXT;
CREATE UNIQUE INDEX "SubscriptionTier_stripePriceId_key" ON "SubscriptionTier"("stripePriceId");
