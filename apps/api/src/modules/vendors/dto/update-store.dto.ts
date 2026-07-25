import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsUrl()
  bannerUrl?: string;
}
