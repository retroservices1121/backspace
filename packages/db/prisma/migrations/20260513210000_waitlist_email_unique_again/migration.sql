-- Revert to one-handle-per-email. The earlier multi-handle migration
-- was a product mis-step; bring back the unique constraint and dedupe
-- existing rows by keeping the oldest reservation per email.

-- Drop the duplicates: keep the row with the smallest id per email.
DELETE FROM "WaitlistEntry"
WHERE id IN (
  SELECT w.id
  FROM "WaitlistEntry" w
  JOIN (
    SELECT email, MIN(id) AS keep_id
    FROM "WaitlistEntry"
    GROUP BY email
  ) keepers
    ON w.email = keepers.email
   AND w.id <> keepers.keep_id
);

-- Swap the regular index for a unique one.
DROP INDEX "WaitlistEntry_email_idx";
CREATE UNIQUE INDEX "WaitlistEntry_email_key" ON "WaitlistEntry"("email");
