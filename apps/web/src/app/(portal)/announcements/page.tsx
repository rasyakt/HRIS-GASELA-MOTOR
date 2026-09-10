'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Check,
  CheckCheck,
  Eye,
  Loader2,
  Megaphone,
  PlusCircle,
  Send,
  Trash2,
  User,
  X,
} from 'lucide-react';
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
  low: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  normal: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800',
};

const TARGET_LABEL: Record<string, string> = {
  all: 'Semua Karyawan',
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
    <Card className="border-primary/20 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Megaphone className="size-4 text-primary" />
          Buat Pengumuman Baru
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="ann-title">Judul Pengumuman</Label>
          <Input
            id="ann-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Jadwal Libur Nasional & Cuti Bersama"
            maxLength={200}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ann-content">Isi Pengumuman</Label>
          <textarea
            id="ann-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tuliskan detail pengumuman secara lengkap di sini…"
            rows={5}
            maxLength={5000}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label htmlFor="ann-priority">Prioritas</Label>
            <select
              id="ann-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ann-audience">Target Penerima</Label>
            <select
              id="ann-audience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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
            <Label htmlFor="ann-expiry">Kadaluarsa (Opsional)</Label>
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
            <Label htmlFor="ann-dept">Pilih Departemen</Label>
            <select
              id="ann-dept"
              value={targetDepartmentId}
              onChange={(e) => setTargetDepartmentId(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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
            <Label htmlFor="ann-pos">Pilih Posisi</Label>
            <select
              id="ann-pos"
              value={targetPositionId}
              onChange={(e) => setTargetPositionId(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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
            <Label htmlFor="ann-emp">Pilih Karyawan</Label>
            <select
              id="ann-emp"
              value={targetEmployeeId}
              onChange={(e) => setTargetEmployeeId(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2">
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || !title.trim() || content.trim().length < 5}
            className="w-full sm:w-auto"
          >
            {create.isPending ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <PlusCircle data-icon="inline-start" />
            )}
            Simpan Draft
          </Button>
          <span className="text-xs text-zinc-500">
            Pengumuman akan disimpan sebagai draft terlebih dahulu sebelum dipublikasikan.
          </span>
        </div>
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

function AnnouncementDetailModal({
  item,
  onClose,
  onPublish,
  onDelete,
  onMarkRead,
  canManage,
}: {
  item: AnnouncementDto;
  onClose: () => void;
  onPublish?: () => void;
  onDelete?: () => void;
  onMarkRead?: () => void;
  canManage: boolean;
}) {
  const isUnread = item.isPublished && item.isRead === false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-100 p-5 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={PRIORITY_CLASS[item.priority]}>
              {PRIORITY_LABEL[item.priority] ?? item.priority}
            </Badge>
            <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {TARGET_LABEL[item.targetAudience] ?? item.targetAudience}
            </Badge>
            {!item.isPublished && (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                Draft
              </Badge>
            )}
            {item.isPublished && isUnread && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                Baru
              </Badge>
            )}
            {item.isPublished && !isUnread && item.isRead !== undefined && (
              <Badge className="bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                Sudah Dibaca
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-snug">
            {item.title}
          </h2>

          {/* Metadata bar */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-zinc-400" />
              <span>
                Tayang: {fmtDate(item.publishDate)}
                {item.expiryDate ? ` s/d ${fmtDate(item.expiryDate)}` : ''}
              </span>
            </div>
            {item.createdByName && (
              <div className="flex items-center gap-1.5">
                <User className="size-3.5 text-zinc-400" />
                <span>Oleh: {item.createdByName}</span>
              </div>
            )}
            {canManage && item.readCount !== undefined && (
              <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-medium">
                <Eye className="size-3.5" />
                <span>{item.readCount} karyawan telah membaca</span>
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className="pt-2 text-zinc-800 dark:text-zinc-200 text-sm md:text-base whitespace-pre-wrap leading-relaxed">
            {item.content}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-zinc-100 bg-zinc-50/50 p-3 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900/50 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {canManage && !item.isPublished && onPublish && (
              <Button size="sm" onClick={onPublish} className="w-full sm:w-auto">
                <Send data-icon="inline-start" />
                Publikasikan Sekarang
              </Button>
            )}
            {canManage && onDelete && (
              <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 w-full sm:w-auto" onClick={onDelete}>
                <Trash2 data-icon="inline-start" />
                Hapus Pengumuman
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {isUnread && onMarkRead && (
              <Button size="sm" variant="outline" onClick={onMarkRead} className="w-full sm:w-auto">
                <CheckCheck data-icon="inline-start" />
                Tandai Sudah Dibaca
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnnouncementCard({
  item,
  onOpenDetail,
  onPublish,
  onDelete,
  onMarkRead,
  canManage,
}: {
  item: AnnouncementDto;
  onOpenDetail: () => void;
  onPublish?: () => void;
  onDelete?: () => void;
  onMarkRead?: () => void;
  canManage: boolean;
}) {
  const isUnread = item.isPublished && item.isRead === false;

  return (
    <div
      onClick={onOpenDetail}
      className={`group relative rounded-xl border bg-white p-5 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md dark:bg-zinc-900/90 ${
        isUnread
          ? 'border-primary/40 dark:border-primary/50 bg-primary/[0.015]'
          : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {isUnread && (
              <span className="flex size-2 rounded-full bg-red-500 animate-pulse" />
            )}
            <Badge className={PRIORITY_CLASS[item.priority]}>
              {PRIORITY_LABEL[item.priority] ?? item.priority}
            </Badge>
            <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {TARGET_LABEL[item.targetAudience] ?? item.targetAudience}
            </Badge>
            {!item.isPublished && (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                Draft
              </Badge>
            )}
            {item.isPublished && isUnread && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold">
                Baru
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="mt-2 text-base font-bold text-zinc-900 group-hover:text-primary transition-colors dark:text-white">
            {item.title}
          </h3>

          {/* Snippet Content */}
          <p className="mt-1 text-sm whitespace-pre-wrap text-zinc-600 dark:text-zinc-300 line-clamp-3">
            {item.content}
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail();
            }}
            className="mt-2 inline-flex items-center text-xs font-semibold text-primary hover:underline"
          >
            Baca Selengkapnya →
          </button>

          {/* Footer Info */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 dark:text-zinc-500">
            <span>Tayang {fmtDate(item.publishDate)}</span>
            {item.expiryDate && <span>· s/d {fmtDate(item.expiryDate)}</span>}
            <span>· {fmtDateTime(item.createdAt)}</span>
            <span>· oleh {item.createdByName ?? '—'}</span>
            {canManage && item.readCount !== undefined && (
              <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                · {item.readCount} dibaca
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="flex shrink-0 flex-col gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {canManage && !item.isPublished && onPublish && (
            <Button size="sm" onClick={onPublish}>
              <Send data-icon="inline-start" />
              Publikasikan
            </Button>
          )}
          {isUnread && onMarkRead && (
            <Button size="sm" variant="outline" onClick={onMarkRead}>
              <CheckCheck data-icon="inline-start" />
              Tandai Dibaca
            </Button>
          )}
          {canManage && onDelete && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
              onClick={onDelete}
            >
              <Trash2 data-icon="inline-start" />
              Hapus
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
  const [selectedItem, setSelectedItem] = useState<AnnouncementDto | null>(null);

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
      if (selectedItem) {
        setSelectedItem((prev) => (prev ? { ...prev, isPublished: true } : null));
      }
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) =>
      authApi(`/api/announcements/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      qc.invalidateQueries({ queryKey: ['announcements-my'] });
      qc.invalidateQueries({ queryKey: ['announcements-unread'] });
      setSelectedItem(null);
    },
  });

  const markRead = useMutation({
    mutationFn: (id: number) =>
      authApi('/api/announcements/read', {
        method: 'POST',
        body: JSON.stringify({ announcementId: id }),
      }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      qc.invalidateQueries({ queryKey: ['announcements-my'] });
      qc.invalidateQueries({ queryKey: ['announcements-unread'] });
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem((prev) => (prev ? { ...prev, isRead: true } : null));
      }
    },
  });

  const markAllRead = useMutation({
    mutationFn: () =>
      authApi('/api/announcements/read-all', {
        method: 'POST',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      qc.invalidateQueries({ queryKey: ['announcements-my'] });
      qc.invalidateQueries({ queryKey: ['announcements-unread'] });
    },
  });

  function handleOpenDetail(item: AnnouncementDto) {
    setSelectedItem(item);
    // Otomatis tandai dibaca jika belum dibaca
    if (item.isPublished && item.isRead === false) {
      markRead.mutate(item.id);
    }
  }

  if (!user) return null;
  const data = list.data;
  const unreadCount = unread.data?.unread ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Detail Modal */}
      {selectedItem && (
        <AnnouncementDetailModal
          item={selectedItem}
          canManage={isAdmin}
          onClose={() => setSelectedItem(null)}
          onPublish={
            isAdmin && !selectedItem.isPublished
              ? () => publish.mutate(selectedItem.id)
              : undefined
          }
          onDelete={isAdmin ? () => remove.mutate(selectedItem.id) : undefined}
          onMarkRead={
            selectedItem.isPublished && selectedItem.isRead === false
              ? () => markRead.mutate(selectedItem.id)
              : undefined
          }
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Megaphone className="size-6 text-primary" />
            Pengumuman
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isAdmin
              ? 'Kelola pengumuman dan pantau informasi penting perusahaan.'
              : unreadCount > 0
                ? `Ada ${unreadCount} pengumuman baru yang belum Anda baca.`
                : 'Semua pengumuman terbaru telah dibaca.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              {markAllRead.isPending ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <CheckCheck data-icon="inline-start" />
              )}
              Tandai Semua Dibaca
            </Button>
          )}
          {isAdmin && (
            <Button onClick={() => setShowCreate((v) => !v)}>
              <PlusCircle data-icon="inline-start" />
              {showCreate ? 'Tutup Form' : 'Buat Pengumuman'}
            </Button>
          )}
        </div>
      </div>

      {justCreated && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          Pengumuman disimpan sebagai draft. Klik <strong>Publikasikan</strong> agar tampil ke karyawan.
        </div>
      )}

      {isAdmin && showCreate && (
        <CreateForm
          onDone={() => {
            setShowCreate(false);
            setJustCreated('baru');
            setTimeout(() => setJustCreated(''), 5000);
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span>{isAdmin ? 'Semua Pengumuman' : 'Pengumuman untuk Saya'}</span>
              {unreadCount > 0 && (
                <Badge className="bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                  {unreadCount} belum dibaca
                </Badge>
              )}
            </div>
            <Badge>{data ? `${data.total} pengumuman` : '…'}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAdmin && (
            <div className="mb-4 flex items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor="f-status">Filter Status</Label>
                <select
                  id="f-status"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="all">Semua Status</option>
                  <option value="published">Terpublikasi</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          )}

          {list.isLoading ? (
            <div className="flex items-center justify-center py-12 text-zinc-400">
              <Loader2 className="size-6 animate-spin mr-2" />
              <span>Memuat daftar pengumuman…</span>
            </div>
          ) : data && data.items.length > 0 ? (
            <div className="space-y-3">
              {data.items.map((item) => (
                <AnnouncementCard
                  key={item.id}
                  item={item}
                  canManage={isAdmin}
                  onOpenDetail={() => handleOpenDetail(item)}
                  onPublish={
                    isAdmin && !item.isPublished
                      ? () => publish.mutate(item.id)
                      : undefined
                  }
                  onDelete={isAdmin ? () => remove.mutate(item.id) : undefined}
                  onMarkRead={
                    item.isPublished && item.isRead === false
                      ? () => markRead.mutate(item.id)
                      : undefined
                  }
                />
              ))}
              {data.total > data.limit && (
                <div className="flex items-center justify-between pt-4">
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
                    disabled={
                      data.page >= Math.ceil(data.total / data.limit) ||
                      list.isFetching
                    }
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Berikutnya
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
              <Megaphone className="size-10 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm font-medium">
                {isAdmin
                  ? 'Belum ada pengumuman yang dibuat.'
                  : 'Tidak ada pengumuman untuk Anda saat ini.'}
              </p>
              {isAdmin && (
                <p className="text-xs text-zinc-400 mt-1">
                  Buat pengumuman baru melalui tombol di atas.
                </p>
              )}
            </div>
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
      {markAllRead.isError && (
        <p className="text-sm text-red-600">
          {markAllRead.error instanceof Error
            ? markAllRead.error.message
            : 'Gagal menandai semua sudah dibaca'}
        </p>
      )}
    </div>
  );
}
