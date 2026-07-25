import { Body, Controller, ForbiddenException, Get, Param, Patch } from '@nestjs/common';
import { Role } from '@prisma/client';
import { VendorOrdersService } from './vendor-orders.service';
import { VendorsService } from '../vendors.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

@Roles(Role.VENDOR)
@Controller('vendors/me/orders')
export class VendorOrdersController {
  constructor(
    private readonly vendorOrdersService: VendorOrdersService,
    private readonly vendorsService: VendorsService,
  ) {}

  private async requireVendor(userId: string) {
    const vendor = await this.vendorsService.findByUserId(userId);
    if (!vendor) throw new ForbiddenException('No vendor account found for this user');
    return vendor;
  }

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const vendor = await this.requireVendor(user.id);
    return this.vendorOrdersService.findAllForVendor(vendor.id);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const vendor = await this.requireVendor(user.id);
    return this.vendorOrdersService.findOneForVendor(vendor.id, id);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const vendor = await this.requireVendor(user.id);
    return this.vendorOrdersService.updateStatus(vendor.id, id, dto.status);
  }
}
