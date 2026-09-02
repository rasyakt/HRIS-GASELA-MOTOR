import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AttendancesController } from './attendances.controller';
import { AttendancesService } from './attendances.service';
import { AttendanceRetentionService } from './attendance-retention.service';

@Module({
  imports: [PrismaModule],
  controllers: [AttendancesController],
  providers: [AttendancesService, AttendanceRetentionService],
  exports: [AttendancesService, AttendanceRetentionService],
})
export class AttendancesModule {}
