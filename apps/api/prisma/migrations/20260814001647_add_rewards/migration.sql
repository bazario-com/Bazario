CREATE TYPE "RewardsTransactionType" AS ENUM ('EARNED', 'REDEEMED', 'ADJUSTED');

CREATE TABLE "rewards_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pointsBalance" INTEGER NOT NULL DEFAULT 0,
    "lifetimePoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rewards_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rewards_accounts_userId_key" ON "rewards_accounts"("userId");

CREATE TABLE "rewards_transactions" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "type" "RewardsTransactionType" NOT NULL,
    "reason" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rewards_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rewards_transactions_accountId_idx" ON "rewards_transactions"("accountId");

CREATE INDEX "rewards_transactions_orderId_idx" ON "rewards_transactions"("orderId");

ALTER TABLE "rewards_accounts" ADD CONSTRAINT "rewards_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rewards_transactions" ADD CONSTRAINT "rewards_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "rewards_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rewards_transactions" ADD CONSTRAINT "rewards_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
