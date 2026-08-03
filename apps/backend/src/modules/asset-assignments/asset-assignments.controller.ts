import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Roles } from '../auth/decorators/roles.decorator';
import { AssetAssignmentsService } from './asset-assignments.service';
import {
  AssetAssignmentQueryDto,
  CreateAssetAssignmentDto,
  UpdateAssetAssignmentDto,
} from './dto/asset-assignment.dto';

@ApiTags('asset-assignments')
@ApiBearerAuth()
@Controller('asset-assignments')
export class AssetAssignmentsController {
  constructor(
    private readonly assetAssignmentsService: AssetAssignmentsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Daftar penugasan aset (filter per karyawan)' })
  @Roles('admin', 'hrd', 'owner', 'manager')
  async list(@Query(new ZodValidationPipe()) query: AssetAssignmentQueryDto) {
    return this.assetAssignmentsService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail penugasan aset' })
  @Roles('admin', 'hrd', 'owner', 'manager')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.assetAssignmentsService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tambah penugasan aset (admin/hrd/owner)' })
  @Roles('admin', 'hrd', 'owner')
  async create(@Body(new ZodValidationPipe()) dto: CreateAssetAssignmentDto) {
    return this.assetAssignmentsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui penugasan aset (admin/hrd/owner)' })
  @Roles('admin', 'hrd', 'owner')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe()) dto: UpdateAssetAssignmentDto,
  ) {
    return this.assetAssignmentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus penugasan aset (admin/hrd/owner)' })
  @Roles('admin', 'hrd', 'owner')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.assetAssignmentsService.delete(id);
  }
}
