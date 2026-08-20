CREATE TYPE "ChangeRequestStatus" AS ENUM ('PENDING', 'RESOLVED');

CREATE TABLE "vendor_info_change_requests" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "vendor_info_change_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vendor_info_change_requests_vendorId_idx" ON "vendor_info_change_requests"("vendorId");

CREATE INDEX "vendor_info_change_requests_status_idx" ON "vendor_info_change_requests"("status");

ALTER TABLE "vendor_info_change_requests" ADD CONSTRAINT "vendor_info_change_requests_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
