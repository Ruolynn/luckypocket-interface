-- CreateTable
CREATE TABLE "packets" (
    "id" TEXT NOT NULL,
    "packetId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL DEFAULT 11155111,
    "creatorId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tokenSymbol" TEXT,
    "tokenDecimals" INTEGER,
    "tokenName" TEXT,
    "totalAmount" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "isRandom" BOOLEAN NOT NULL,
    "message" VARCHAR(100),
    "remainingAmount" TEXT NOT NULL,
    "remainingCount" INTEGER NOT NULL,
    "vrfRequestId" TEXT,
    "randomReady" BOOLEAN NOT NULL DEFAULT false,
    "expireTime" TIMESTAMP(3) NOT NULL,
    "refunded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "blockNumber" BIGINT,
    "blockHash" TEXT,

    CONSTRAINT "packets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packet_claims" (
    "id" TEXT NOT NULL,
    "packetId" TEXT NOT NULL,
    "claimerId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "isBest" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockNumber" BIGINT,
    "blockHash" TEXT,

    CONSTRAINT "packet_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "packets_packetId_key" ON "packets"("packetId");

-- CreateIndex
CREATE UNIQUE INDEX "packets_txHash_key" ON "packets"("txHash");

-- CreateIndex
CREATE INDEX "packets_packetId_idx" ON "packets"("packetId");

-- CreateIndex
CREATE INDEX "packets_creatorId_idx" ON "packets"("creatorId");

-- CreateIndex
CREATE INDEX "packets_expireTime_idx" ON "packets"("expireTime");

-- CreateIndex
CREATE INDEX "packets_blockNumber_idx" ON "packets"("blockNumber");

-- CreateIndex
CREATE INDEX "packets_chainId_packetId_idx" ON "packets"("chainId", "packetId");

-- CreateIndex
CREATE INDEX "packets_creatorId_createdAt_idx" ON "packets"("creatorId", "createdAt");

-- CreateIndex
CREATE INDEX "packets_randomReady_idx" ON "packets"("randomReady");

-- CreateIndex
CREATE UNIQUE INDEX "packet_claims_txHash_key" ON "packet_claims"("txHash");

-- CreateIndex
CREATE INDEX "packet_claims_packetId_idx" ON "packet_claims"("packetId");

-- CreateIndex
CREATE INDEX "packet_claims_claimerId_idx" ON "packet_claims"("claimerId");

-- CreateIndex
CREATE INDEX "packet_claims_isBest_idx" ON "packet_claims"("isBest");

-- CreateIndex
CREATE INDEX "packet_claims_blockNumber_idx" ON "packet_claims"("blockNumber");

-- CreateIndex
CREATE INDEX "packet_claims_claimedAt_idx" ON "packet_claims"("claimedAt");

-- CreateIndex
CREATE UNIQUE INDEX "packet_claims_packetId_claimerId_key" ON "packet_claims"("packetId", "claimerId");

-- AddForeignKey
ALTER TABLE "packets" ADD CONSTRAINT "packets_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packet_claims" ADD CONSTRAINT "packet_claims_packetId_fkey" FOREIGN KEY ("packetId") REFERENCES "packets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packet_claims" ADD CONSTRAINT "packet_claims_claimerId_fkey" FOREIGN KEY ("claimerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
