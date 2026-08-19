export const USER_ROLES = [
  'admin',
  'hrd',
  'manager',
  'employee',
  'owner',
  'landing_admin',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const EMPLOYMENT_STATUSES = ['active', 'probation', 'resigned', 'terminated'] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const EMPLOYMENT_TYPES = ['permanent', 'contract', 'magang'] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const FAMILY_RELATIONS = ['spouse', 'child', 'parent', 'sibling'] as const;
export type FamilyRelation = (typeof FAMILY_RELATIONS)[number];

export const GENDERS = ['male', 'female'] as const;
export type Gender = (typeof GENDERS)[number];

export const ATTENDANCE_STATUSES = [
  'present',
  'late',
  'early_leave',
  'absent',
  'leave',
  'holiday',
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const LEAVE_REQ_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'] as const;
export type LeaveReqStatus = (typeof LEAVE_REQ_STATUSES)[number];

export const OVERTIME_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type OvertimeStatus = (typeof OVERTIME_STATUSES)[number];

export const PAYROLL_STATUSES = ['draft', 'pending_approval', 'approved', 'paid'] as const;
export type PayrollStatus = (typeof PAYROLL_STATUSES)[number];

export const COMPONENT_TYPES = ['allowance', 'deduction'] as const;
export type ComponentType = (typeof COMPONENT_TYPES)[number];

export const CALCULATION_TYPES = ['fixed', 'percentage', 'formula'] as const;
export type CalculationType = (typeof CALCULATION_TYPES)[number];

export const ANNOUNCEMENT_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type AnnouncementPriority = (typeof ANNOUNCEMENT_PRIORITIES)[number];

export const TARGET_AUDIENCES = ['all', 'department', 'position', 'specific'] as const;
export type TargetAudience = (typeof TARGET_AUDIENCES)[number];

export const DOCUMENT_TYPES = [
  'ktp',
  'npwp',
  'ijazah',
  'sertifikat',
  'kontrak',
  'skck',
  'foto',
  'cv',
  'other',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const REVIEW_STATUSES = ['draft', 'submitted', 'completed'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const ASSET_STATUSES = ['assigned', 'returned'] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const TER_CATEGORIES = ['A', 'B', 'C'] as const;
export type TerCategory = (typeof TER_CATEGORIES)[number];

export const PTKP_STATUSES = ['TK0', 'TK1', 'TK2', 'TK3', 'K0', 'K1', 'K2', 'K3'] as const;
export type PtkpStatus = (typeof PTKP_STATUSES)[number];