-- Onboarding tour completion flag. Default false so every existing
-- user gets the tour on their next sign-in; flips true on finish/skip.
ALTER TABLE "User" ADD COLUMN "hasCompletedTour" BOOLEAN NOT NULL DEFAULT false;
