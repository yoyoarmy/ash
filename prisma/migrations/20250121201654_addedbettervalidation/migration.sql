-- DropForeignKey
ALTER TABLE "Lease" DROP CONSTRAINT "Lease_orderId_fkey";

-- AlterTable
ALTER TABLE "Lease" ALTER COLUMN "orderId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Lease_startDate_endDate_idx" ON "Lease"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Lease_statusId_idx" ON "Lease"("statusId");

-- CreateIndex
CREATE INDEX "Lease_mediaSpaceId_idx" ON "Lease"("mediaSpaceId");

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
