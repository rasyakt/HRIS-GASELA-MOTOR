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
import { DepartmentsService } from './departments.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@ApiTags('Departemen')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar departemen aktif' })
  list() {
    return this.departmentsService.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail departemen (termasuk hierarki)' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.getById(id);
  }

  @Roles('admin', 'hrd')
  @Post()
  @ApiOperation({ summary: 'Buat departemen baru (admin/hrd)' })
  create(@Body() body: CreateDepartmentDto) {
    return this.departmentsService.create(body);
  }

  @Roles('admin', 'hrd')
  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui departemen (admin/hrd)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, body);
  }

  @Roles('admin', 'hrd')
  @Delete(':id')
  @ApiOperation({ summary: 'Nonaktifkan departemen (admin/hrd, soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.deactivate(id);
  }
}
