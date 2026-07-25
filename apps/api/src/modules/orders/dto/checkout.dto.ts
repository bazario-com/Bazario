import { IsIn, IsOptional, IsString } from 'class-validator';

// Only COD actually completes payment in this phase; the other values are
// accepted so the frontend's payment-method selector doesn't need to change
// shape when the Payment Integration phase wires up real gateways — they
// currently return a 501 from OrdersService.checkout().
export const SUPPORTED_PAYMENT_METHODS = [
  'COD',
  'CARD',
  'JAZZCASH',
  'EASYPAISA',
  'BANK_TRANSFER',
] as const;
export type PaymentMethod = (typeof SUPPORTED_PAYMENT_METHODS)[number];

export class CheckoutDto {
  @IsString()
  addressId: string;

  @IsIn(SUPPORTED_PAYMENT_METHODS)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  couponCode?: string;
}
