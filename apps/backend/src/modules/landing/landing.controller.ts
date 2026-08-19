import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LANDING_SECTIONS, type LandingSection } from '@gasela/shared-types';
import { Public } from '../auth/decorators/public.decorator';
import { ExactRoles } from '../auth/decorators/roles.decorator';
import { LandingService } from './landing.service';
import { UpdateLandingSectionDto } from './dto/landing.dto';

@ApiTags('Landing Page')
@Controller('landing')
export class LandingController {
  constructor(private readonly landingService: LandingService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Konten landing page publik (tanpa autentikasi)' })
  getPublicContent() {
    return this.landingService.getPublicContent();
  }

  @ExactRoles('landing_admin')
  @Get('sections')
  @ApiOperation({
    summary: 'Konten landing page lengkap + meta (khusus landing_admin)',
  })
  getAdminContent() {
    return this.landingService.getAdminContent();
  }

  @ExactRoles('landing_admin')
  @Put('sections/:section')
  @ApiOperation({
    summary: 'Simpan override konten satu section (khusus landing_admin)',
  })
  updateSection(
    @Param('section', new ParseEnumPipe(LANDING_SECTIONS))
    section: LandingSection,
    @Body() body: UpdateLandingSectionDto,
  ) {
    return this.landingService.updateSection(
      section,
      body as unknown as Record<string, unknown>,
    );
  }

  @ExactRoles('landing_admin')
  @Delete('sections/:section')
  @ApiOperation({
    summary: 'Kembalikan section ke konten default (khusus landing_admin)',
  })
  resetSection(
    @Param('section', new ParseEnumPipe(LANDING_SECTIONS))
    section: LandingSection,
  ) {
    return this.landingService.resetSection(section);
  }
}
