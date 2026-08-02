import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController, AdminShipmentsController } from './shipments.controller';
import { LeopardsProvider } from './providers/leopards.provider';

@Module({
  imports: [ConfigModule],
  controllers: [ShipmentsController, AdminShipmentsController],
  providers: [
    ShipmentsService,
    LeopardsProvider,
    {
      provide: 'COURIER_PROVIDER',
      useClass: LeopardsProvider, // swap this line to switch courier providers later
    },
  ],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
