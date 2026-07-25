import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminVendorsService } from './admin-vendors.service';
import { RejectDto } from '../dto/reject.dto';
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
}
