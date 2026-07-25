import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminProductsService } from './admin-products.service';
import { RejectDto } from '../dto/reject.dto';
import { Roles } from '../../../common/decorators/roles.decorator';

@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    return this.adminProductsService.findAll(status);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.adminProductsService.approve(id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectDto) {
    return this.adminProductsService.reject(id, dto.reason);
  }
}
