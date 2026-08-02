import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';

@Module({
  imports: [PrismaModule],
  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [LeavesService],
})
export class LeavesModule {}
