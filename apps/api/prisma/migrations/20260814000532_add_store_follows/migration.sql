CREATE TABLE "store_follows" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_follows_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "store_follows_userId_storeId_key" ON "store_follows"("userId", "storeId");

CREATE INDEX "store_follows_storeId_idx" ON "store_follows"("storeId");

ALTER TABLE "store_follows" ADD CONSTRAINT "store_follows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "store_follows" ADD CONSTRAINT "store_follows_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
