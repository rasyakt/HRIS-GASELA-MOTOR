import { z } from 'zod';
import { ASSET_STATUSES, REVIEW_STATUSES } from './enums';

// ===================== PERFORMANCE REVIEW =====================
export const createPerformanceReviewSchema = z.object({
  employeeId: z.number().int().positive(),
  reviewerId: z.number().int().positive(),
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2000).max(2100),
  reviewDate: z.coerce.date(),
  overallScore: z.number().min(0).max(100).nullish(),
  strengths: z.string().max(5000).nullish(),
  areasForImprovement: z.string().max(5000).nullish(),
  goalsNextPeriod: z.string().max(5000).nullish(),
  status: z.enum(REVIEW_STATUSES).default('draft'),
});

export const updatePerformanceReviewSchema = createPerformanceReviewSchema.partial();

export const performanceReviewQuerySchema = z.object({
  employeeId: z.coerce.number().int().positive().optional(),
});

export type CreatePerformanceReviewInput = z.infer<
  typeof createPerformanceReviewSchema
>;
export type UpdatePerformanceReviewInput = z.infer<
  typeof updatePerformanceReviewSchema
>;
export type PerformanceReviewQuery = z.infer<
  typeof performanceReviewQuerySchema
>;

export const performanceReviewDtoSchema = z.object({
  id: z.number(),
  employeeId: z.number(),
  employeeName: z.string().nullable(),
  reviewerId: z.number(),
  reviewerName: z.string().nullable(),
  periodMonth: z.number(),
  periodYear: z.number(),
  reviewDate: z.string(),
  overallScore: z.number().nullable(),
  strengths: z.string().nullable(),
  areasForImprovement: z.string().nullable(),
  goalsNextPeriod: z.string().nullable(),
  status: z.enum(REVIEW_STATUSES),
});
export type PerformanceReviewDto = z.infer<typeof performanceReviewDtoSchema>;

// ===================== TRAINING RECORD =====================
export const createTrainingRecordSchema = z.object({
  employeeId: z.number().int().positive(),
  trainingName: z.string().min(1).max(200),
  trainingProvider: z.string().max(200).nullish(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  durationHours: z.number().int().min(0).max(10000).nullish(),
  certificateUrl: z.string().max(255).nullish(),
  cost: z.number().min(0).nullish(),
  notes: z.string().max(5000).nullish(),
});

export const updateTrainingRecordSchema = createTrainingRecordSchema.partial();

export const trainingRecordQuerySchema = z.object({
  employeeId: z.coerce.number().int().positive().optional(),
});

export type CreateTrainingRecordInput = z.infer<
  typeof createTrainingRecordSchema
>;
export type UpdateTrainingRecordInput = z.infer<
  typeof updateTrainingRecordSchema
>;
export type TrainingRecordQuery = z.infer<typeof trainingRecordQuerySchema>;

export const trainingRecordDtoSchema = z.object({
  id: z.number(),
  employeeId: z.number(),
  employeeName: z.string().nullable(),
  trainingName: z.string(),
  trainingProvider: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  durationHours: z.number().nullable(),
  certificateUrl: z.string().nullable(),
  cost: z.number().nullable(),
  notes: z.string().nullable(),
});
export type TrainingRecordDto = z.infer<typeof trainingRecordDtoSchema>;

// ===================== ASSET ASSIGNMENT =====================
export const createAssetAssignmentSchema = z.object({
  employeeId: z.number().int().positive(),
  assetName: z.string().min(1).max(100),
  assetCode: z.string().min(1).max(50),
  serialNumber: z.string().max(100).nullish(),
  assignmentDate: z.coerce.date(),
  returnDate: z.coerce.date().nullish(),
  status: z.enum(ASSET_STATUSES).default('assigned'),
  conditionNotes: z.string().max(2000).nullish(),
});

export const updateAssetAssignmentSchema = createAssetAssignmentSchema.partial();

export const assetAssignmentQuerySchema = z.object({
  employeeId: z.coerce.number().int().positive().optional(),
});

export type CreateAssetAssignmentInput = z.infer<
  typeof createAssetAssignmentSchema
>;
export type UpdateAssetAssignmentInput = z.infer<
  typeof updateAssetAssignmentSchema
>;
export type AssetAssignmentQuery = z.infer<typeof assetAssignmentQuerySchema>;

export const assetAssignmentDtoSchema = z.object({
  id: z.number(),
  employeeId: z.number(),
  employeeName: z.string().nullable(),
  assetName: z.string(),
  assetCode: z.string(),
  serialNumber: z.string().nullable(),
  assignmentDate: z.string(),
  returnDate: z.string().nullable(),
  status: z.enum(ASSET_STATUSES),
  conditionNotes: z.string().nullable(),
});
export type AssetAssignmentDto = z.infer<typeof assetAssignmentDtoSchema>;
