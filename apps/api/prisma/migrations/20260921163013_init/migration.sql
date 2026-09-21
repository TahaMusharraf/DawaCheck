-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('REGULATOR', 'MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY');

-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('PENDING', 'LICENSED', 'REVOKED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('ISSUED', 'SOLD');

-- CreateEnum
CREATE TYPE "ScanResult" AS ENUM ('AUTHENTIC', 'NOT_REGISTERED', 'EXPIRED', 'RECALLED', 'CLONE_SUSPECTED');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'CONFIRMED', 'DISMISSED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrgType" NOT NULL,
    "status" "OrgStatus" NOT NULL DEFAULT 'PENDING',
    "licenseNo" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "walletAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "batchId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "drugName" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "merkleRoot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "mfgDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "recalled" BOOLEAN NOT NULL DEFAULT false,
    "ipfsCid" TEXT,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("batchId")
);

-- CreateTable
CREATE TABLE "Unit" (
    "unitHash" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "merkleProof" JSONB NOT NULL,
    "status" "UnitStatus" NOT NULL DEFAULT 'ISSUED',
    "currentHolderId" TEXT,
    "soldAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("unitHash")
);

-- CreateTable
CREATE TABLE "CustodyEvent" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "fromOrgId" TEXT NOT NULL,
    "toOrgId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustodyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recall" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "issuedByOrgId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanEvent" (
    "id" TEXT NOT NULL,
    "unitHash" TEXT NOT NULL,
    "result" "ScanResult" NOT NULL,
    "ipHash" TEXT NOT NULL,
    "deviceHash" TEXT NOT NULL,
    "city" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskFlags" TEXT[],
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounterfeitAlert" (
    "id" TEXT NOT NULL,
    "unitHash" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "ruleTriggered" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "CounterfeitAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexerCheckpoint" (
    "id" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "lastBlockProcessed" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexerCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_licenseNo_key" ON "Organization"("licenseNo");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_walletAddress_key" ON "Organization"("walletAddress");

-- CreateIndex
CREATE INDEX "Organization_type_status_idx" ON "Organization"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_orgId_idx" ON "User"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_batchNumber_key" ON "Batch"("batchNumber");

-- CreateIndex
CREATE INDEX "Batch_manufacturerId_idx" ON "Batch"("manufacturerId");

-- CreateIndex
CREATE INDEX "Batch_expiryDate_idx" ON "Batch"("expiryDate");

-- CreateIndex
CREATE INDEX "Unit_batchId_idx" ON "Unit"("batchId");

-- CreateIndex
CREATE INDEX "Unit_currentHolderId_idx" ON "Unit"("currentHolderId");

-- CreateIndex
CREATE INDEX "CustodyEvent_batchId_idx" ON "CustodyEvent"("batchId");

-- CreateIndex
CREATE INDEX "CustodyEvent_toOrgId_idx" ON "CustodyEvent"("toOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "CustodyEvent_txHash_batchId_key" ON "CustodyEvent"("txHash", "batchId");

-- CreateIndex
CREATE UNIQUE INDEX "Recall_batchId_key" ON "Recall"("batchId");

-- CreateIndex
CREATE INDEX "ScanEvent_unitHash_scannedAt_idx" ON "ScanEvent"("unitHash", "scannedAt");

-- CreateIndex
CREATE INDEX "ScanEvent_scannedAt_idx" ON "ScanEvent"("scannedAt");

-- CreateIndex
CREATE INDEX "CounterfeitAlert_status_createdAt_idx" ON "CounterfeitAlert"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CounterfeitAlert_batchId_idx" ON "CounterfeitAlert"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "IndexerCheckpoint_contractAddress_chainId_key" ON "IndexerCheckpoint"("contractAddress", "chainId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("batchId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_currentHolderId_fkey" FOREIGN KEY ("currentHolderId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyEvent" ADD CONSTRAINT "CustodyEvent_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("batchId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyEvent" ADD CONSTRAINT "CustodyEvent_fromOrgId_fkey" FOREIGN KEY ("fromOrgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyEvent" ADD CONSTRAINT "CustodyEvent_toOrgId_fkey" FOREIGN KEY ("toOrgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recall" ADD CONSTRAINT "Recall_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("batchId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recall" ADD CONSTRAINT "Recall_issuedByOrgId_fkey" FOREIGN KEY ("issuedByOrgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_unitHash_fkey" FOREIGN KEY ("unitHash") REFERENCES "Unit"("unitHash") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounterfeitAlert" ADD CONSTRAINT "CounterfeitAlert_unitHash_fkey" FOREIGN KEY ("unitHash") REFERENCES "Unit"("unitHash") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounterfeitAlert" ADD CONSTRAINT "CounterfeitAlert_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("batchId") ON DELETE CASCADE ON UPDATE CASCADE;
