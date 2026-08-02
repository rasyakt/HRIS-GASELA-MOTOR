import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('HealthService', () => {
  let service: HealthService;

  const prismaMock = {
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('mengembalikan status ok saat database up', async () => {
    const result = await service.check();
    expect(result.status).toBe('ok');
    expect(result.db).toBe('up');
  });

  it('mengembalikan degraded saat database down', async () => {
    prismaMock.$queryRaw.mockRejectedValueOnce(new Error('connection refused'));
    const result = await service.check();
    expect(result.status).toBe('degraded');
    expect(result.db).toBe('down');
  });
});
