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

  @Get('active')
  @ApiOperation({ summary: 'Daftar aset yang sedang dipinjam (status: assigned)' })
  @Roles('admin', 'hrd', 'owner', 'manager')
  async listActive() {
    return this.assetAssignmentsService.listActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail penugasan aset' })
  @Roles('admin', 'hrd', 'owner', 'manager')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.assetAssignmentsService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tambah penugasan aset (admin/hrd)' })
  @Roles('admin', 'hrd')
  async create(@Body(new ZodValidationPipe()) dto: CreateAssetAssignmentDto) {
    return this.assetAssignmentsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui penugasan aset (admin/hrd)' })
  @Roles('admin', 'hrd')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe()) dto: UpdateAssetAssignmentDto,
  ) {
    return this.assetAssignmentsService.update(id, dto);
  }

  @Patch(':id/return')
  @ApiOperation({ summary: 'Kembalikan aset (tandai status returned dengan tanggal hari ini)' })
  @Roles('admin', 'hrd')
  async returnAsset(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { conditionNotes?: string },
  ) {
    return this.assetAssignmentsService.returnAsset(id, body.conditionNotes);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus penugasan aset (admin/hrd)' })
  @Roles('admin', 'hrd')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.assetAssignmentsService.delete(id);
  }
}
