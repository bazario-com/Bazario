import { Module } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';
import { VendorProductsService } from './products/vendor-products.service';
import { VendorProductsController } from './products/vendor-products.controller';
import { VendorOrdersService } from './orders/vendor-orders.service';
import { VendorOrdersController } from './orders/vendor-orders.controller';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
  imports: [RewardsModule],
  controllers: [VendorsController, VendorProductsController, VendorOrdersController],
  providers: [VendorsService, VendorProductsService, VendorOrdersService],
  exports: [VendorsService],
})
export class VendorsModule {}
