import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PositionsService } from './positions.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreatePositionDto, UpdatePositionDto } from './dto/position.dto';

@ApiTags('Posisi')
@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar posisi aktif' })
  list() {
    return this.positionsService.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail posisi' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.positionsService.getById(id);
  }

  @Roles('admin', 'hrd')
  @Post()
  @ApiOperation({ summary: 'Buat posisi baru (admin/hrd)' })
  create(@Body() body: CreatePositionDto) {
    return this.positionsService.create(body);
  }

  @Roles('admin', 'hrd')
  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui posisi (admin/hrd)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePositionDto,
  ) {
    return this.positionsService.update(id, body);
  }

  @Roles('admin', 'hrd')
  @Delete(':id')
  @ApiOperation({ summary: 'Nonaktifkan posisi (admin/hrd, soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.positionsService.deactivate(id);
  }
}
