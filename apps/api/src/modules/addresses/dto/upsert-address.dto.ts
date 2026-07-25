import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AddressType } from '@prisma/client';

export class UpsertAddressDto {
  @IsString()
  @MaxLength(50)
  label: string;

  @IsOptional()
  @IsEnum(AddressType)
  type?: AddressType;

  @IsString()
  @MaxLength(100)
  recipientName: string;

  @IsString()
  @MaxLength(20)
  phone: string;

  @IsString()
  @MaxLength(200)
  line1: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  line2?: string;

  @IsString()
  @MaxLength(100)
  city: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
