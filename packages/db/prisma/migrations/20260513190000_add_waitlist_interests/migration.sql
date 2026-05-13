-- Free-form interest tags collected by the landing-page chips
-- ('markets' | 'crypto' | 'community' | 'trading'). Default empty
-- array so existing rows don't break the NOT NULL constraint.
ALTER TABLE "WaitlistEntry"
  ADD COLUMN "interests" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
