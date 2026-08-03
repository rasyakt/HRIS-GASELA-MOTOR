import { Module } from '@nestjs/common';
import { WarningLettersController } from './warning-letters.controller';
import { WarningLettersService } from './warning-letters.service';

@Module({
  controllers: [WarningLettersController],
  providers: [WarningLettersService],
  exports: [WarningLettersService],
})
export class WarningLettersModule {}
