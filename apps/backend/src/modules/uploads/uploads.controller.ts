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
import { Roles } from '../auth/decorators/roles.decorator';
import { UploadsService, UploadCategory } from './uploads.service';
import type { UploadFile } from './uploads.service';
import type { CreateUploadDto } from './dto/create-upload.dto';

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

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

  @Get(':category/:fileName')
  @ApiOperation({ summary: 'Ambil file yang diunggah (auth, cache 1 jam)' })
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
}
