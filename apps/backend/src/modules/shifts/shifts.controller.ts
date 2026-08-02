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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateShiftDto, UpdateShiftDto } from './dto/shift.dto';

@ApiTags('Shift')
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar shift aktif (baca: semua yang login)' })
  list(
    @Query(new ZodValidationPipe())
    query: {
      includeInactive?: 'true' | 'false';
    },
  ) {
    return this.shiftsService.list(query.includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail shift' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.shiftsService.getById(id);
  }

  @Roles('admin', 'hrd')
  @Post()
  @ApiOperation({ summary: 'Buat shift (admin/hrd)' })
  create(@Body() body: CreateShiftDto) {
    return this.shiftsService.create(body);
  }

  @Roles('admin', 'hrd')
  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui shift (admin/hrd)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateShiftDto) {
    return this.shiftsService.update(id, body);
  }

  @Roles('admin', 'hrd')
  @Delete(':id')
  @ApiOperation({ summary: 'Nonaktifkan shift (admin/hrd)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.shiftsService.deactivate(id);
  }
}
