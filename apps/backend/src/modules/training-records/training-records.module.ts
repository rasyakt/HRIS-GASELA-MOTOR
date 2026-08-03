import { Module } from '@nestjs/common';
import { TrainingRecordsController } from './training-records.controller';
import { TrainingRecordsService } from './training-records.service';

@Module({
  controllers: [TrainingRecordsController],
  providers: [TrainingRecordsService],
})
export class TrainingRecordsModule {}
