import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterVendorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  businessName: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  businessRegNumber?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  storeName: string;

  // Kept simple and explicit rather than auto-slugified server-side, so the
  // vendor sees exactly what their storefront URL will be before submitting.
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'Store URL can only contain lowercase letters, numbers and hyphens',
  })
  @MinLength(3)
  @MaxLength(50)
  storeSlug: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  storeDescription?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  address: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  city: string;

  @IsString()
  @Matches(/^[0-9+\- ]{7,20}$/, { message: 'Enter a valid contact phone number' })
  contactPhone: string;
}
