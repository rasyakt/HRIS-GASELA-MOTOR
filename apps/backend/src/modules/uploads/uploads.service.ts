import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { createReadStream, existsSync, mkdirSync, rmSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join, extname, isAbsolute } from 'path';
import { Readable } from 'stream';

export type UploadCategory = 'avatar' | 'attendance' | 'document';

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
};

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

const MAX_SIZE_MB = 5;

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

  async save(file: UploadFile, category: UploadCategory  ): Promise<SavedUpload> {
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
    const expectedMime = MIME_BY_EXT[ext];
    if (file.mimetype !== expectedMime) {
      throw new BadRequestException(
        `MIME tidak cocok dengan ekstensi (diterima: ${expectedMime})`,
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
    if (!(Object.keys(ALLOWED) as string[]).includes(parts[0])) {
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
      rmSync(full, { force: true });
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
