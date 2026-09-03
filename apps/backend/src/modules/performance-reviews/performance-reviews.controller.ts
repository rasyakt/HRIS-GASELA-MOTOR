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
import { PerformanceReviewsService } from './performance-reviews.service';
import {
  CreatePerformanceReviewDto,
  PerformanceReviewQueryDto,
  UpdatePerformanceReviewDto,
} from './dto/performance-review.dto';

@ApiTags('performance-reviews')
@ApiBearerAuth()
@Controller('performance-reviews')
export class PerformanceReviewsController {
  constructor(
    private readonly performanceReviewsService: PerformanceReviewsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Daftar performance review (filter per karyawan)' })
  @Roles('admin', 'hrd', 'owner', 'manager')
  async list(
    @Query(new ZodValidationPipe()) query: PerformanceReviewQueryDto,
  ) {
    return this.performanceReviewsService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail performance review' })
  @Roles('admin', 'hrd', 'owner', 'manager')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.performanceReviewsService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Buat performance review (admin/hrd/manager)' })
  @Roles('admin', 'hrd', 'manager')
  async create(@Body(new ZodValidationPipe()) dto: CreatePerformanceReviewDto) {
    return this.performanceReviewsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui performance review (admin/hrd/manager)' })
  @Roles('admin', 'hrd', 'manager')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe()) dto: UpdatePerformanceReviewDto,
  ) {
    return this.performanceReviewsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus performance review (admin/hrd/manager)' })
  @Roles('admin', 'hrd', 'manager')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.performanceReviewsService.delete(id);
  }
}
