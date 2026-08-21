'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, Loader2, PlusCircle, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthApi } from '@/lib/auth-api';
import { fmtDate, fmtDateTime, roleAtLeast } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';
import type { AnnouncementDto, AnnouncementListDto } from '@gasela/shared-types';

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Rendah',
  normal: 'Normal',
  high: 'Tinggi',
  urgent: 'Mendesak',
};

const PRIORITY_CLASS: Record<string, string> = {
  low: 'bg-zinc-100 text-zinc-600',
  normal: 'bg-sky-100 text-sky-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700',
};

const TARGET_LABEL: Record<string, string> = {
  all: 'Semua',
  department: 'Per Departemen',
  position: 'Per Posisi',
  specific: 'Karyawan Tertentu',
};

interface DepartmentItem {
  id: number;
  name: string;
}

interface PositionItem {
  id: number;
  name: string;
}

interface EmployeeItem {
  id: number;
  fullName: string;
  employeeNumber: string;
}

function CreateForm({ onDone }: { onDone: () => void }) {
  const authApi = useAuthApi();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [targetAudience, setTargetAudience] = useState('all');
  const [targetDepartmentId, setTargetDepartmentId] = useState('');
  const [targetPositionId, setTargetPositionId] = useState('');
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [publishDate, setPublishDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [expiryDate, setExpiryDate] = useState('');

  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: () => authApi<DepartmentItem[]>('/api/departments'),
  });
  const positions = useQuery({
    queryKey: ['positions'],
    queryFn: () => authApi<PositionItem[]>('/api/positions'),
  });
  const employees = useQuery({
    queryKey: ['employees-light'],
    queryFn: () =>
      authApi<{ items: EmployeeItem[] }>('/api/employees?limit=100'),
  });

  const create = useMutation({
    mutationFn: () =>
      authApi<AnnouncementDto>('/api/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title,
          content,
          priority,
          targetAudience,
          targetDepartmentId: targetDepartmentId
            ? Number(targetDepartmentId)
            : undefined,
          targetPositionId: targetPositionId ? Number(targetPositionId) : undefined,
          targetEmployeeId: targetEmployeeId ? Number(targetEmployeeId) : undefined,
          publishDate,
          expiryDate: expiryDate || undefined,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      qc.invalidateQueries({ queryKey: ['announcements-my'] });
      qc.invalidateQueries({ queryKey: ['announcements-unread'] });
      setTitle('');
      setContent('');
      setPriority('normal');
      setTargetAudience('all');
      setTargetDepartmentId('');
      setTargetPositionId('');
      setTargetEmployeeId('');
      setExpiryDate('');
      onDone();
    },
  });

  const needsDept = targetAudience === 'department';
  const needsPos = targetAudience === 'position';
  const needsEmp = targetAudience === 'specific';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buat Pengumuman</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="ann-title">Judul</Label>
          <Input
            id="ann-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul pengumuman"
            maxLength={200}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ann-content">Isi</Label>
          <textarea
            id="ann-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Isi pengumuman…"
            rows={4}
            maxLength={5000}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="ann-priority">Prioritas</Label>
            <select
              id="ann-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
            >
              {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ann-audience">Target</Label>
            <select
              id="ann-audience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
            >
              {Object.entries(TARGET_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ann-publish">Tanggal Tayang</Label>
            <Input
              id="ann-publish"
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ann-expiry">Kadaluarsa</Label>
            <Input
              id="ann-expiry"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
        </div>

        {needsDept && (
          <div className="space-y-1">
            <Label htmlFor="ann-dept">Departemen</Label>
            <select
              id="ann-dept"
              value={targetDepartmentId}
              onChange={(e) => setTargetDepartmentId(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
            >
              <option value="">— Pilih departemen —</option>
              {(departments.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {needsPos && (
          <div className="space-y-1">
            <Label htmlFor="ann-pos">Posisi</Label>
            <select
              id="ann-pos"
              value={targetPositionId}
              onChange={(e) => setTargetPositionId(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
            >
              <option value="">— Pilih posisi —</option>
              {(positions.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {needsEmp && (
          <div className="space-y-1">
            <Label htmlFor="ann-emp">Karyawan</Label>
            <select
              id="ann-emp"
              value={targetEmployeeId}
              onChange={(e) => setTargetEmployeeId(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
            >
              <option value="">— Pilih karyawan —</option>
              {(employees.data?.items ?? []).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.employeeNumber} — {e.fullName}
                </option>
              ))}
            </select>
          </div>
        )}

        <Button
          onClick={() => create.mutate()}
          disabled={create.isPending || !title.trim() || content.trim().length < 10}
        >
          {create.isPending ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <PlusCircle data-icon="inline-start" />
          )}
          Simpan Draft
        </Button>
        {create.isError && (
          <p className="text-sm text-red-600">
            {create.error instanceof Error
              ? create.error.message
              : 'Gagal menyimpan pengumuman'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AnnouncementCard({
  item,
  onPublish,
  onDelete,
  onMarkRead,
  canManage,
}: {
  item: AnnouncementDto;
  onPublish?: () => void;
  onDelete?: () => void;
  onMarkRead?: () => void;
  canManage: boolean;
}) {
  const [showFull, setShowFull] = useState(false);
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/90 shadow-2xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={PRIORITY_CLASS[item.priority]}>
              {PRIORITY_LABEL[item.priority] ?? item.priority}
            </Badge>
            <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {TARGET_LABEL[item.targetAudience] ?? item.targetAudience}
            </Badge>
            {!item.isPublished && (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">Draft</Badge>
            )}
            {item.isPublished && item.isRead === false && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">Baru</Badge>
            )}
          </div>
          <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-white">{item.title}</h3>
          <p
            className={`mt-1 text-sm whitespace-pre-wrap text-zinc-600 dark:text-zinc-300 ${
              showFull ? '' : 'line-clamp-3'
            }`}
          >
            {item.content}
          </p>
          <button
            type="button"
            onClick={() => setShowFull((v) => !v)}
            className="mt-1 text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            {showFull ? 'Sembunyikan' : 'Selengkapnya'}
          </button>
          <div className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            Tayang {fmtDate(item.publishDate)}
            {item.expiryDate ? ` · s/d ${fmtDate(item.expiryDate)}` : ''} ·{' '}
            {fmtDateTime(item.createdAt)} · oleh {item.createdByName ?? '—'}
            {canManage && item.readCount !== undefined && ` · ${item.readCount} dibaca`}
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          {canManage && !item.isPublished && onPublish && (
            <Button size="sm" onClick={onPublish}>
              <Send data-icon="inline-start" />
              Publikasikan
            </Button>
          )}
          {canManage && onDelete && (
            <Button size="sm" variant="outline" onClick={onDelete}>
              <Trash2 data-icon="inline-start" />
              Hapus
            </Button>
          )}
          {!canManage && item.isPublished && item.isRead === false && onMarkRead && (
            <Button size="sm" variant="outline" onClick={onMarkRead}>
              <CheckCheck data-icon="inline-start" />
              Tandai Dibaca
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const authApi = useAuthApi();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [justCreated, setJustCreated] = useState('');

  const isAdmin = !!user && roleAtLeast(user.role, 'admin');

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (isAdmin && status !== 'all') params.set('status', status);

  const list = useQuery({
    queryKey: ['announcements', isAdmin ? 'admin' : 'my', status, page],
    queryFn: () =>
      authApi<AnnouncementListDto>(
        isAdmin
          ? `/api/announcements?${params}`
          : `/api/announcements/my?page=${page}&limit=20`,
      ),
  });

  const unread = useQuery({
    queryKey: ['announcements-unread'],
    queryFn: () => authApi<{ unread: number }>('/api/announcements/unread-count'),
  });

  const publish = useMutation({
    mutationFn: (id: number) =>
      authApi(`/api/announcements/${id}/publish`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      qc.invalidateQueries({ queryKey: ['announcements-my'] });
      qc.invalidateQueries({ queryKey: ['announcements-unread'] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) =>
      authApi(`/api/announcements/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      qc.invalidateQueries({ queryKey: ['announcements-my'] });
      qc.invalidateQueries({ queryKey: ['announcements-unread'] });
    },
  });

  const markRead = useMutation({
    mutationFn: (id: number) =>
      authApi('/api/announcements/read', {
        method: 'POST',
        body: JSON.stringify({ announcementId: id }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements-my'] });
      qc.invalidateQueries({ queryKey: ['announcements-unread'] });
    },
  });

  if (!user) return null;
  const data = list.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Pengumuman</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {isAdmin
              ? 'Kelola pengumuman untuk seluruh karyawan.'
              : `Ada ${unread.data?.unread ?? 0} pengumuman baru belum dibaca.`}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreate((v) => !v)}>
            <PlusCircle data-icon="inline-start" />
            {showCreate ? 'Tutup Form' : 'Buat Pengumuman'}
          </Button>
        )}
      </div>

      {justCreated && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Pengumuman “{justCreated}” disimpan sebagai draft. Publikasikan agar
          tampil ke karyawan.
        </div>
      )}

      {isAdmin && showCreate && (
        <CreateForm
          onDone={() => {
            setJustCreated('baru');
            setTimeout(() => setJustCreated(''), 5000);
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3">
            <span>
              {isAdmin ? 'Semua Pengumuman' : 'Pengumuman untuk Saya'}
              {!isAdmin && unread.data && unread.data.unread > 0 && (
                <Badge className="ml-2 bg-emerald-100 text-emerald-700">
                  {unread.data.unread} baru
                </Badge>
              )}
            </span>
            <Badge>{data ? `${data.total} pengumuman` : '…'}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAdmin && (
            <div className="mb-4 flex items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor="f-status">Status</Label>
                <select
                  id="f-status"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm"
                >
                  <option value="all">Semua</option>
                  <option value="published">Terpublikasi</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          )}

          {list.isLoading ? (
            <p className="text-sm text-zinc-400">Memuat…</p>
          ) : data && data.items.length > 0 ? (
            <div className="space-y-3">
              {data.items.map((item) => (
                <AnnouncementCard
                  key={item.id}
                  item={item}
                  canManage={isAdmin}
                  onPublish={
                    isAdmin && !item.isPublished
                      ? () => publish.mutate(item.id)
                      : undefined
                  }
                  onDelete={isAdmin ? () => remove.mutate(item.id) : undefined}
                  onMarkRead={
                    !isAdmin && item.isPublished && item.isRead === false
                      ? () => markRead.mutate(item.id)
                      : undefined
                  }
                />
              ))}
              {data.total > data.limit && (
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.page <= 1 || list.isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Sebelumnya
                  </Button>
                  <span className="text-xs text-zinc-500">
                    Halaman {data.page} dari{' '}
                    {Math.ceil(data.total / data.limit)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.page >= Math.ceil(data.total / data.limit) || list.isFetching}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Berikutnya
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              {isAdmin
                ? 'Belum ada pengumuman. Buat pengumuman baru dengan tombol di atas.'
                : 'Tidak ada pengumuman untuk Anda saat ini.'}
            </p>
          )}
        </CardContent>
      </Card>

      {publish.isError && (
        <p className="text-sm text-red-600">
          {publish.error instanceof Error ? publish.error.message : 'Gagal publikasi'}
        </p>
      )}
      {remove.isError && (
        <p className="text-sm text-red-600">
          {remove.error instanceof Error ? remove.error.message : 'Gagal hapus'}
        </p>
      )}
    </div>
  );
}
