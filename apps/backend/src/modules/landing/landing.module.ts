import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LandingController } from './landing.controller';
import { LandingService } from './landing.service';

@Module({
  imports: [PrismaModule],
  controllers: [LandingController],
  providers: [LandingService],
  exports: [LandingService],
})
export class LandingModule {}
