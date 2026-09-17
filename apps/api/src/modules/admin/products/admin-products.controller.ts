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
  findAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: string,
  ) {
    return this.adminProductsService.findAll(
      status,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
      sortBy,
      sortDir === 'asc' ? 'asc' : 'desc',
    );
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

  // Reuses REJECT_PRODUCTS/APPROVE_PRODUCTS rather than introducing new
  // permission enum values — same reasoning as vendor suspend/reactivate:
  // archiving removes published visibility (reject-level authority),
  // restoring returns it (approve-level authority).
  @RequirePermission('REJECT_PRODUCTS')
  @Post(':id/archive')
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.adminProductsService.archiveProduct(id, user.id);
  }

  @RequirePermission('APPROVE_PRODUCTS')
  @Post(':id/restore')
  restore(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.adminProductsService.restoreProduct(id, user.id);
  }
}
