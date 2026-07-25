import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { VendorsService } from '../vendors/vendors.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('coupons')
export class CouponsController {
  constructor(
    private readonly couponsService: CouponsService,
    private readonly vendorsService: VendorsService,
  ) {}

  // Vendors can only create coupons scoped to their own store — vendorId is
  // derived from the authenticated user, never accepted from the request
  // body, so a vendor can't mint a coupon against someone else's store.
  @Roles(Role.VENDOR)
  @Post('vendor')
  async createVendorCoupon(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCouponDto) {
    const vendor = await this.vendorsService.findByUserId(user.id);
    if (!vendor || vendor.status !== 'APPROVED') {
      throw new ForbiddenException('Only approved vendors can create coupons');
    }
    return this.couponsService.create(vendor.id, dto);
  }

  // Platform-wide coupons (vendorId = null) — admin only.
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('platform')
  createPlatformCoupon(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(null, dto);
  }
}
