import { Module } from '@nestjs/common';
import { AssetAssignmentsController } from './asset-assignments.controller';
import { AssetAssignmentsService } from './asset-assignments.service';

@Module({
  controllers: [AssetAssignmentsController],
  providers: [AssetAssignmentsService],
})
export class AssetAssignmentsModule {}
