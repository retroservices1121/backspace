-- Pre-launch waitlist for the marketing landing page.
-- One row per email. usernameLower is the case-folded reservation that
-- gets honored when the user later signs up via Privy with that email.
CREATE TABLE "WaitlistEntry" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "usernameLower" TEXT,
    "usernameDisplay" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "referralCode" TEXT NOT NULL,
    "referredById" BIGINT,
    "ipHash" TEXT,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WaitlistEntry_uuid_key" ON "WaitlistEntry"("uuid");
CREATE UNIQUE INDEX "WaitlistEntry_email_key" ON "WaitlistEntry"("email");
CREATE UNIQUE INDEX "WaitlistEntry_usernameLower_key" ON "WaitlistEntry"("usernameLower");
CREATE UNIQUE INDEX "WaitlistEntry_referralCode_key" ON "WaitlistEntry"("referralCode");

ALTER TABLE "WaitlistEntry"
    ADD CONSTRAINT "WaitlistEntry_referredById_fkey"
    FOREIGN KEY ("referredById") REFERENCES "WaitlistEntry"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
