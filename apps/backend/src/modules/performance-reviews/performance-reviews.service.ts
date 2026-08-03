import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PerformanceReview, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreatePerformanceReviewInput,
  PerformanceReviewQuery,
  UpdatePerformanceReviewInput,
} from './dto/performance-review.dto';

type ReviewWithNames = PerformanceReview & {
  employee: { fullName: string };
  reviewer: { fullName: string };
};

export interface PerformanceReviewItem {
  id: number;
  employeeId: number;
  employeeName: string;
  reviewerId: number;
  reviewerName: string;
  periodMonth: number;
  periodYear: number;
  reviewDate: Date;
  overallScore: number | null;
  strengths: string | null;
  areasForImprovement: string | null;
  goalsNextPeriod: string | null;
  status: PerformanceReview['status'];
}

@Injectable()
export class PerformanceReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private decorate(r: ReviewWithNames): PerformanceReviewItem {
    return {
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employee.fullName,
      reviewerId: r.reviewerId,
      reviewerName: r.reviewer.fullName,
      periodMonth: r.periodMonth,
      periodYear: r.periodYear,
      reviewDate: r.reviewDate,
      overallScore: r.overallScore === null ? null : Number(r.overallScore),
      strengths: r.strengths,
      areasForImprovement: r.areasForImprovement,
      goalsNextPeriod: r.goalsNextPeriod,
      status: r.status,
    };
  }

  private readonly include = {
    employee: { select: { fullName: true } },
    reviewer: { select: { fullName: true } },
  } satisfies Prisma.PerformanceReviewInclude;

  async list(query: PerformanceReviewQuery = {}): Promise<PerformanceReviewItem[]> {
    const reviews = await this.prisma.performanceReview.findMany({
      where: query.employeeId
        ? { employeeId: query.employeeId }
        : undefined,
      include: this.include,
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }, { id: 'desc' }],
    });
    return reviews.map((r) => this.decorate(r));
  }

  async getById(id: number): Promise<PerformanceReviewItem> {
    const review = await this.prisma.performanceReview.findUnique({
      where: { id },
      include: this.include,
    });
    if (!review) throw new NotFoundException('Review tidak ditemukan');
    return this.decorate(review);
  }

  async create(input: CreatePerformanceReviewInput): Promise<PerformanceReviewItem> {
    await this.assertEmployees(input.employeeId, input.reviewerId);
    const review = await this.prisma.performanceReview.create({
      data: {
        employeeId: input.employeeId,
        reviewerId: input.reviewerId,
        periodMonth: input.periodMonth,
        periodYear: input.periodYear,
        reviewDate: input.reviewDate,
        overallScore: input.overallScore ?? null,
        strengths: input.strengths ?? null,
        areasForImprovement: input.areasForImprovement ?? null,
        goalsNextPeriod: input.goalsNextPeriod ?? null,
        status: input.status ?? 'draft',
      },
      include: this.include,
    });
    return this.decorate(review);
  }

  async update(
    id: number,
    input: UpdatePerformanceReviewInput,
  ): Promise<PerformanceReviewItem> {
    const existing = await this.prisma.performanceReview.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Review tidak ditemukan');

    const employeeId = input.employeeId ?? existing.employeeId;
    const reviewerId = input.reviewerId ?? existing.reviewerId;
    await this.assertEmployees(employeeId, reviewerId);

    const review = await this.prisma.performanceReview.update({
      where: { id },
      data: {
        employeeId,
        reviewerId,
        periodMonth: input.periodMonth,
        periodYear: input.periodYear,
        reviewDate: input.reviewDate,
        overallScore: input.overallScore === undefined ? undefined : input.overallScore ?? null,
        strengths: input.strengths === undefined ? undefined : input.strengths ?? null,
        areasForImprovement:
          input.areasForImprovement === undefined
            ? undefined
            : input.areasForImprovement ?? null,
        goalsNextPeriod:
          input.goalsNextPeriod === undefined ? undefined : input.goalsNextPeriod ?? null,
        status: input.status,
      },
      include: this.include,
    });
    return this.decorate(review);
  }

  async delete(id: number): Promise<void> {
    const existing = await this.prisma.performanceReview.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Review tidak ditemukan');
    await this.prisma.performanceReview.delete({ where: { id } });
  }

  private async assertEmployees(employeeId: number, reviewerId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new BadRequestException(`Karyawan ID ${employeeId} tidak ditemukan`);
    }
    const reviewer = await this.prisma.employee.findUnique({
      where: { id: reviewerId },
    });
    if (!reviewer) {
      throw new BadRequestException(`Reviewer ID ${reviewerId} tidak ditemukan`);
    }
  }
}
