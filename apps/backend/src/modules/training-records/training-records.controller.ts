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
import { TrainingRecordsService } from './training-records.service';
import {
  CreateTrainingRecordDto,
  TrainingRecordQueryDto,
  UpdateTrainingRecordDto,
} from './dto/training-record.dto';

@ApiTags('training-records')
@ApiBearerAuth()
@Controller('training-records')
export class TrainingRecordsController {
  constructor(
    private readonly trainingRecordsService: TrainingRecordsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Daftar pelatihan karyawan (filter per karyawan)' })
  @Roles('admin', 'hrd', 'owner', 'manager')
  async list(@Query(new ZodValidationPipe()) query: TrainingRecordQueryDto) {
    return this.trainingRecordsService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail pelatihan' })
  @Roles('admin', 'hrd', 'owner', 'manager')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.trainingRecordsService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tambah pelatihan (admin/hrd/owner)' })
  @Roles('admin', 'hrd', 'owner')
  async create(@Body(new ZodValidationPipe()) dto: CreateTrainingRecordDto) {
    return this.trainingRecordsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui pelatihan (admin/hrd/owner)' })
  @Roles('admin', 'hrd', 'owner')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe()) dto: UpdateTrainingRecordDto,
  ) {
    return this.trainingRecordsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus pelatihan (admin/hrd/owner)' })
  @Roles('admin', 'hrd', 'owner')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.trainingRecordsService.delete(id);
  }
}
