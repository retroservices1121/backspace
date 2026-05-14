-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_positionId_fkey";

-- AlterTable
ALTER TABLE "Trade" ALTER COLUMN "positionId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Trade_venueOrderId_key" ON "Trade"("venueOrderId");

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;
