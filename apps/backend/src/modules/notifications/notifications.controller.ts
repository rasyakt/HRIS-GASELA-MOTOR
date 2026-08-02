import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '@gasela/shared-types';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RegisterDeviceDto } from './dto/notifications.dto';

@ApiTags('Notifikasi')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-device')
  @ApiOperation({ summary: 'Daftarkan token FCM perangkat (mobile)' })
  registerDevice(
    @CurrentUser() user: AuthUser,
    @Body() body: RegisterDeviceDto,
  ) {
    return this.notificationsService.registerDevice(
      user.employeeId,
      body.token,
      body.platform ?? 'android',
    );
  }
}
