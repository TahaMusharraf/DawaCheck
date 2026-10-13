/*
  Warnings:

  - A unique constraint covering the columns `[walletIndex]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "licenseTxHash" TEXT,
ADD COLUMN     "walletIndex" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_walletIndex_key" ON "Organization"("walletIndex");
