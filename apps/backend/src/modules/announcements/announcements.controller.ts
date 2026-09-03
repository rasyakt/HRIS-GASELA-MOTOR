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
import { AnnouncementsService } from './announcements.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  AnnouncementQueryDto,
  CreateAnnouncementDto,
  MarkAnnouncementReadDto,
  UpdateAnnouncementDto,
} from './dto/announcement.dto';

@ApiTags('Pengumuman')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Roles('admin', 'hrd')
  @Post()
  @ApiOperation({ summary: 'Buat pengumuman draft (admin/hrd)' })
  create(@CurrentUser() user: AuthUser, @Body() body: CreateAnnouncementDto) {
    return this.announcementsService.create(user.employeeId, body);
  }

  @Roles('admin', 'hrd')
  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui pengumuman (admin/hrd)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(id, body);
  }

  @Roles('admin', 'hrd')
  @Post(':id/publish')
  @ApiOperation({
    summary:
      'Publikasikan pengumuman + kirim push notification (admin/hrd)',
  })
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.publish(id);
  }

  @Roles('admin', 'hrd')
  @Delete(':id')
  @ApiOperation({ summary: 'Hapus pengumuman (admin/hrd)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.remove(id);
  }

  @Roles('admin', 'hrd', 'owner')
  @Get()
  @ApiOperation({ summary: 'Semua pengumuman (admin/hrd/owner, pagination)' })
  list(@Query(new ZodValidationPipe()) query: AnnouncementQueryDto) {
    return this.announcementsService.list(query);
  }

  @Get('my')
  @ApiOperation({ summary: 'Pengumuman untuk saya (publik & sesuai target)' })
  myList(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe()) query: AnnouncementQueryDto,
  ) {
    return this.announcementsService.myList(user.employeeId, query);
  }

  @Post('read')
  @ApiOperation({ summary: 'Tandai pengumuman sudah dibaca' })
  markRead(
    @CurrentUser() user: AuthUser,
    @Body() body: MarkAnnouncementReadDto,
  ) {
    return this.announcementsService.markRead(
      user.employeeId,
      body.announcementId,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Jumlah pengumuman belum dibaca untuk saya' })
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.announcementsService.unreadCount(user.employeeId);
  }
}
