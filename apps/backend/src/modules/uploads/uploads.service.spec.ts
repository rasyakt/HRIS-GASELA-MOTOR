import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { UploadsService } from './uploads.service';
import { ConfigService } from '@nestjs/config';

describe('UploadsService', () => {
  let service: UploadsService;

  const tmpDir = join(process.cwd(), 'uploads-test');

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UploadsService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => tmpDir) },
        },
      ],
    }).compile();
    service = module.get(UploadsService);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore file lock errors on Windows during fast teardown
    }
  });

  const fakeFile = (originalname: string, mimetype: string, size = 1024) => ({
    originalname,
    mimetype,
    size,
    buffer: Buffer.from('fake-content'),
  });

  it('menyimpan file pdf kategori document', async () => {
    const saved = await service.save(
      fakeFile('surat.pdf', 'application/pdf'),
      'document',
    );
    expect(saved.url).toMatch(/^\/api\/uploads\/document\/.+\.pdf$/);
    expect(saved.category).toBe('document');
    expect(saved.mimeType).toBe('application/pdf');
  });

  it('menyimpan file jpg kategori attendance', async () => {
    const saved = await service.save(
      fakeFile('foto.jpg', 'image/jpeg'),
      'attendance',
    );
    expect(saved.url).toMatch(/^\/api\/uploads\/attendance\/.+\.jpg$/);
  });

  it('menolak ekstensi yang tidak diizinkan', async () => {
    await expect(
      service.save(
        fakeFile('virus.exe', 'application/octet-stream'),
        'document',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('menolak MIME yang tidak cocok dengan ekstensi', async () => {
    await expect(
      service.save(fakeFile('fake.jpg', 'application/octet-stream'), 'avatar'),
    ).rejects.toThrow(BadRequestException);
  });

  it('menolak file melebihi 10MB', async () => {
    await expect(
      service.save(
        fakeFile('besar.png', 'image/png', 11 * 1024 * 1024),
        'avatar',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('mengambil file yang tersimpan', async () => {
    const saved = await service.save(
      fakeFile('ktp.pdf', 'application/pdf'),
      'document',
    );
    const path = service.getFilePath(saved.url);
    expect(path).toContain('document');
    expect(existsSync(path)).toBe(true);
  });

  it('melempar NotFound untuk path tidak valid', () => {
    expect(() => service.getFilePath('../../etc/passwd')).toThrow(
      NotFoundException,
    );
  });

  it('mengembalikan octet-stream untuk ekstensi tak dikenal', () => {
    expect(service.getMimeType('file.xyz')).toBe('application/octet-stream');
  });
});
