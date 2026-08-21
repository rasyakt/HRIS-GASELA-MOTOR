import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { writeFile, rm } from 'fs/promises';
import { join, extname, isAbsolute } from 'path';
import { Readable } from 'stream';

export type UploadCategory = 'avatar' | 'attendance' | 'document' | 'landing';

export interface UploadFile {
  originalname: string;
  buffer: Buffer;
  size: number;
  mimetype: string;
}

const ALLOWED: Record<UploadCategory, string[]> = {
  avatar: ['.jpg', '.jpeg', '.png', '.webp'],
  attendance: ['.jpg', '.jpeg', '.png', '.webp'],
  document: ['.pdf', '.jpg', '.jpeg', '.png'],
  landing: ['.jpg', '.jpeg', '.png', '.webp', '.svg'],
};

const MIME_BY_EXT: Record<string, string[]> = {
  '.jpg': ['image/jpeg', 'image/jpg', 'image/pjpeg'],
  '.jpeg': ['image/jpeg', 'image/jpg', 'image/pjpeg'],
  '.png': ['image/png', 'image/x-png'],
  '.webp': ['image/webp'],
  '.svg': ['image/svg+xml', 'image/svg'],
  '.pdf': ['application/pdf'],
};

const MAX_SIZE_MB = 10;

export interface SavedUpload {
  fileName: string;
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
  category: UploadCategory;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadDir: string;

  constructor(private readonly config: ConfigService) {
    const dir = this.config.get<string>('uploadDir') ?? './uploads';
    this.uploadDir = isAbsolute(dir) ? dir : join(process.cwd(), dir);
    mkdirSync(this.uploadDir, { recursive: true });
    for (const c of Object.keys(ALLOWED) as UploadCategory[]) {
      mkdirSync(join(this.uploadDir, c), { recursive: true });
    }
  }

  async save(file: UploadFile, category: UploadCategory): Promise<SavedUpload> {
    if (!(category in ALLOWED)) {
      throw new BadRequestException(
        `Kategori upload tidak valid (izin: ${Object.keys(ALLOWED).join(', ')})`,
      );
    }
    const ext = extname(file.originalname).toLowerCase();
    const allowedExts = ALLOWED[category];
    if (!allowedExts.includes(ext)) {
      throw new BadRequestException(
        `Tipe file tidak diizinkan untuk kategori ${category} (izin: ${allowedExts.join(', ')})`,
      );
    }
    const expectedMimes = MIME_BY_EXT[ext] ?? [];
    if (expectedMimes.length > 0 && !expectedMimes.includes(file.mimetype) && !file.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        `MIME (${file.mimetype}) tidak cocok dengan ekstensi ${ext}`,
      );
    }
    const maxBytes = MAX_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(`Ukuran file melebihi ${MAX_SIZE_MB}MB`);
    }

    const fileName = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
    const dirPath = join(this.uploadDir, category);
    const fullPath = join(dirPath, fileName);
    await writeFile(fullPath, file.buffer);
    this.logger.log(
      `Upload tersimpan: ${category}/${fileName} (${file.size} bytes)`,
    );

    return {
      fileName: `${category}/${fileName}`,
      url: `/api/uploads/${category}/${fileName}`,
      originalName: file.originalname,
      size: file.size,
      mimeType: expectedMime,
      category,
    };
  }

  getFilePath(relative: string): string {
    const normalized = relative.replace(/\\/g, '/');
    let cleaned = normalized;
    if (/^\/?api\/uploads\/(.+)$/.test(normalized)) {
      cleaned = normalized.replace(/^\/?api\/uploads\//, '');
    } else if (normalized.startsWith('uploads/')) {
      cleaned = normalized.replace(/^uploads\//, '');
    }
    const parts = cleaned.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new NotFoundException('Path upload tidak valid');
    }
    if (!Object.keys(ALLOWED).includes(parts[0])) {
      throw new NotFoundException('Kategori upload tidak valid');
    }
    const full = join(this.uploadDir, cleaned);
    if (!full.startsWith(this.uploadDir)) {
      throw new NotFoundException('Path upload tidak valid');
    }
    if (!existsSync(full)) {
      throw new NotFoundException('File tidak ditemukan');
    }
    return full;
  }

  streamFile(relative: string): Readable {
    const full = this.getFilePath(relative);
    return createReadStream(full);
  }

  getMimeType(fileName: string): string {
    const ext = extname(fileName).toLowerCase();
    return MIME_BY_EXT[ext] ?? 'application/octet-stream';
  }

  async remove(relative: string): Promise<void> {
    try {
      const full = this.getFilePath(relative);
      await rm(full, { force: true });
      this.logger.log(`File deleted: ${relative}`);
    } catch (err) {
      if (err instanceof NotFoundException) {
        this.logger.warn(`File not found for deletion: ${relative}`);
        return;
      }
      this.logger.error(`Error deleting file ${relative}:`, err);
      throw err;
    }
  }
}
