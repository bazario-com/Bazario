import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminVendorsService } from './admin-vendors.service';
import { RejectDto } from '../dto/reject.dto';
import { SetCommissionDto } from './dto/set-commission.dto';
import { UpdateRegistrationInfoDto } from './dto/update-registration-info.dto';
import { Roles } from '../../../common/decorators/roles.decorator';

@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/vendors')
export class AdminVendorsController {
  constructor(private readonly adminVendorsService: AdminVendorsService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    return this.adminVendorsService.findAll(status);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.adminVendorsService.approve(id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectDto) {
    return this.adminVendorsService.reject(id, dto.reason);
  }

  @Patch(':id/commission')
  setCommission(@Param('id') id: string, @Body() dto: SetCommissionDto) {
    return this.adminVendorsService.setCommission(id, dto.commissionRateBps);
  }

  @Get('change-requests')
  listChangeRequests(@Query('status') status?: string) {
    return this.adminVendorsService.listChangeRequests(status);
  }

  @Patch(':id/registration-info')
  updateRegistrationInfo(@Param('id') id: string, @Body() dto: UpdateRegistrationInfoDto) {
    const { requestId, ...data } = dto;
    return this.adminVendorsService.updateRegistrationInfo(id, data, requestId);
  }
}
