import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminProductsService } from './admin-products.service';
import { RejectDto } from '../dto/reject.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { CurrentUser, AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  @RequirePermission('VIEW_PENDING_PRODUCTS')
  @Get()
  findAll(@Query('status') status?: string) {
    return this.adminProductsService.findAll(status);
  }

  @RequirePermission('APPROVE_PRODUCTS')
  @Post(':id/approve')
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.adminProductsService.approve(id, user.id);
  }

  @RequirePermission('REJECT_PRODUCTS')
  @Post(':id/reject')
  reject(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: RejectDto) {
    return this.adminProductsService.reject(id, dto.reason, user.id);
  }
}
