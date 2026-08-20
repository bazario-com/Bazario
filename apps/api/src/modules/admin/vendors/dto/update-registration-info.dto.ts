import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateRegistrationInfoDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  businessName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  businessRegNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  taxId?: string;

  // If provided, marks the originating change request as resolved once
  // the edit is applied.
  @IsOptional()
  @IsUUID()
  requestId?: string;
}
