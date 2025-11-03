-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('ETH', 'ERC20', 'ERC721', 'ERC1155');

-- CreateEnum
CREATE TYPE "GiftStatus" AS ENUM ('PENDING', 'CLAIMED', 'REFUNDED', 'EXPIRED');

-- CreateTable
CREATE TABLE "gifts" (
    "id" TEXT NOT NULL,
    "giftId" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "createTxHash" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientAddress" TEXT NOT NULL,
    "recipientId" TEXT,
    "tokenType" "TokenType" NOT NULL,
    "token" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL DEFAULT '0',
    "amount" TEXT NOT NULL,
    "tokenSymbol" TEXT,
    "tokenDecimals" INTEGER,
    "tokenName" TEXT,
    "tokenImage" TEXT,
    "nftImage" TEXT,
    "nftName" TEXT,
    "message" VARCHAR(500),
    "status" "GiftStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "claimTxHash" TEXT,
    "claimedAt" TIMESTAMP(3),
    "refundTxHash" TEXT,
    "refundedAt" TIMESTAMP(3),

    CONSTRAINT "gifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_claims" (
    "id" TEXT NOT NULL,
    "giftId" TEXT NOT NULL,
    "claimerId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gasUsed" TEXT,
    "gasPrice" TEXT,

    CONSTRAINT "gift_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gifts_giftId_key" ON "gifts"("giftId");

-- CreateIndex
CREATE UNIQUE INDEX "gifts_createTxHash_key" ON "gifts"("createTxHash");

-- CreateIndex
CREATE UNIQUE INDEX "gifts_claimTxHash_key" ON "gifts"("claimTxHash");

-- CreateIndex
CREATE UNIQUE INDEX "gifts_refundTxHash_key" ON "gifts"("refundTxHash");

-- CreateIndex
CREATE INDEX "gifts_giftId_idx" ON "gifts"("giftId");

-- CreateIndex
CREATE INDEX "gifts_senderId_idx" ON "gifts"("senderId");

-- CreateIndex
CREATE INDEX "gifts_recipientAddress_idx" ON "gifts"("recipientAddress");

-- CreateIndex
CREATE INDEX "gifts_recipientId_idx" ON "gifts"("recipientId");

-- CreateIndex
CREATE INDEX "gifts_status_idx" ON "gifts"("status");

-- CreateIndex
CREATE INDEX "gifts_tokenType_idx" ON "gifts"("tokenType");

-- CreateIndex
CREATE INDEX "gifts_expiresAt_idx" ON "gifts"("expiresAt");

-- CreateIndex
CREATE INDEX "gifts_createdAt_idx" ON "gifts"("createdAt");

-- CreateIndex
CREATE INDEX "gifts_chainId_giftId_idx" ON "gifts"("chainId", "giftId");

-- CreateIndex
CREATE INDEX "gifts_senderId_status_idx" ON "gifts"("senderId", "status");

-- CreateIndex
CREATE INDEX "gifts_recipientId_status_idx" ON "gifts"("recipientId", "status");

-- CreateIndex
CREATE INDEX "gifts_status_expiresAt_idx" ON "gifts"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "gift_claims_txHash_key" ON "gift_claims"("txHash");

-- CreateIndex
CREATE INDEX "gift_claims_giftId_idx" ON "gift_claims"("giftId");

-- CreateIndex
CREATE INDEX "gift_claims_claimerId_idx" ON "gift_claims"("claimerId");

-- CreateIndex
CREATE INDEX "gift_claims_claimedAt_idx" ON "gift_claims"("claimedAt");

-- CreateIndex
CREATE INDEX "gift_claims_txHash_idx" ON "gift_claims"("txHash");

-- CreateIndex
CREATE INDEX "gift_claims_chainId_txHash_idx" ON "gift_claims"("chainId", "txHash");

-- CreateIndex
CREATE UNIQUE INDEX "gift_claims_giftId_claimerId_key" ON "gift_claims"("giftId", "claimerId");

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_claims" ADD CONSTRAINT "gift_claims_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "gifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_claims" ADD CONSTRAINT "gift_claims_claimerId_fkey" FOREIGN KEY ("claimerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
