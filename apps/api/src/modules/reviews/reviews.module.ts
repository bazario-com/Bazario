import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController, ReviewsSelfController } from './reviews.controller';

@Module({
  controllers: [ReviewsController, ReviewsSelfController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
