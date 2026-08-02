import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { AddManualEventDto } from './dto/add-manual-event.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, ShipmentStatus } from '@prisma/client';

@Controller('orders/:orderId/shipment')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get()
  getForOrder(@Param('orderId') orderId: string) {
    return this.shipmentsService.getByOrderId(orderId);
  }
}

@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.VENDOR)
@Controller('admin/shipments')
export class AdminShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get()
  findAll(@Query('status') status?: ShipmentStatus) {
    return this.shipmentsService.adminGetAll(status);
  }

  @Post('order/:orderId')
  createForOrder(@Param('orderId') orderId: string) {
    return this.shipmentsService.createForOrder(orderId);
  }

  @Patch(':id/refresh')
  refresh(@Param('id') id: string) {
    return this.shipmentsService.refreshTracking(id);
  }

  @Patch(':id/event')
  addEvent(@Param('id') id: string, @Body() dto: AddManualEventDto) {
    return this.shipmentsService.addManualEvent(id, dto);
  }
}
