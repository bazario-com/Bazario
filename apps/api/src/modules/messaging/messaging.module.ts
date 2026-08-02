import { Module } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { MessagingController, AdminMessagingController } from './messaging.controller';

@Module({
  controllers: [MessagingController, AdminMessagingController],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
