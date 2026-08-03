import { Module } from '@nestjs/common';
import { PerformanceReviewsController } from './performance-reviews.controller';
import { PerformanceReviewsService } from './performance-reviews.service';

@Module({
  controllers: [PerformanceReviewsController],
  providers: [PerformanceReviewsService],
})
export class PerformanceReviewsModule {}
