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
import type { AuthUser } from '@gasela/shared-types';
import { WarningLettersService } from './warning-letters.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateWarningLetterDto,
  UpdateWarningLetterDto,
  WarningLetterQueryDto,
} from './dto/warning-letter.dto';

@ApiTags('Surat Peringatan (SP)')
@Controller('warning-letters')
export class WarningLettersController {
  constructor(private readonly warningLettersService: WarningLettersService) {}

  @Roles('admin', 'hrd', 'manager')
  @Get()
  @ApiOperation({ summary: 'Daftar surat peringatan (SP)' })
  list(@Query(new ZodValidationPipe()) query: WarningLetterQueryDto) {
    return this.warningLettersService.list(query);
  }

  @Get('my')
  @ApiOperation({ summary: 'Daftar surat peringatan milik saya' })
  myWarnings(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe()) query: WarningLetterQueryDto,
  ) {
    return this.warningLettersService.list({
      ...query,
      employeeId: user.employeeId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail surat peringatan' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.warningLettersService.getById(id);
  }

  @Roles('admin', 'hrd')
  @Post()
  @ApiOperation({ summary: 'Terbitkan surat peringatan (SP)' })
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe()) body: CreateWarningLetterDto,
  ) {
    return this.warningLettersService.create(body, user.employeeId);
  }

  @Roles('admin', 'hrd')
  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui surat peringatan' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe()) body: UpdateWarningLetterDto,
  ) {
    return this.warningLettersService.update(id, body);
  }

  @Roles('admin', 'hrd')
  @Delete(':id')
  @ApiOperation({ summary: 'Hapus surat peringatan' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.warningLettersService.delete(id);
  }
}
