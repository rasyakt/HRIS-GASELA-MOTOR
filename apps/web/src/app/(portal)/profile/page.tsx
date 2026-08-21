'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  User, 
  Lock, 
  Key, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Building2, 
  Briefcase, 
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useAuthApi } from '@/lib/auth-api';
import { Button } from '@/components/ui/button';
import { Input, PasswordInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { badgeClass, fmtDate } from '@/lib/format';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const authApi = useAuthApi();

  // Change Password Form States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Query self employee details
  const employeeQuery = useQuery({
    queryKey: ['my-employee', user?.employeeId],
    queryFn: () => authApi<any>(`/api/employees/${user?.employeeId}`),
    enabled: !!user?.employeeId,
  });

  // Query self leave balances
  const leaveBalancesQuery = useQuery({
    queryKey: ['my-leave-balances'],
    queryFn: () => authApi<any[]>('/api/leaves/balances/my'),
  });

  // Change Password Mutation
  const changePasswordMut = useMutation({
    mutationFn: (body: any) => 
      authApi('/api/auth/change-password', {
        method: 'POST',
        body,
      }),
    onSuccess: () => {
      setSuccessMsg('Password Anda berhasil diperbarui.');
      setErrorMsg('');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Gagal memperbarui password.');
      setSuccessMsg('');
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMsg('Semua kolom password wajib diisi.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('Password baru minimal harus 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password baru tidak cocok.');
      return;
    }
    changePasswordMut.mutate({
      oldPassword,
      newPassword,
    });
  };

  if (!user) return null;

  const emp = employeeQuery.data;

  return (
    <div className="space-y-6">
      {/* Upper Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-zinc-900 p-6 text-white shadow-md lg:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/10 text-xl font-bold text-white uppercase border border-white/20">
              {user.fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <h2 className="text-xl font-bold lg:text-2xl">{user.fullName}</h2>
              <p className="text-sm text-zinc-300">
                NIK: {emp?.employeeNumber ?? '—'} · Username: {user.username}
              </p>
            </div>
          </div>
          <div>
            <Badge className="bg-zinc-800 text-zinc-200 border-zinc-700 capitalize py-1 px-3">
              Role: {user.role}
            </Badge>
          </div>
        </div>
        <div className="absolute right-0 top-0 -mr-6 -mt-6 size-48 rounded-full bg-white/3 blur-3xl pointer-events-none" />
      </div>

      {employeeQuery.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-zinc-500 size-8" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Columns - Info Cards */}
          <div className="space-y-6 lg:col-span-2">
            {/* Personal Details */}
            <Card className="shadow-2xs">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
                  <User className="size-4.5 text-zinc-500 dark:text-zinc-400" />
                  Informasi Pribadi Karyawan
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Nama Lengkap</Label>
                  <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{emp?.fullName ?? '—'}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Nomor Induk Karyawan (NIK)</Label>
                  <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{emp?.employeeNumber ?? '—'}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Email Pribadi</Label>
                  <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    <Mail className="size-4 text-zinc-400 dark:text-zinc-500" />
                    <span>{emp?.email ?? '—'}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Nomor Telepon</Label>
                  <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    <Phone className="size-4 text-zinc-400 dark:text-zinc-500" />
                    <span>{emp?.phone ?? '—'}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Tanggal Lahir</Label>
                  <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    <Calendar className="size-4 text-zinc-400 dark:text-zinc-500" />
                    <span>{fmtDate(emp?.birthDate)}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Nomor KTP (ID Card)</Label>
                  <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{emp?.idCardNumber ?? '—'}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">NPWP (Nomor Pajak)</Label>
                  <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{emp?.taxNumber ?? '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Alamat Domisili</Label>
                  <div className="mt-1 flex gap-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    <MapPin className="size-4 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                    <span>{emp?.address ?? '—'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employment and Bank Details */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Job Info */}
              <Card className="shadow-2xs">
                <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
                    <Briefcase className="size-4.5 text-zinc-500 dark:text-zinc-400" />
                    Informasi Pekerjaan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div>
                    <Label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Departemen</Label>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{emp?.department?.name ?? '—'}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Posisi / Jabatan</Label>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{emp?.position?.name ?? '—'}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Status & Tipe Kerja</Label>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      <Badge className={`${badgeClass(emp?.employmentStatus)} border-0`}>
                        {emp?.employmentStatus}
                      </Badge>
                      <Badge className={`${badgeClass(emp?.employmentType)} border-0`}>
                        {emp?.employmentType}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Tanggal Bergabung</Label>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{fmtDate(emp?.joinDate)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Bank Info */}
              <Card className="shadow-2xs">
                <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
                    <CreditCard className="size-4.5 text-zinc-500 dark:text-zinc-400" />
                    Rekening Bank
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div>
                    <Label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Nama Bank</Label>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{emp?.bankName ?? '—'}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Nama Pemilik Rekening</Label>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{emp?.bankAccountName ?? '—'}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Nomor Rekening</Label>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-wider">
                      {emp?.bankAccountNumber ?? '—'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Leave Balances Card */}
            <Card className="shadow-2xs">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
                  <Calendar className="size-4.5 text-emerald-600 dark:text-emerald-400" />
                  Saldo & Kuota Cuti Anda ({new Date().getFullYear()})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {leaveBalancesQuery.isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="animate-spin text-zinc-400 size-5" />
                  </div>
                ) : leaveBalancesQuery.data && leaveBalancesQuery.data.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {leaveBalancesQuery.data.map((bal: any) => (
                      <div key={bal.leaveTypeId} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{bal.leaveType?.name ?? 'Cuti'}</span>
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px]">
                            Sisa {bal.remaining} Hari
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                          <span>Kuota: {bal.quota} Hari</span>
                          <span>Terpakai: {bal.used} Hari</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, ((bal.used || 0) / (bal.quota || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-2">Belum ada data kuota cuti tercatat untuk tahun ini.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Change Password */}
          <div>
            <Card className="shadow-2xs border-zinc-200 dark:border-zinc-800">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
                  <Lock className="size-4.5 text-zinc-500 dark:text-zinc-400" />
                  Keamanan & Ganti Password
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {successMsg && (
                    <div className="flex gap-2 items-start rounded-lg bg-green-50 dark:bg-green-950/40 p-3 text-xs font-semibold text-green-800 dark:text-green-300 border border-green-200 dark:border-green-900/50">
                      <CheckCircle2 className="size-4 shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="flex gap-2 items-start rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/50">
                      <AlertCircle className="size-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="old-pass">Password Lama</Label>
                    <PasswordInput
                      id="old-pass"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Masukkan password saat ini"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="new-pass">Password Baru</Label>
                    <PasswordInput
                      id="new-pass"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirm-pass">Konfirmasi Password Baru</Label>
                    <PasswordInput
                      id="confirm-pass"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      className="mt-1"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={changePasswordMut.isPending}
                    className="w-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 font-semibold"
                  >
                    {changePasswordMut.isPending ? (
                      <>
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                        Memproses…
                      </>
                    ) : (
                      <>
                        <Key className="mr-1.5 size-4" />
                        Perbarui Password
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
