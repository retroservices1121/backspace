-- CreateTable
CREATE TABLE "TokenTrade" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" BIGINT NOT NULL,
    "walletId" BIGINT,
    "inputMint" TEXT NOT NULL,
    "inputAmount" TEXT NOT NULL,
    "outputMint" TEXT NOT NULL,
    "outputAmount" TEXT NOT NULL,
    "inputTokenId" BIGINT,
    "outputTokenId" BIGINT,
    "txSignature" TEXT NOT NULL,
    "venue" TEXT NOT NULL DEFAULT 'DFLOW',

    CONSTRAINT "TokenTrade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenTrade_id_key" ON "TokenTrade"("id");

-- CreateIndex
CREATE UNIQUE INDEX "TokenTrade_uuid_key" ON "TokenTrade"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "TokenTrade_txSignature_key" ON "TokenTrade"("txSignature");

-- CreateIndex
CREATE INDEX "TokenTrade_userId_createdAt_idx" ON "TokenTrade"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TokenTrade_walletId_idx" ON "TokenTrade"("walletId");

-- AddForeignKey
ALTER TABLE "TokenTrade" ADD CONSTRAINT "TokenTrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenTrade" ADD CONSTRAINT "TokenTrade_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenTrade" ADD CONSTRAINT "TokenTrade_inputTokenId_fkey" FOREIGN KEY ("inputTokenId") REFERENCES "Token"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenTrade" ADD CONSTRAINT "TokenTrade_outputTokenId_fkey" FOREIGN KEY ("outputTokenId") REFERENCES "Token"("id") ON DELETE SET NULL ON UPDATE CASCADE;
