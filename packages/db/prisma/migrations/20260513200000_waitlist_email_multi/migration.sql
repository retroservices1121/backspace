-- One email can reserve multiple handles. Drop the unique on email,
-- keep a regular index so the lookups in /api/waitlist/me + the
-- claim-honour query in /api/user stay cheap.
DROP INDEX "WaitlistEntry_email_key";
CREATE INDEX "WaitlistEntry_email_idx" ON "WaitlistEntry"("email");
