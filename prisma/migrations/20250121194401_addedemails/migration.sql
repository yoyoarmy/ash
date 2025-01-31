/*
  Warnings:

  - A unique constraint covering the columns `[brandId]` on the table `NotificationSettings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "NotificationSettings_brandId_key" ON "NotificationSettings"("brandId");
