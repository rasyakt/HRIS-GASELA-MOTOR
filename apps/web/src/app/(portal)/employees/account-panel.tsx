'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Loader2, Lock, Shield, User, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, PasswordInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthApi } from '@/lib/auth-api';
import { useAuthStore } from '@/store/auth-store';

interface UserAccount {
  id: number;
  username: string;
  role: 'admin' | 'hrd' | 'manager' | 'employee' | 'owner' | 'superadmin';
  isActive: boolean;
}

export function AccountPanel({
  employeeId,
  userAccount,
  employeeName,
}: {
  employeeId: number;
  userAccount: UserAccount | null;
  employeeName: string;
}) {
  const authApi = useAuthApi();
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const isSuperAdminAccount = userAccount?.role === 'superadmin';
  const isCurrentUserSuperadmin = currentUser?.role === 'superadmin';

  const [username, setUsername] = useState(userAccount?.username ?? '');
  const [role, setRole] = useState(userAccount?.role ?? 'employee');
  const [isActive, setIsActive] = useState(userAccount?.isActive ?? true);
  
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['employee-detail', employeeId] });
  };

  const createAccount = useMutation({
    mutationFn: () =>
      authApi(`/api/employees/${employeeId}/account`, {
        method: 'POST',
        body: JSON.stringify({ username, password, role }),
      }),
    onSuccess: () => {
      invalidate();
      setPassword('');
      setSuccess('Akun berhasil dibuat!');
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Gagal membuat akun');
      setSuccess(null);
    },
  });

  const updateAccount = useMutation({
    mutationFn: () =>
      authApi(`/api/employees/${employeeId}/account`, {
        method: 'PATCH',
        body: JSON.stringify({ username, role, isActive }),
      }),
    onSuccess: () => {
      invalidate();
      setSuccess('Akun berhasil diperbarui!');
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Gagal memperbarui akun');
      setSuccess(null);
    },
  });

  const resetPassword = useMutation({
    mutationFn: () =>
      authApi(`/api/employees/${employeeId}/account/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password: newPassword }),
      }),
    onSuccess: () => {
      setNewPassword('');
      setSuccess('Password berhasil direset!');
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Gagal mereset password');
      setSuccess(null);
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!username) return setError('Username wajib diisi');
    if (username.length < 3) return setError('Username minimal 3 karakter');
    if (!password) return setError('Password wajib diisi');
    if (password.length < 6) return setError('Password minimal 6 karakter');
    createAccount.mutate();
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!username) return setError('Username wajib diisi');
    if (username.length < 3) return setError('Username minimal 3 karakter');
    updateAccount.mutate();
  }

  function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword) return setError('Password baru wajib diisi');
    if (newPassword.length < 6) return setError('Password minimal 6 karakter');
    resetPassword.mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
          <Shield className="size-4" />
          Kredensial & Akun Pengguna
        </h4>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-600">
          {success}
        </div>
      )}

      {!userAccount ? (
        // CREATE ACCOUNT FORM
        <form onSubmit={handleCreate} className="rounded-lg border border-zinc-200 p-4 space-y-4 bg-zinc-50/50">
          <p className="text-xs text-zinc-500">
            Karyawan <strong>{employeeName}</strong> belum memiliki akun login. Gunakan form di bawah untuk membuatkannya akun baru.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="acc-username">Username</Label>
              <Input
                id="acc-username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="budi.santoso"
              />
            </div>
            <div>
              <Label htmlFor="acc-role">Peran / Hak Akses</Label>
              <select
                id="acc-role"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                <option value="employee">Karyawan (Staff/Mekanik/Sales)</option>
                <option value="manager">Manager / Supervisor</option>
                <option value="hrd">HRD / Admin Kantor</option>
                <option value="owner">Owner / Direksi</option>
                <option value="admin">Administrator IT</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="acc-password">Password Awal</Label>
            <PasswordInput
              id="acc-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
            />
          </div>
          <Button
            type="submit"
            disabled={createAccount.isPending}
          >
            {createAccount.isPending && (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            )}
            <User className="mr-1.5 size-4" />
            Buat Akun Login
          </Button>
        </form>
      ) : (
        // EDIT ACCOUNT & RESET PASSWORD
        <div className="space-y-6">
          {isSuperAdminAccount && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
              <Shield className="size-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold">Akun Permanen Developer (Superadmin)</p>
                <p className="mt-0.5 text-amber-700">
                  Akun Superadmin bersifat permanen di sistem. Peran dan status aktif akun ini dikunci serta tidak dapat dinonaktifkan demi integritas akses sistem.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleUpdate} className="rounded-lg border border-zinc-200 p-4 space-y-4 bg-white">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Pengaturan Akun</span>
              <div className="flex items-center gap-1.5">
                {isActive ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <UserCheck className="size-3.5" /> Aktif
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                    <UserX className="size-3.5" /> Nonaktif
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  disabled={isSuperAdminAccount}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="username"
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Peran / Hak Akses</Label>
                <select
                  id="edit-role"
                  disabled={isSuperAdminAccount}
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:text-zinc-500"
                >
                  {isSuperAdminAccount ? (
                    <option value="superadmin">Superadmin (Developer) — Permanen</option>
                  ) : (
                    <>
                      <option value="employee">Karyawan (Staff/Mekanik/Sales)</option>
                      <option value="manager">Manager / Supervisor</option>
                      <option value="hrd">HRD / Admin Kantor</option>
                      <option value="owner">Owner / Direksi</option>
                      <option value="admin">Administrator IT</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            {!isSuperAdminAccount && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                  />
                  <Label htmlFor="edit-active" className="cursor-pointer font-normal text-zinc-700">Akun Aktif (Dapat Login)</Label>
                </div>
              </div>
            )}

            {!isSuperAdminAccount && (
              <Button
                type="submit"
                disabled={updateAccount.isPending}
              >
                {updateAccount.isPending && (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                )}
                Simpan Perubahan Akun
              </Button>
            )}
          </form>

          {isSuperAdminAccount && !isCurrentUserSuperadmin ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600 flex items-start gap-2.5">
              <Lock className="size-4 text-zinc-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-zinc-800">Reset Kata Sandi Terkunci</p>
                <p className="mt-0.5">
                  Kata sandi akun Superadmin (Developer) bersifat rahasia dan hanya dapat diubah oleh Superadmin itu sendiri melalui halaman Profil.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleReset} className="rounded-lg border border-zinc-200 p-4 space-y-4 bg-zinc-50/50">
              <div className="pb-2 border-b border-zinc-200">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Reset Kata Sandi</span>
              </div>
              
              <div>
                <Label htmlFor="reset-pass">Password Baru</Label>
                <div className="flex gap-3 mt-1">
                  <PasswordInput
                    id="reset-pass"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="bg-white"
                  />
                  <Button
                    type="submit"
                    disabled={resetPassword.isPending}
                    className="shrink-0"
                  >
                    {resetPassword.isPending && (
                      <Loader2 className="mr-1.5 size-4 animate-spin" />
                    )}
                    <Key className="mr-1.5 size-4" />
                    Ganti Password
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
