import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ExactRoles, Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UploadsService, UploadCategory } from './uploads.service';
import type { UploadFile } from './uploads.service';
import type { CreateUploadDto } from './dto/create-upload.dto';
import { flipJpegBuffer } from '../../common/utils/face-validator.util';

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}


  @Throttle({ global: { limit: 10, ttl: 60000 } })
  @Post()
  @ApiOperation({ summary: 'Unggah file (avatar/attendance/document)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @Roles('admin', 'hrd', 'owner', 'manager', 'employee')
  @ExactRoles('landing_admin')
  async upload(
    @UploadedFile() file: UploadFile | undefined,
    @Body() dto: CreateUploadDto,
  ): Promise<{
    data: {
      fileName: string;
      url: string;
      size: number;
      category: UploadCategory;
    };
  }> {
    if (!file) {
      throw new BadRequestException('File wajib diisi (field: file)');
    }
    const saved = await this.uploadsService.save(file, dto.category);
    return {
      data: {
        fileName: saved.fileName,
        url: saved.url,
        size: saved.size,
        category: saved.category,
      },
    };
  }

  @Public()
  @Throttle({ global: { limit: 120, ttl: 60000 } })
  @Post('verify-face')
  @ApiOperation({ summary: 'Verifikasi instan wajah dari buffer foto atau base64' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  verifyFace(
    @UploadedFile() file: UploadFile | undefined,
    @Body() body: { imageBase64?: string },
  ) {
    let buffer: Buffer | null = null;
    if (file?.buffer) {
      buffer = file.buffer;
    } else if (body?.imageBase64) {
      const cleanBase64 = body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(cleanBase64, 'base64');
    }

    if (!buffer) {
      throw new BadRequestException('Foto wajib dikirim via multipart atau imageBase64');
    }

    const result = this.uploadsService.checkFace(buffer);
    return {
      data: result,
    };
  }

  @Throttle({ global: { limit: 60, ttl: 60000 } })
  @Post('base64')
  @ApiOperation({ summary: 'Unggah file via base64 JSON (mobile cross-platform)' })
  @Roles('admin', 'hrd', 'owner', 'manager', 'employee')
  async uploadBase64(
    @Body()
    dto: {
      imageBase64: string;
      category: UploadCategory;
      fileName?: string;
      flipHorizontal?: boolean;
    },
  ) {
    if (!dto?.imageBase64) {
      throw new BadRequestException('imageBase64 wajib diisi');
    }
    const cleanBase64 = dto.imageBase64.replace(/^data:image\/\w+;base64,/, '');
    let buffer: Buffer = Buffer.from(cleanBase64, 'base64');
    if (dto.flipHorizontal) {
      buffer = flipJpegBuffer(buffer);
    }
    const fakeFile: UploadFile = {
      originalname: dto.fileName || `attendance_${Date.now()}.jpg`,
      buffer: buffer as any,
      size: buffer.length,
      mimetype: 'image/jpeg',
    };
    const saved = await this.uploadsService.save(fakeFile, dto.category);
    return {
      data: {
        fileName: saved.fileName,
        url: saved.url,
        size: saved.size,
        category: saved.category,
      },
    };
  }

  @Public()
  @Get('landing/:fileName')
  @ApiOperation({ summary: 'Ambil aset landing page (publik, cache 24 jam)' })
  getLandingFile(
    @Param('fileName') fileName: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    const stream = this.uploadsService.streamFile(`landing/${fileName}`);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return new StreamableFile(stream, {
      type: this.uploadsService.getMimeType(fileName),
    });
  }

  @Public()
  @Get(':category/:fileName')
  @ApiOperation({ summary: 'Ambil file yang diunggah (publik via UUID, cache 1 jam)' })
  getFile(
    @Param('category') category: string,
    @Param('fileName') fileName: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    const stream = this.uploadsService.streamFile(`${category}/${fileName}`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return new StreamableFile(stream, {
      type: this.uploadsService.getMimeType(fileName),
    });
  }

  @Roles('admin', 'superadmin', 'hrd', 'owner')
  @Get('worker-pool/status')
  @ApiOperation({
    summary: 'Status Worker Pool face detection — monitoring kapasitas concurrent absensi',
  })
  workerPoolStatus() {
    return { data: this.uploadsService.workerPoolStatus() };
  }
}

