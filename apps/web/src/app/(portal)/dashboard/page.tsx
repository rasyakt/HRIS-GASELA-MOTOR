'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type {
  AdminDashboard,
  DashboardSummary,
  LeaveBalanceDto,
  ManagerDashboard,
  PendingApprovalLeaveDto,
  PendingApprovalOvertimeDto,
  RecentAttendanceDto,
  TodayAttendanceDto,
} from '@gasela/shared-types';
import { ArrowRight, CalendarX2, Hourglass, Timer, Users } from 'lucide-react';
import Link from 'next/link';
import { CompanyLocationMapCard } from '@/components/dashboard/CompanyLocationMapCard';
import { useAuthApi } from '@/lib/auth-api';
import { badgeClass, fmtDate, fmtHours, fmtTime, statusLabel } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';

function TodayCard({ attendance }: { attendance: TodayAttendanceDto | null }) {
  if (!attendance) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Belum ada kehadiran hari ini</p>
        <Link href="/attendance" className="text-sm text-primary hover:underline font-medium">
          Lakukan check-in di halaman Kehadiran
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Status</div>
          <span className={`mt-1 ${badgeClass(attendance.status)}`}>
            {statusLabel(attendance.status)}
          </span>
        </div>
        {attendance.shiftName && (
          <div className="text-right">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">Shift</div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{attendance.shiftName}</div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Check-in</div>
          <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {fmtTime(attendance.checkInTime)}
          </div>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Check-out</div>
          <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {fmtTime(attendance.checkOutTime)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <Hourglass className="size-4 text-zinc-400 dark:text-zinc-500" />
          {attendance.lateMinutes > 0
            ? `Terlambat ${attendance.lateMinutes} menit`
            : 'Tepat waktu'}
        </div>
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <Timer className="size-4 text-zinc-400 dark:text-zinc-500" />
          Jam kerja {fmtHours(attendance.workHours)} jam
        </div>
      </div>
    </div>
  );
}

function BalancesGrid({ balances }: { balances: LeaveBalanceDto[] }) {
  if (balances.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Belum ada saldo cuti.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {balances.map((b) => (
        <div key={b.leaveTypeId} className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/90 shadow-2xs">
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{b.leaveTypeName}</div>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{b.remaining}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">sisa {b.quota}</span>
          </div>
          <div className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">terpakai {b.used}</div>
        </div>
      ))}
    </div>
  );
}

function RecentTable({ rows }: { rows: RecentAttendanceDto[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Belum ada riwayat kehadiran.</p>;
  }
  return (
    <>
      {/* Mobile View (Cards) */}
      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {rows.map((r) => (
          <div key={r.date} className="flex flex-col gap-2 rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{fmtDate(r.date)}</span>
              <span className={badgeClass(r.status)}>{statusLabel(r.status)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-zinc-500 dark:text-zinc-400 mb-0.5">Masuk</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{fmtTime(r.checkInTime)}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400 mb-0.5">Keluar</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{fmtTime(r.checkOutTime)}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400 mb-0.5">Jam Kerja</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{fmtHours(r.workHours)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs text-zinc-500 dark:text-zinc-400">
              <th className="pb-2 pr-3 font-medium">Tanggal</th>
              <th className="pb-2 pr-3 font-medium">Status</th>
              <th className="pb-2 pr-3 font-medium">Masuk</th>
              <th className="pb-2 pr-3 font-medium">Keluar</th>
              <th className="pb-2 font-medium">Jam Kerja</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.date} className="border-b border-zinc-100 dark:border-zinc-800/80 last:border-0">
                <td className="py-2 pr-3 text-zinc-900 dark:text-zinc-100">{fmtDate(r.date)}</td>
                <td className="py-2 pr-3">
                  <span className={badgeClass(r.status)}>{statusLabel(r.status)}</span>
                </td>
                <td className="py-2 pr-3 text-zinc-600 dark:text-zinc-400">{fmtTime(r.checkInTime)}</td>
                <td className="py-2 pr-3 text-zinc-600 dark:text-zinc-400">{fmtTime(r.checkOutTime)}</td>
                <td className="py-2 text-zinc-600 dark:text-zinc-400">{fmtHours(r.workHours)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function EmployeeView({ data }: { data: DashboardSummary }) {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{today}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Ringkasan kehadiran, saldo cuti, dan pengajuan Anda.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 md:col-span-2 shadow-2xs">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Kehadiran Hari Ini</h3>
          <TodayCard attendance={data.today.attendance} />
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xs">
            <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Pengajuan Menunggu</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <CalendarX2 className="size-4 text-amber-500" />
                <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{data.pendingLeave}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">cuti</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="size-4 text-blue-500" />
                <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{data.pendingOvertime}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">lembur</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xs">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Saldo Cuti</h3>
            <BalancesGrid balances={data.leaveBalances} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xs">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Riwayat Kehadiran (7 hari terakhir)</h3>
          <Link href="/attendance" className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
            Selengkapnya <ArrowRight className="size-3" />
          </Link>
        </div>
        <RecentTable rows={data.recentAttendance} />
      </div>
    </div>
  );
}

function ApprovalsPreview({
  count,
  leave,
  overtime,
}: {
  count: number;
  leave: ManagerDashboard['approvals']['leave'];
  overtime: ManagerDashboard['approvals']['overtime'];
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xs">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Persetujuan Menunggu</h3>
        <Link href="/approvals" className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
          {count} belum diproses <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="space-y-3 text-sm">
        {leave.slice(0, 3).map((r: PendingApprovalLeaveDto) => (
          <div key={r.id} className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium text-zinc-900 dark:text-zinc-100">{r.employeeName}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {r.leaveTypeName} · {fmtDate(r.startDate)} – {fmtDate(r.endDate)} ({r.totalDays} hr)
              </div>
            </div>
            <span className={badgeClass('pending')}>Cuti</span>
          </div>
        ))}
        {overtime.slice(0, 3).map((r: PendingApprovalOvertimeDto) => (
          <div key={r.id} className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium text-zinc-900 dark:text-zinc-100">{r.employeeName}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {fmtDate(r.overtimeDate)} · {fmtTime(r.startTime)}–{fmtTime(r.endTime)} ({fmtHours(r.hours)} jam)
              </div>
            </div>
            <span className={badgeClass('pending')}>Lembur</span>
          </div>
        ))}
        {leave.length === 0 && overtime.length === 0 && (
          <p className="text-zinc-500 dark:text-zinc-400">Tidak ada pengajuan menunggu.</p>
        )}
      </div>
    </div>
  );
}

function TeamStatsCard({ team }: { team: ManagerDashboard['team'] }) {
  const items = [
    { label: 'Total Anggota', value: team.total },
    { label: 'Hadir Hari Ini', value: team.presentToday },
    { label: 'Terlambat', value: team.lateToday },
    { label: 'Cuti Hari Ini', value: team.onLeaveToday },
  ];
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xs">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Statistik Tim</h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((i) => (
          <div key={i.label} className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3">
            <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{i.value}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{i.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompanyStatsGrid({ stats }: { stats: AdminDashboard['stats'] }) {
  const items = [
    { label: 'Total Karyawan', value: stats.totalEmployees, icon: Users },
    { label: 'Karyawan Aktif', value: stats.activeEmployees, icon: Users },
    { label: 'Hadir Hari Ini', value: stats.presentToday, icon: null },
    { label: 'Terlambat', value: stats.lateToday, icon: null },
    { label: 'Absen', value: stats.absentToday, icon: null },
    { label: 'Cuti Hari Ini', value: stats.onLeaveToday, icon: null },
    { label: 'Cuti Menunggu', value: stats.pendingLeaveRequests, icon: null },
    { label: 'Lembur Menunggu', value: stats.pendingOvertimeRequests, icon: null },
    { label: 'Jam Lembur Bulan Ini', value: `${fmtHours(stats.overtimeHoursThisMonth)} jam`, icon: null },
  ];
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xs">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Statistik Perusahaan</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((i) => (
          <div key={i.label} className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3">
            <div className="flex items-center gap-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {i.icon && <i.icon className="size-5 text-zinc-400 dark:text-zinc-500" />}
              {i.value}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{i.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttendanceDonutChart({ stats }: { stats: AdminDashboard['stats'] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const data = [
    { name: 'Tepat Waktu', value: stats.presentToday, color: '#10b981' },
    { name: 'Terlambat', value: stats.lateToday, color: '#f59e0b' },
    { name: 'Cuti', value: stats.onLeaveToday, color: '#3b82f6' },
    { name: 'Absen', value: stats.absentToday, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  if (!mounted) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xs">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Analisis Kehadiran Hari Ini</h3>
        <div className="h-64 w-full bg-zinc-50 dark:bg-zinc-900 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xs">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Analisis Kehadiran Hari Ini</h3>
      {total === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Belum ada data kehadiran hari ini.</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 h-64">
          <div className="relative size-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">{total}</span>
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold mt-1">Karyawan</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-44 text-sm w-full sm:w-auto">
            {data.map((item) => {
              const percentage = Math.round((item.value / total) * 100);
              return (
                <div key={item.name} className="flex items-center justify-between gap-4 py-0.5 border-b border-zinc-50 dark:border-zinc-800/80 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-zinc-600 dark:text-zinc-300 font-medium text-xs">{item.name}</span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{item.value}</span>
                    <span className="text-zinc-400 dark:text-zinc-500 ml-1">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DepartmentChart({ departments }: { departments: AdminDashboard['departments'] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xs">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Sebaran Karyawan per Departemen</h3>
        <div className="h-64 w-full bg-zinc-50 dark:bg-zinc-900 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xs">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Sebaran Karyawan per Departemen</h3>
      {departments.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Belum ada data departemen.</p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={departments}
              layout="vertical"
              margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={85}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 p-2 shadow-md text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {payload[0].value} Karyawan
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const authApi = useAuthApi();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => authApi<DashboardSummary>('/api/dashboard/summary'),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {user && (
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Selamat datang, {user.fullName}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Ringkasan aktivitas HRIS Anda hari ini.
          </p>
        </div>
      )}

      {isLoading && (
        <p className="text-sm text-zinc-400">Memuat data dashboard…</p>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-300">
          Gagal memuat dashboard
          {error instanceof Error && error.message ? `: ${error.message}` : ''}.{' '}
          <button className="font-medium underline" onClick={() => refetch()}>
            Coba lagi
          </button>
        </div>
      )}

      {data && (
        <>
          <EmployeeView data={data} />
          {data.role === 'manager' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <ApprovalsPreview
                count={data.approvals.count}
                leave={data.approvals.leave}
                overtime={data.approvals.overtime}
              />
              <TeamStatsCard team={data.team} />
            </div>
          )}
          {data.role === 'admin' && (
            <div className="space-y-6">
              <CompanyStatsGrid stats={data.stats} />
              <CompanyLocationMapCard location={data.officeLocation} />
              <div className="grid gap-6 md:grid-cols-2">
                <AttendanceDonutChart stats={data.stats} />
                <DepartmentChart departments={data.departments} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
