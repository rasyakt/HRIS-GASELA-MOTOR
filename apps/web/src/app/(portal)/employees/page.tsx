'use client';

import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthApi } from '@/lib/auth-api';
import { badgeClass, fmtDate, roleAtLeast } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';

interface EmployeeRow {
  id: number;
  employeeNumber: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  employmentStatus: string;
  employmentType: string;
  joinDate: string | null;
  department?: { id: number; name: string } | null;
  position?: { id: number; name: string } | null;
}

interface EmployeePage {
  items: EmployeeRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function EmployeesPage() {
  const authApi = useAuthApi();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (user && !roleAtLeast(user.role, 'admin')) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const employees = useQuery({
    queryKey: ['employees', search, page],
    queryFn: () =>
      authApi<EmployeePage>(
        `/api/employees?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ''}`,
      ),
  });

  if (!user || !roleAtLeast(user.role, 'admin')) {
    return null;
  }

  const data = employees.data;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Karyawan</h2>
        <p className="text-sm text-zinc-500">
          Daftar karyawan aktif perusahaan.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3">
            <span>Daftar Karyawan</span>
            <Badge>{data ? `${data.total} orang` : '…'}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="mb-4 flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(searchInput.trim());
            }}
          >
            <Label htmlFor="search" className="sr-only">
              Cari karyawan
            </Label>
            <Input
              id="search"
              placeholder="Cari nama / NIK / email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="max-w-sm"
            />
            <Button type="submit" variant="outline">
              <Search data-icon="inline-start" />
              Cari
            </Button>
          </form>

          {employees.isLoading ? (
            <p className="text-sm text-zinc-400">Memuat…</p>
          ) : data && data.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                    <th className="pb-2 pr-3 font-medium">NIK</th>
                    <th className="pb-2 pr-3 font-medium">Nama</th>
                    <th className="pb-2 pr-3 font-medium">Email</th>
                    <th className="pb-2 pr-3 font-medium">Departemen</th>
                    <th className="pb-2 pr-3 font-medium">Posisi</th>
                    <th className="pb-2 pr-3 font-medium">Status</th>
                    <th className="pb-2 pr-3 font-medium">Tipe</th>
                    <th className="pb-2 font-medium">Bergabung</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((e) => (
                    <tr key={e.id} className="border-b border-zinc-100 last:border-0">
                      <td className="py-2 pr-3 font-medium text-zinc-900">
                        {e.employeeNumber}
                      </td>
                      <td className="py-2 pr-3 text-zinc-900">{e.fullName}</td>
                      <td className="py-2 pr-3 text-zinc-600">{e.email}</td>
                      <td className="py-2 pr-3 text-zinc-600">{e.department?.name ?? '—'}</td>
                      <td className="py-2 pr-3 text-zinc-600">{e.position?.name ?? '—'}</td>
                      <td className="py-2 pr-3">
                        <Badge className={badgeClass(e.employmentStatus)}>
                          {e.employmentStatus}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3">
                        <Badge className={badgeClass(e.employmentType)}>
                          {e.employmentType}
                        </Badge>
                      </td>
                      <td className="py-2 text-zinc-600">{fmtDate(e.joinDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              {search ? 'Tidak ada karyawan yang cocok.' : 'Belum ada data karyawan.'}
            </p>
          )}

          {data && data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || employees.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Sebelumnya
              </Button>
              <span className="text-xs text-zinc-500">
                Halaman {data.page} dari {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages || employees.isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Berikutnya
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
