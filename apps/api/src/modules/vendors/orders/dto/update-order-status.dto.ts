import { IsIn } from 'class-validator';

// Vendors can only move orders forward through fulfillment or cancel them —
// PENDING/CONFIRMED (checkout-time) and RETURNED/REFUNDED (post-delivery
// dispute resolution) are set by the system or admin, not the vendor.
export const VENDOR_SETTABLE_STATUSES = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
export type VendorSettableStatus = (typeof VENDOR_SETTABLE_STATUSES)[number];

export class UpdateOrderStatusDto {
  @IsIn(VENDOR_SETTABLE_STATUSES)
  status: VendorSettableStatus;
}
