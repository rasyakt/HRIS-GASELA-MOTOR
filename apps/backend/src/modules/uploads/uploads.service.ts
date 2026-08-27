import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { writeFile, rm, rename, mkdir } from 'fs/promises';
import { join, extname, isAbsolute } from 'path';
import { Readable } from 'stream';
import { fileTypeFromBuffer } from 'file-type';
import { sanitizeSvg } from '../../common/utils/html-sanitizer';

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
  landing: ['.jpg', '.jpeg', '.png', '.webp'], // SVG removed for security
};

const MIME_BY_EXT: Record<string, string[]> = {
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
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
  private readonly quarantineDir: string;

  constructor(private readonly config: ConfigService) {
    const dir = this.config.get<string>('uploadDir') ?? './uploads';
    this.uploadDir = isAbsolute(dir) ? dir : join(process.cwd(), dir);
    this.quarantineDir = join(this.uploadDir, 'quarantine');

    // Create directories
    mkdirSync(this.uploadDir, { recursive: true });
    mkdirSync(this.quarantineDir, { recursive: true });

    for (const c of Object.keys(ALLOWED) as UploadCategory[]) {
      mkdirSync(join(this.uploadDir, c), { recursive: true });
      mkdirSync(join(this.quarantineDir, c), { recursive: true });
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

    // SECURITY: Validate file size
    const maxBytes = MAX_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(`Ukuran file melebihi ${MAX_SIZE_MB}MB`);
    }

    // SECURITY: Validate magic numbers (file signature)
    const fileType = await fileTypeFromBuffer(file.buffer);

    if (!fileType) {
      throw new BadRequestException(
        'Tidak dapat mendeteksi tipe file. File mungkin corrupt atau tidak valid.',
      );
    }

    const expectedMimeTypes = MIME_BY_EXT[ext] || [];
    if (!expectedMimeTypes.includes(fileType.mime)) {
      this.logger.warn(
        `File signature mismatch: expected ${expectedMimeTypes.join(', ')}, got ${fileType.mime}`,
      );
      throw new BadRequestException(
        `File signature tidak cocok dengan ekstensi. Expected: ${expectedMimeTypes.join(', ')}, Got: ${fileType.mime}`,
      );
    }

    // SECURITY: Use UUID for unpredictable file names
    const fileName = `${randomUUID()}${ext}`;
    const quarantinePath = join(this.quarantineDir, category, fileName);

    // Step 1: Save to quarantine first
    await writeFile(quarantinePath, file.buffer);
    this.logger.log(
      `File quarantined: ${category}/${fileName} (${file.size} bytes)`,
    );

    // Step 2: Validate quarantined file (additional checks can be added here)
    const isClean = await this.validateQuarantinedFile(
      quarantinePath,
      file.buffer,
      ext,
    );

    if (!isClean) {
      await rm(quarantinePath, { force: true });
      throw new BadRequestException('File gagal validasi keamanan');
    }

    // Step 3: Move to production folder after validation
    const finalPath = join(this.uploadDir, category, fileName);
    await rename(quarantinePath, finalPath);

    this.logger.log(
      `Upload approved: ${category}/${fileName} (${file.size} bytes)`,
    );

    return {
      fileName: `${category}/${fileName}`,
      url: `/api/uploads/${category}/${fileName}`,
      originalName: file.originalname,
      size: file.size,
      mimeType: fileType.mime,
      category,
    };
  }

  /**
   * Validates a quarantined file
   * Add virus scanning here if ClamAV is available
   */
  private async validateQuarantinedFile(
    filePath: string,
    buffer: Buffer,
    ext: string,
  ): Promise<boolean> {
    try {
      // Basic file existence check
      if (!existsSync(filePath)) {
        this.logger.error(`Quarantined file not found: ${filePath}`);
        return false;
      }

      // TODO: Add virus scanning with ClamAV here
      // const { isInfected } = await this.clam.scanFile(filePath);
      // if (isInfected) {
      //   this.logger.error(`Virus detected in file: ${filePath}`);
      //   return false;
      // }

      // Additional validation can be added here
      // For now, we consider it clean if it passed magic number validation
      return true;
    } catch (error) {
      this.logger.error(`Error validating quarantined file: ${error}`);
      return false;
    }
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
    return MIME_BY_EXT[ext]?.[0] ?? 'application/octet-stream';
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
