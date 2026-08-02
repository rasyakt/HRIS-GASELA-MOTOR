import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { OvertimeController } from './overtime.controller';
import { OvertimeService } from './overtime.service';

@Module({
  imports: [PrismaModule],
  controllers: [OvertimeController],
  providers: [OvertimeService],
  exports: [OvertimeService],
})
export class OvertimeModule {}
