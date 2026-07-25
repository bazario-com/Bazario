import { PartialType } from '@nestjs/mapped-types';
import { CreateVendorProductDto } from './create-vendor-product.dto';

export class UpdateVendorProductDto extends PartialType(CreateVendorProductDto) {}
