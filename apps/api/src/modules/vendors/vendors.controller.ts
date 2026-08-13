import { Body, Controller, ForbiddenException, Get, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { VendorsService } from './vendors.service';
import { RegisterVendorDto } from './dto/register-vendor.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Public()
  @Get('top')
  getTopStores(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : 6;
    return this.vendorsService.getTopStores(Number.isFinite(parsed) ? parsed : 6);
  }

  // Any logged-in customer can apply — the RolesGuard has nothing to check
  // yet at this point since they aren't a vendor until this call succeeds.
  @Post('register')
  register(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterVendorDto) {
    return this.vendorsService.register(user.id, dto);
  }

  @Roles(Role.VENDOR)
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const vendor = await this.vendorsService.findByUserId(user.id);
    if (!vendor) throw new ForbiddenException('No vendor account found for this user');
    return vendor;
  }

  @Roles(Role.VENDOR)
  @Get('me/dashboard')
  async dashboard(@CurrentUser() user: AuthenticatedUser) {
    const vendor = await this.vendorsService.findByUserId(user.id);
    if (!vendor) throw new ForbiddenException('No vendor account found for this user');
    return this.vendorsService.getDashboardSummary(vendor.id);
  }

  @Roles(Role.VENDOR)
  @Patch('me/store')
  async updateStore(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateStoreDto) {
    const vendor = await this.vendorsService.findByUserId(user.id);
    if (!vendor) throw new ForbiddenException('No vendor account found for this user');
    return this.vendorsService.updateStore(vendor.id, dto);
  }
}
