import type { AttendanceStatus } from './enums';
import type { LeaveBalanceDto } from './leave-request.schema';

export interface TodayAttendanceDto {
  status: AttendanceStatus | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  lateMinutes: number;
  workHours: number;
  shiftName: string | null;
  shiftStartTime?: string | null;
  shiftEndTime?: string | null;
  earliestCheckoutTime?: string | null;
  canCheckoutNow?: boolean;
}

export interface RecentAttendanceDto {
  date: string;
  status: AttendanceStatus;
  checkInTime: string | null;
  checkOutTime: string | null;
  workHours: number;
}

export interface EmployeeDashboard {
  role: 'employee';
  today: { date: string; attendance: TodayAttendanceDto | null };
  leaveBalances: LeaveBalanceDto[];
  pendingLeave: number;
  pendingOvertime: number;
  recentAttendance: RecentAttendanceDto[];
}

export interface PendingApprovalLeaveDto {
  id: number;
  requestNumber: string;
  employeeName: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
}

export interface PendingApprovalOvertimeDto {
  id: number;
  requestNumber: string;
  employeeName: string;
  overtimeDate: string;
  startTime: string;
  endTime: string;
  hours: number;
}

export interface TeamStatsDto {
  total: number;
  presentToday: number;
  lateToday: number;
  onLeaveToday: number;
}

export interface ManagerDashboard extends Omit<EmployeeDashboard, 'role'> {
  role: 'manager';
  approvals: {
    count: number;
    leave: PendingApprovalLeaveDto[];
    overtime: PendingApprovalOvertimeDto[];
  };
  team: TeamStatsDto;
}

export interface CompanyStatsDto {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  onLeaveToday: number;
  pendingLeaveRequests: number;
  pendingOvertimeRequests: number;
  overtimeHoursThisMonth: number;
}

export interface DepartmentCountDto {
  name: string;
  count: number;
}

export interface OfficeLocationDto {
  lat: number;
  lng: number;
  radiusMeters: number;
  companyName: string;
}

export interface AdminDashboard extends Omit<EmployeeDashboard, 'role'> {
  role: 'admin';
  stats: CompanyStatsDto;
  departments: DepartmentCountDto[];
  officeLocation: OfficeLocationDto | null;
}

export type DashboardSummary =
  | EmployeeDashboard
  | ManagerDashboard
  | AdminDashboard;

