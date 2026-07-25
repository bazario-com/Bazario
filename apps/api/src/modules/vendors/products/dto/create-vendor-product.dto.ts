import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { VariantInputDto } from './variant-input.dto';

export class CreateVendorProductDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  categoryId: string;

  @IsString()
  @MaxLength(5000)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand?: string;

  @IsInt()
  @Min(1)
  basePriceCents: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  discountPct?: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsUrl({}, { each: true })
  imageUrls: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VariantInputDto)
  variants: VariantInputDto[];
}
