'use client';

import { useQuery } from '@tanstack/react-query';
import type {
  AdminDashboard,
  DashboardSummary,
  LeaveBalanceDto,
  ManagerDashboard,
  RecentAttendanceDto,
  TodayAttendanceDto,
} from '@gasela/shared-types';
import { ArrowRight, CalendarX2, Hourglass, Timer, Users } from 'lucide-react';
import Link from 'next/link';
import { useAuthApi } from '@/lib/auth-api';
import { badgeClass, fmtDate, fmtHours, fmtTime } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';

function TodayCard({ attendance }: { attendance: TodayAttendanceDto | null }) {
  if (!attendance) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-zinc-300 p-6 text-center">
        <p className="text-sm font-medium text-zinc-700">Belum ada kehadiran hari ini</p>
        <Link href="/attendance" className="text-sm text-blue-600 hover:underline">
          Lakukan check-in di halaman Kehadiran
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-zinc-500">Status</div>
          <span className={`mt-1 ${badgeClass(attendance.status)}`}>
            {attendance.status}
          </span>
        </div>
        {attendance.shiftName && (
          <div className="text-right">
            <div className="text-sm text-zinc-500">Shift</div>
            <div className="text-sm font-medium text-zinc-900">{attendance.shiftName}</div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-zinc-50 p-3">
          <div className="text-xs text-zinc-500">Check-in</div>
          <div className="text-lg font-semibold text-zinc-900">
            {fmtTime(attendance.checkInTime)}
          </div>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3">
          <div className="text-xs text-zinc-500">Check-out</div>
          <div className="text-lg font-semibold text-zinc-900">
            {fmtTime(attendance.checkOutTime)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-zinc-600">
          <Hourglass className="size-4 text-zinc-400" />
          {attendance.lateMinutes > 0
            ? `Terlambat ${attendance.lateMinutes} menit`
            : 'Tepat waktu'}
        </div>
        <div className="flex items-center gap-2 text-zinc-600">
          <Timer className="size-4 text-zinc-400" />
          Jam kerja {fmtHours(attendance.workHours)} jam
        </div>
      </div>
    </div>
  );
}

function BalancesGrid({ balances }: { balances: LeaveBalanceDto[] }) {
  if (balances.length === 0) {
    return <p className="text-sm text-zinc-500">Belum ada saldo cuti.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {balances.map((b) => (
        <div key={b.leaveTypeId} className="rounded-xl border border-zinc-200 bg-white p-3">
          <div className="text-sm font-medium text-zinc-900">{b.leaveTypeName}</div>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-2xl font-semibold text-zinc-900">{b.remaining}</span>
            <span className="text-xs text-zinc-500">sisa {b.quota}</span>
          </div>
          <div className="mt-1 text-xs text-zinc-400">terpakai {b.used}</div>
        </div>
      ))}
    </div>
  );
}

function RecentTable({ rows }: { rows: RecentAttendanceDto[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">Belum ada riwayat kehadiran.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
            <th className="pb-2 pr-3 font-medium">Tanggal</th>
            <th className="pb-2 pr-3 font-medium">Status</th>
            <th className="pb-2 pr-3 font-medium">Masuk</th>
            <th className="pb-2 pr-3 font-medium">Keluar</th>
            <th className="pb-2 font-medium">Jam Kerja</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.date} className="border-b border-zinc-100 last:border-0">
              <td className="py-2 pr-3 text-zinc-900">{fmtDate(r.date)}</td>
              <td className="py-2 pr-3">
                <span className={badgeClass(r.status)}>{r.status}</span>
              </td>
              <td className="py-2 pr-3 text-zinc-600">{fmtTime(r.checkInTime)}</td>
              <td className="py-2 pr-3 text-zinc-600">{fmtTime(r.checkOutTime)}</td>
              <td className="py-2 text-zinc-600">{fmtHours(r.workHours)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
        <h2 className="text-lg font-semibold text-zinc-900">{today}</h2>
        <p className="text-sm text-zinc-500">
          Ringkasan kehadiran, saldo cuti, dan pengajuan Anda.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 md:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">Kehadiran Hari Ini</h3>
          <TodayCard attendance={data.today.attendance} />
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-zinc-900">Pengajuan Menunggu</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <CalendarX2 className="size-4 text-amber-500" />
                <span className="text-lg font-semibold text-zinc-900">{data.pendingLeave}</span>
                <span className="text-xs text-zinc-500">cuti</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="size-4 text-blue-500" />
                <span className="text-lg font-semibold text-zinc-900">{data.pendingOvertime}</span>
                <span className="text-xs text-zinc-500">lembur</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900">Saldo Cuti</h3>
            <BalancesGrid balances={data.leaveBalances} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">Riwayat Kehadiran (7 hari terakhir)</h3>
          <Link href="/attendance" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
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
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Persetujuan Menunggu</h3>
        <Link href="/approvals" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
          {count} belum diproses <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="space-y-3 text-sm">
        {leave.slice(0, 3).map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium text-zinc-900">{r.employeeName}</div>
              <div className="text-xs text-zinc-500">
                {r.leaveTypeName} · {fmtDate(r.startDate)} – {fmtDate(r.endDate)} ({r.totalDays} hr)
              </div>
            </div>
            <span className={badgeClass('pending')}>Cuti</span>
          </div>
        ))}
        {overtime.slice(0, 3).map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium text-zinc-900">{r.employeeName}</div>
              <div className="text-xs text-zinc-500">
                {fmtDate(r.overtimeDate)} · {fmtTime(r.startTime)}–{fmtTime(r.endTime)} ({fmtHours(r.hours)} jam)
              </div>
            </div>
            <span className={badgeClass('pending')}>Lembur</span>
          </div>
        ))}
        {leave.length === 0 && overtime.length === 0 && (
          <p className="text-zinc-500">Tidak ada pengajuan menunggu.</p>
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
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900">Statistik Tim</h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((i) => (
          <div key={i.label} className="rounded-lg bg-zinc-50 p-3">
            <div className="text-2xl font-semibold text-zinc-900">{i.value}</div>
            <div className="text-xs text-zinc-500">{i.label}</div>
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
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900">Statistik Perusahaan</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((i) => (
          <div key={i.label} className="rounded-lg bg-zinc-50 p-3">
            <div className="flex items-center gap-1 text-2xl font-semibold text-zinc-900">
              {i.icon && <i.icon className="size-5 text-zinc-400" />}
              {i.value}
            </div>
            <div className="text-xs text-zinc-500">{i.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DepartmentBars({ departments }: { departments: AdminDashboard['departments'] }) {
  const max = Math.max(1, ...departments.map((d) => d.count));
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900">Sebaran Karyawan per Departemen</h3>
      {departments.length === 0 ? (
        <p className="text-sm text-zinc-500">Belum ada data departemen.</p>
      ) : (
        <div className="space-y-2">
          {departments.map((d) => (
            <div key={d.name} className="flex items-center gap-3">
              <div className="w-40 shrink-0 truncate text-sm text-zinc-700">{d.name}</div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-zinc-900"
                  style={{ width: `${Math.max(4, (d.count / max) * 100)}%` }}
                />
              </div>
              <div className="w-6 text-right text-sm font-medium text-zinc-900">{d.count}</div>
            </div>
          ))}
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
          <h1 className="text-xl font-semibold text-zinc-900">
            Selamat datang, {user.fullName}
          </h1>
          <p className="text-sm text-zinc-500">
            Ringkasan aktivitas HRIS Anda hari ini.
          </p>
        </div>
      )}

      {isLoading && (
        <p className="text-sm text-zinc-400">Memuat data dashboard…</p>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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
            <div className="space-y-4">
              <CompanyStatsGrid stats={data.stats} />
              <DepartmentBars departments={data.departments} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
