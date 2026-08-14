import { Module } from '@nestjs/common';
import { StoreFollowsService } from './store-follows.service';
import { StoreFollowsController } from './store-follows.controller';

@Module({
  controllers: [StoreFollowsController],
  providers: [StoreFollowsService],
})
export class StoreFollowsModule {}
