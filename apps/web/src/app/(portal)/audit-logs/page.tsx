'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Search, Loader2, Eye, Activity, Terminal, Calendar, Laptop, RefreshCw } from 'lucide-react';
import { useAuthApi } from '@/lib/auth-api';
import { fmtDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AuditItem {
  id: number;
  userId: number | null;
  username: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  payload: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
}

interface AuditStats {
  total: number;
  todayCount: number;
}

export default function AuditLogsPage() {
  const authApi = useAuthApi();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditItem | null>(null);

  const logsQuery = useQuery({
    queryKey: ['audit-logs', page, search],
    queryFn: () =>
      authApi<{ items: AuditItem[]; total: number; totalPages: number }>(
        `/api/audit-logs?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ''}`,
      ),
  });

  const statsQuery = useQuery({
    queryKey: ['audit-logs-stats'],
    queryFn: () => authApi<AuditStats>('/api/audit-logs/stats'),
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-zinc-900 p-6 text-white shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-6 text-emerald-400" />
            <h1 className="text-xl font-bold">Audit Log & Rekam Jejak Sistem</h1>
          </div>
          <p className="text-xs text-zinc-400">
            Catatan keamanan, aktivitas user, dan riwayat aksi di portal GaselaPulse HRIS.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            logsQuery.refetch();
            statsQuery.refetch();
          }}
          className="border-zinc-700 bg-zinc-800 text-xs text-white hover:bg-zinc-700 gap-1.5 shrink-0"
        >
          <RefreshCw className="size-3.5" /> Refresh Log
        </Button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-2xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Activity className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Aktivitas Hari Ini</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{statsQuery.data?.todayCount ?? '—'}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
              <Terminal className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Record Log</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{statsQuery.data?.total ?? '—'}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="shadow-2xs">
        <CardContent className="p-4 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(searchInput.trim());
            }}
            className="flex items-center gap-2"
          >
            <Input
              placeholder="Cari username / aksi / IP address..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-72 text-xs h-9"
            />
            <Button type="submit" variant="outline" size="sm" className="h-9 text-xs">
              <Search className="size-3.5 mr-1" /> Cari
            </Button>
          </form>

          {/* Log Table */}
          {logsQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-zinc-400 size-6" />
            </div>
          ) : logsQuery.data && logsQuery.data.items.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                  <tr>
                    <th className="p-3">Waktu</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Aksi</th>
                    <th className="p-3">Sumber Daya</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-900 dark:text-zinc-100">
                  {logsQuery.data.items.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 transition-colors">
                      <td className="p-3 font-mono text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{log.username || 'System / Guest'}</span>
                      </td>
                      <td className="p-3">
                        <Badge className="bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 text-[10px] font-mono">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="p-3 text-zinc-600 dark:text-zinc-300 font-mono">
                        {log.resource} {log.resourceId ? `#${log.resourceId}` : ''}
                      </td>
                      <td className="p-3 text-zinc-500 dark:text-zinc-400 font-mono">
                        {log.ipAddress || '—'}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="size-7 p-0 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                        >
                          <Eye className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-10 text-xs text-zinc-500">Tidak ada audit log yang ditemukan.</p>
          )}

          {/* Pagination */}
          {logsQuery.data && logsQuery.data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs"
              >
                Sebelumnya
              </Button>
              <span className="text-xs text-zinc-500">
                Halaman {page} dari {logsQuery.data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= logsQuery.data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs"
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Detail Payload */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Terminal className="size-4 text-emerald-600" /> Detail Rekam Jejak Audit
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-zinc-400 hover:text-zinc-700 text-sm font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                <div>
                  <span className="text-zinc-400 block font-semibold">User:</span>
                  <span className="font-semibold text-zinc-900">{selectedLog.username || 'System'}</span>
                  {selectedLog.userId && (
                    <span className="text-[10px] text-zinc-400 font-mono ml-1">(ID: {selectedLog.userId})</span>
                  )}
                </div>
                <div>
                  <span className="text-zinc-400 block font-semibold">Aksi:</span>
                  <Badge className="bg-zinc-900 text-white hover:bg-zinc-800 text-[10px] font-mono">
                    {selectedLog.action}
                  </Badge>
                </div>
                <div className="col-span-2 border-t border-zinc-100 my-1 pt-2 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-zinc-400 block font-semibold">Sumber Daya (Resource):</span>
                    <span className="font-mono text-zinc-700">
                      {selectedLog.resource} {selectedLog.resourceId ? `#${selectedLog.resourceId}` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-semibold">Waktu Kejadian:</span>
                    <span className="text-zinc-700">
                      {new Date(selectedLog.timestamp).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="text-zinc-400 block font-semibold">IP Address:</span>
                    <span className="font-mono text-zinc-700">{selectedLog.ipAddress || '—'}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-zinc-400 block font-semibold">User Agent:</span>
                    <span className="text-zinc-700 truncate block max-w-50" title={selectedLog.userAgent || ''}>
                      {selectedLog.userAgent || '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-zinc-500 font-semibold mb-1 block">Payload Data (JSON):</span>
                <pre className="max-h-48 overflow-auto rounded-lg bg-zinc-950 p-4 font-mono text-[11px] text-emerald-400">
                  {(() => {
                    if (!selectedLog.payload) return 'Tidak ada data payload (NULL)';
                    try {
                      return JSON.stringify(JSON.parse(selectedLog.payload), null, 2);
                    } catch {
                      return selectedLog.payload;
                    }
                  })()}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedLog(null)} className="text-xs">
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
