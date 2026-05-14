-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('PERSON', 'ORG');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'PERSON';
