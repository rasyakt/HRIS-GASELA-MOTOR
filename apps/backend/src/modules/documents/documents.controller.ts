import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '@gasela/shared-types';
import { DocumentsService, DocumentItem } from './documents.service';
import type { CreateDocumentDto, DocumentQueryDto } from './dto/document.dto';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('my')
  @ApiOperation({ summary: 'Dokumen milik karyawan yang login' })
  @Roles('employee', 'manager')
  async my(@CurrentUser() user: AuthUser): Promise<DocumentItem[]> {
    return this.documentsService.list({ employeeId: user.employeeId });
  }

  @Get('stats')
  @ApiOperation({
    summary:
      'Ringkasan dokumen (total, kedaluwarsa, hampir kedaluwarsa 30 hari)',
  })
  @Roles('admin', 'hrd', 'owner')
  async stats(): Promise<{
    total: number;
    expired: number;
    expiring30: number;
  }> {
    return this.documentsService.stats();
  }

  @Post()
  @ApiOperation({ summary: 'Tambah dokumen karyawan' })
  @Roles('admin', 'hrd')
  async create(
    @Body(new ZodValidationPipe()) dto: CreateDocumentDto,
  ): Promise<DocumentItem> {
    return this.documentsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Daftar dokumen (filter karyawan / hampir kedaluwarsa)',
  })
  @Roles('admin', 'hrd', 'owner', 'manager')
  async list(
    @Query(new ZodValidationPipe()) query: DocumentQueryDto,
  ): Promise<DocumentItem[]> {
    return this.documentsService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail dokumen' })
  @Roles('admin', 'hrd', 'owner', 'manager')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<DocumentItem> {
    return this.documentsService.getById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus dokumen (termasuk file upload)' })
  @Roles('admin', 'hrd', 'owner')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.documentsService.delete(id);
  }
}
