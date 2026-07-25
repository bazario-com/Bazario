import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { VendorProductsService } from './vendor-products.service';
import { VendorsService } from '../vendors.service';
import { CreateVendorProductDto } from './dto/create-vendor-product.dto';
import { UpdateVendorProductDto } from './dto/update-vendor-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

@Roles(Role.VENDOR)
@Controller('vendors/me/products')
export class VendorProductsController {
  constructor(
    private readonly vendorProductsService: VendorProductsService,
    private readonly vendorsService: VendorsService,
  ) {}

  private async requireApprovedVendor(userId: string) {
    const vendor = await this.vendorsService.findByUserId(userId);
    if (!vendor) throw new ForbiddenException('No vendor account found for this user');
    if (vendor.status !== 'APPROVED') {
      throw new ForbiddenException(
        'Your vendor account is still pending approval — you can\'t list products yet',
      );
    }
    return vendor;
  }

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const vendor = await this.vendorsService.findByUserId(user.id);
    if (!vendor) throw new ForbiddenException('No vendor account found for this user');
    return this.vendorProductsService.findAllForVendor(vendor.id);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const vendor = await this.vendorsService.findByUserId(user.id);
    if (!vendor) throw new ForbiddenException('No vendor account found for this user');
    return this.vendorProductsService.findOneForVendor(vendor.id, id);
  }

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateVendorProductDto) {
    const vendor = await this.requireApprovedVendor(user.id);
    return this.vendorProductsService.create(vendor.id, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateVendorProductDto,
  ) {
    const vendor = await this.requireApprovedVendor(user.id);
    return this.vendorProductsService.update(vendor.id, id, dto);
  }

  @Patch('variants/:variantId/stock')
  async updateStock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateStockDto,
  ) {
    const vendor = await this.requireApprovedVendor(user.id);
    return this.vendorProductsService.updateVariantStock(vendor.id, variantId, dto.stockQuantity);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const vendor = await this.vendorsService.findByUserId(user.id);
    if (!vendor) throw new ForbiddenException('No vendor account found for this user');
    return this.vendorProductsService.archive(vendor.id, id);
  }
}
