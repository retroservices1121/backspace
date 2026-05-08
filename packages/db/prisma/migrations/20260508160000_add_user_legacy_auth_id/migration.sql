-- AlterTable
ALTER TABLE "User" ADD COLUMN "legacyAuthId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_legacyAuthId_key" ON "User"("legacyAuthId");
