import { IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class VariantInputDto {
  @IsString()
  sku: string;

  @IsOptional()
  @IsObject()
  optionsJson?: Record<string, string>;

  @IsInt()
  @Min(0)
  priceCents: number;

  @IsInt()
  @Min(0)
  stockQuantity: number;
}
