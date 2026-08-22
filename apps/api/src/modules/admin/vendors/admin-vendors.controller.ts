import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminVendorsService } from './admin-vendors.service';
import { RejectDto } from '../dto/reject.dto';
import { SetCommissionDto } from './dto/set-commission.dto';
import { UpdateRegistrationInfoDto } from './dto/update-registration-info.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { CurrentUser, AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/vendors')
export class AdminVendorsController {
  constructor(private readonly adminVendorsService: AdminVendorsService) {}

  @RequirePermission('VIEW_VENDORS')
  @Get()
  findAll(@Query('status') status?: string) {
    return this.adminVendorsService.findAll(status);
  }

  @RequirePermission('APPROVE_VENDORS')
  @Post(':id/approve')
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.adminVendorsService.approve(id, user.id);
  }

  @RequirePermission('REJECT_VENDORS')
  @Post(':id/reject')
  reject(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: RejectDto) {
    return this.adminVendorsService.reject(id, dto.reason, user.id);
  }

  @RequirePermission('MANAGE_VENDOR_COMMISSION')
  @Patch(':id/commission')
  setCommission(@Param('id') id: string, @Body() dto: SetCommissionDto) {
    return this.adminVendorsService.setCommission(id, dto.commissionRateBps);
  }

  @RequirePermission('VIEW_VENDOR_CHANGE_REQUESTS')
  @Get('change-requests')
  listChangeRequests(@Query('status') status?: string) {
    return this.adminVendorsService.listChangeRequests(status);
  }

  @RequirePermission('EDIT_VENDOR_REGISTRATION_INFO')
  @Patch(':id/registration-info')
  updateRegistrationInfo(@Param('id') id: string, @Body() dto: UpdateRegistrationInfoDto) {
    const { requestId, ...data } = dto;
    return this.adminVendorsService.updateRegistrationInfo(id, data, requestId);
  }
}
