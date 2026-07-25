import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { CouponDiscountType } from '@prisma/client';

export class CreateCouponDto {
  @IsString()
  @MaxLength(30)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsEnum(CouponDiscountType)
  discountType: CouponDiscountType;

  @IsInt()
  @Min(1)
  discountValue: number; // 1-100 for PERCENTAGE, minor-unit amount for FIXED

  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderCents?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptions?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
