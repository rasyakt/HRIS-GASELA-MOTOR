'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, X, User, Briefcase, FileText, Upload, Trash2, Loader2, Edit, Award, GraduationCap, Package, Shield, HeartHandshake, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthApi } from '@/lib/auth-api';
import { badgeClass, fmtDate, roleAtLeast } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';
import { ReviewsPanel } from './reviews-panel';
import { TrainingPanel } from './training-panel';
import { AssetPanel } from './assets-panel';
import { AccountPanel } from './account-panel';
import { FamilyPanel } from './family-panel';

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

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
      {message}
    </div>
  );
}

interface DepartmentItem {
  id: number;
  name: string;
}

interface PositionItem {
  id: number;
  name: string;
}

interface ManagerItem {
  id: number;
  fullName: string;
  employeeNumber: string;
}

interface DocumentItem {
  id: number;
  documentType: string;
  documentName: string;
  documentUrl: string;
  uploadDate: string;
  expiryDate: string | null;
}

const DOCUMENT_TYPES = [
  { value: 'ktp', label: 'KTP' },
  { value: 'npwp', label: 'NPWP' },
  { value: 'ijazah', label: 'Ijazah' },
  { value: 'sertifikat', label: 'Sertifikat' },
  { value: 'kontrak', label: 'Kontrak Kerja' },
  { value: 'skck', label: 'SKCK' },
  { value: 'foto', label: 'Foto Resmi' },
  { value: 'cv', label: 'CV' },
  { value: 'other', label: 'Lainnya' },
];

export default function EmployeesPage() {
  const authApi = useAuthApi();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  // Detail & Form Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [drawerTab, setDrawerTab] = useState<
    'profile' | 'job' | 'documents' | 'review' | 'training' | 'asset' | 'account'
  >('profile');

  // Form States
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employeeNumber: '',
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    idCardNumber: '',
    taxNumber: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    departmentId: '',
    positionId: '',
    managerId: '',
    joinDate: '',
    permanentDate: '',
    employmentStatus: 'probation',
    employmentType: 'permanent',
    ptkpStatus: 'TK0',
    basicSalary: 0,
    bankAccountName: '',
    bankAccountNumber: '',
    bankName: '',
  });

  // Document Upload States
  const [docType, setDocType] = useState('ktp');
  const [docName, setDocName] = useState('');
  const [docExpiryDate, setDocExpiryDate] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && !roleAtLeast(user.role, 'admin')) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');

  const employees = useQuery({
    queryKey: ['employees', search, page, selectedRole, selectedDepartment, selectedPosition],
    queryFn: () =>
      authApi<EmployeePage>(
        `/api/employees?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ''}${
          selectedRole !== 'all' ? `&role=${selectedRole}` : ''
        }${selectedDepartment !== 'all' ? `&departmentId=${selectedDepartment}` : ''}${
          selectedPosition !== 'all' ? `&positionId=${selectedPosition}` : ''
        }`,
      ),
  });

  const employeeDetail = useQuery({
    queryKey: ['employee-detail', selectedEmployeeId],
    queryFn: () => authApi<any>(`/api/employees/${selectedEmployeeId}`),
    enabled: !!selectedEmployeeId,
  });

  // Documents list
  const documents = useQuery({
    queryKey: ['employee-documents', selectedEmployeeId],
    queryFn: () => authApi<DocumentItem[]>(`/api/documents?employeeId=${selectedEmployeeId}`),
    enabled: !!selectedEmployeeId && drawerTab === 'documents',
  });

  // Master data queries for dropdown lists
  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: () => authApi<DepartmentItem[]>('/api/departments'),
  });

  const positions = useQuery({
    queryKey: ['positions'],
    queryFn: () => authApi<PositionItem[]>('/api/positions'),
  });

  const managers = useQuery({
    queryKey: ['managers-list'],
    queryFn: () => authApi<{ items: ManagerItem[] }>('/api/employees?limit=100'),
    enabled: drawerOpen,
  });

  // Actions
  const createEmployee = useMutation({
    mutationFn: (input: any) => authApi('/api/employees', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      setDrawerOpen(false);
      resetForm();
    },
    onError: (err: any) => setFormError(err.message || 'Gagal menambahkan karyawan'),
  });

  const updateEmployee = useMutation({
    mutationFn: (input: any) =>
      authApi(`/api/employees/${selectedEmployeeId}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employee-detail', selectedEmployeeId] });
      setIsEditMode(false);
    },
    onError: (err: any) => setFormError(err.message || 'Gagal mengubah data karyawan'),
  });

  const deactivateEmployee = useMutation({
    mutationFn: () => authApi(`/api/employees/${selectedEmployeeId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      setDrawerOpen(false);
    },
  });

  const uploadDoc = useMutation({
    mutationFn: (input: { documentType: string; documentName: string; documentUrl: string; expiryDate?: string }) =>
      authApi('/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          ...input,
          employeeId: selectedEmployeeId,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee-documents', selectedEmployeeId] });
      setDocName('');
      setDocExpiryDate('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
  });

  const deleteDoc = useMutation({
    mutationFn: (id: number) => authApi(`/api/documents/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee-documents', selectedEmployeeId] });
    },
  });

  const handleOpenCreate = () => {
    resetForm();
    setSelectedEmployeeId(null);
    setIsEditMode(true);
    setDrawerTab('profile');
    setDrawerOpen(true);
  };

  const handleOpenDetail = (emp: EmployeeRow) => {
    setSelectedEmployeeId(emp.id);
    setIsEditMode(false);
    setDrawerTab('profile');
    setDrawerOpen(true);
  };

  useEffect(() => {
    if (employeeDetail.data) {
      const e = employeeDetail.data;
      setFormData({
        employeeNumber: e.employeeNumber || '',
        fullName: e.fullName || '',
        email: e.email || '',
        phone: e.phone || '',
        birthDate: e.birthDate ? e.birthDate.slice(0, 10) : '',
        idCardNumber: e.idCardNumber || '',
        taxNumber: e.taxNumber || '',
        address: e.address || '',
        emergencyContactName: e.emergencyContactName || '',
        emergencyContactPhone: e.emergencyContactPhone || '',
        departmentId: e.departmentId ? String(e.departmentId) : '',
        positionId: e.positionId ? String(e.positionId) : '',
        managerId: e.managerId ? String(e.managerId) : '',
        joinDate: e.joinDate ? e.joinDate.slice(0, 10) : '',
        permanentDate: e.permanentDate ? e.permanentDate.slice(0, 10) : '',
        employmentStatus: e.employmentStatus || 'probation',
        employmentType: e.employmentType || 'permanent',
        ptkpStatus: e.ptkpStatus || 'TK0',
        basicSalary: e.basicSalary ? Number(e.basicSalary) : 0,
        bankAccountName: e.bankAccountName || '',
        bankAccountNumber: e.bankAccountNumber || '',
        bankName: e.bankName || '',
      });
    }
  }, [employeeDetail.data]);

  const resetForm = () => {
    setFormError(null);
    setFormData({
      employeeNumber: '',
      fullName: '',
      email: '',
      phone: '',
      birthDate: '',
      idCardNumber: '',
      taxNumber: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      departmentId: '',
      positionId: '',
      managerId: '',
      joinDate: new Date().toISOString().slice(0, 10),
      permanentDate: '',
      employmentStatus: 'probation',
      employmentType: 'permanent',
      ptkpStatus: 'TK0',
      basicSalary: 0,
      bankAccountName: '',
      bankAccountNumber: '',
      bankName: '',
    });
  };

  const handleInputChange = (key: string, val: any) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.employeeNumber.trim()) return setFormError('NIK wajib diisi');
    if (!formData.fullName.trim()) return setFormError('Nama lengkap wajib diisi');
    if (!formData.email.trim()) return setFormError('Email wajib diisi');
    if (!formData.joinDate) return setFormError('Tanggal bergabung wajib diisi');
    if (formData.basicSalary <= 0) return setFormError('Gaji pokok harus lebih besar dari 0');

    const payload = {
      ...formData,
      departmentId: formData.departmentId ? Number(formData.departmentId) : null,
      positionId: formData.positionId ? Number(formData.positionId) : null,
      managerId: formData.managerId ? Number(formData.managerId) : null,
      basicSalary: Number(formData.basicSalary),
      birthDate: formData.birthDate || null,
      permanentDate: formData.permanentDate || null,
    };

    if (selectedEmployeeId) {
      updateEmployee.mutate(payload);
    } else {
      createEmployee.mutate(payload);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('category', 'document');

      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body,
      });

      if (!res.ok) {
        throw new Error('Gagal mengunggah file.');
      }

      const uploadResult = await res.json();
      const documentUrl = uploadResult.success ? uploadResult.data.url : uploadResult.url;

      uploadDoc.mutate({
        documentType: docType,
        documentName: docName || file.name,
        documentUrl: documentUrl || `/uploads/document/${uploadResult.data.fileName}`,
        expiryDate: docExpiryDate || undefined,
      });
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat mengunggah.');
    } finally {
      setUploadingFile(false);
    }
  };

  if (!user || !roleAtLeast(user.role, 'admin')) {
    return null;
  }

  const data = employees.data;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">Karyawan</h2>
          <p className="text-sm text-zinc-500">
            Daftar, kelola, dan simpan dokumen karyawan GASELA MOTOR.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-zinc-900 text-white hover:bg-zinc-800">
          <Plus className="mr-1.5 size-4" />
          Karyawan Baru
        </Button>
      </div>

      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base font-semibold">
            <span>Daftar Karyawan Aktif</span>
            <Badge className="bg-zinc-100 text-zinc-950 font-semibold">{data ? `${data.total} orang` : '…'}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex border-b border-zinc-200 mb-4 overflow-x-auto">
            {[
              { value: 'all', label: 'Semua Karyawan' },
              { value: 'employee', label: 'Role Karyawan' },
              { value: 'manager', label: 'Role Manager' },
              { value: 'hrd', label: 'Role HRD' },
              { value: 'owner', label: 'Role Owner' },
              { value: 'admin', label: 'Role Admin' },
              { value: 'none', label: 'Belum Punya Akun' },
            ].map((tab) => (
              <button
                type="button"
                key={tab.value}
                onClick={() => {
                  setPage(1);
                  setSelectedRole(tab.value);
                }}
                className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  selectedRole === tab.value
                    ? 'border-zinc-900 text-zinc-950 bg-zinc-50'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form
            className="mb-4 flex flex-wrap items-center gap-2"
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
              className="w-full sm:w-64 text-xs"
            />

            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
            >
              <option value="all">Semua Departemen</option>
              {departments.data?.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>

            <select
              value={selectedPosition}
              onChange={(e) => {
                setSelectedPosition(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950"
            >
              <option value="all">Semua Posisi</option>
              {positions.data?.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.name}
                </option>
              ))}
            </select>

            <Button type="submit" variant="outline" size="sm" className="text-xs">
              <Search className="mr-1.5 size-3.5" />
              Cari
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (!data?.items || data.items.length === 0) return alert('Tidak ada data untuk diekspor');
                const headers = ['NIK', 'Nama Lengkap', 'Email', 'Telepon', 'Departemen', 'Posisi', 'Status Kerja', 'Tipe Kerja', 'Tanggal Masuk'];
                const rows = data.items.map((emp) => [
                  `"${emp.employeeNumber || ''}"`,
                  `"${emp.fullName || ''}"`,
                  `"${emp.email || ''}"`,
                  `"${emp.phone || ''}"`,
                  `"${emp.department?.name || ''}"`,
                  `"${emp.position?.name || ''}"`,
                  `"${emp.employmentStatus || ''}"`,
                  `"${emp.employmentType || ''}"`,
                  `"${emp.joinDate ? emp.joinDate.split('T')[0] : ''}"`,
                ]);
                const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `Karyawan_GaselaPulse_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="text-xs ml-auto gap-1 text-zinc-700 hover:text-zinc-950"
            >
              <Download className="size-3.5" /> Ekspor CSV
            </Button>
          </form>

          {employees.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin text-zinc-500 size-6" />
            </div>
          ) : data && data.items.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-zinc-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold text-zinc-600">
                    <th className="p-3">NIK</th>
                    <th className="p-3">Nama</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Departemen</th>
                    <th className="p-3">Posisi</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Tipe</th>
                    <th className="p-3">Bergabung</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((e) => (
                    <tr
                      key={e.id}
                      onClick={() => handleOpenDetail(e)}
                      className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50/80 transition-colors last:border-0"
                    >
                      <td className="p-3 font-semibold text-zinc-900">{e.employeeNumber}</td>
                      <td className="p-3 font-medium text-zinc-900">{e.fullName}</td>
                      <td className="p-3 text-zinc-500">{e.email}</td>
                      <td className="p-3 text-zinc-600">{e.department?.name ?? '—'}</td>
                      <td className="p-3 text-zinc-600">{e.position?.name ?? '—'}</td>
                      <td className="p-3">
                        <Badge className={`${badgeClass(e.employmentStatus)} border-0`}>
                          {e.employmentStatus}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={`${badgeClass(e.employmentType)} border-0`}>
                          {e.employmentType}
                        </Badge>
                      </td>
                      <td className="p-3 text-zinc-500">{fmtDate(e.joinDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 py-6 text-center">
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

      {/* Centered Modal Popup */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity" onClick={() => setDrawerOpen(false)} />
          <div className="pointer-events-none fixed inset-0 flex items-center justify-center p-4">
            <div className="pointer-events-auto w-full max-w-3xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 p-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">
                    {selectedEmployeeId ? (isEditMode ? 'Ubah Data Karyawan' : 'Detail Karyawan') : 'Tambah Karyawan Baru'}
                  </h3>
                  {selectedEmployeeId && (
                    <p className="text-xs text-zinc-500 mt-1">ID: {selectedEmployeeId} · NIK: {formData.employeeNumber}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {selectedEmployeeId && !isEditMode && (
                    <Button onClick={() => setIsEditMode(true)} variant="outline" size="sm">
                      <Edit className="mr-1.5 size-4" />
                      Ubah
                    </Button>
                  )}
                  <button onClick={() => setDrawerOpen(false)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors">
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              {/* Detail Tabs (Only when employee selected) */}
              {selectedEmployeeId && (
                <div className="border-b border-zinc-200 bg-white overflow-x-auto">
                  <div className="flex min-w-max px-4">
                    <button
                      onClick={() => setDrawerTab('profile')}
                      className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-medium transition-all whitespace-nowrap ${
                        drawerTab === 'profile'
                          ? 'border-zinc-900 text-zinc-900 bg-zinc-50/50'
                          : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50/30'
                      }`}
                    >
                      <User className="size-3.5" />
                      Profil
                    </button>
                    <button
                      onClick={() => setDrawerTab('job')}
                      className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-medium transition-all whitespace-nowrap ${
                        drawerTab === 'job'
                          ? 'border-zinc-900 text-zinc-900 bg-zinc-50/50'
                          : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50/30'
                      }`}
                    >
                      <Briefcase className="size-3.5" />
                      Pekerjaan & Gaji
                    </button>
                    <button
                      onClick={() => setDrawerTab('documents')}
                      className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-medium transition-all whitespace-nowrap ${
                        drawerTab === 'documents'
                          ? 'border-zinc-900 text-zinc-900 bg-zinc-50/50'
                          : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50/30'
                      }`}
                    >
                      <FileText className="size-3.5" />
                      Dokumen
                    </button>
                    <button
                      onClick={() => setDrawerTab('review')}
                      className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-medium transition-all whitespace-nowrap ${
                        drawerTab === 'review'
                          ? 'border-zinc-900 text-zinc-900 bg-zinc-50/50'
                          : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50/30'
                      }`}
                    >
                      <Award className="size-3.5" />
                      Review
                    </button>
                    <button
                      onClick={() => setDrawerTab('training')}
                      className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-medium transition-all whitespace-nowrap ${
                        drawerTab === 'training'
                          ? 'border-zinc-900 text-zinc-900 bg-zinc-50/50'
                          : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50/30'
                      }`}
                    >
                      <GraduationCap className="size-3.5" />
                      Pelatihan
                    </button>
                    <button
                      onClick={() => setDrawerTab('asset')}
                      className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-medium transition-all whitespace-nowrap ${
                        drawerTab === 'asset'
                          ? 'border-zinc-900 text-zinc-900 bg-zinc-50/50'
                          : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50/30'
                      }`}
                    >
                      <Package className="size-3.5" />
                      Aset
                    </button>
                    <button
                      onClick={() => setDrawerTab('family' as any)}
                      className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-medium transition-all whitespace-nowrap ${
                        (drawerTab as string) === 'family'
                          ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                          : 'border-transparent text-zinc-600 hover:text-emerald-700 hover:bg-emerald-50/30'
                      }`}
                    >
                      <HeartHandshake className="size-3.5" />
                      Keluarga
                    </button>
                    {user && roleAtLeast(user.role, 'admin') && (
                      <button
                        onClick={() => setDrawerTab('account')}
                        className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-medium transition-all whitespace-nowrap ${
                          drawerTab === 'account'
                            ? 'border-zinc-900 text-zinc-900 bg-zinc-50/50'
                            : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50/30'
                        }`}
                      >
                        <Shield className="size-3.5" />
                        Akun
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Form Content / Details body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {formError && <ErrorBanner message={formError} />}

                {/* Loading state */}
                {selectedEmployeeId && employeeDetail.isLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="animate-spin text-zinc-500 size-6" />
                  </div>
                ) : (
                  <form id="employee-form" onSubmit={handleFormSubmit}>
                    {/* Tab 1: Profile & Personal */}
                    {(drawerTab === 'profile' || !selectedEmployeeId) && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="employeeNumber">NIK / Nomor Karyawan</Label>
                            <Input
                              id="employeeNumber"
                              disabled={!isEditMode || !!selectedEmployeeId}
                              value={formData.employeeNumber}
                              onChange={(e) => handleInputChange('employeeNumber', e.target.value)}
                              placeholder="KAY-001"
                            />
                          </div>
                          <div>
                            <Label htmlFor="fullName">Nama Lengkap</Label>
                            <Input
                              id="fullName"
                              disabled={!isEditMode}
                              value={formData.fullName}
                              onChange={(e) => handleInputChange('fullName', e.target.value)}
                              placeholder="Ahmad Suherman"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              disabled={!isEditMode}
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              placeholder="karyawan@gaselamotor.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone">Nomor Telepon</Label>
                            <Input
                              id="phone"
                              disabled={!isEditMode}
                              value={formData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              placeholder="081234567890"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="birthDate">Tanggal Lahir</Label>
                            <Input
                              id="birthDate"
                              type="date"
                              disabled={!isEditMode}
                              value={formData.birthDate}
                              onChange={(e) => handleInputChange('birthDate', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="idCardNumber">Nomor KTP</Label>
                            <Input
                              id="idCardNumber"
                              disabled={!isEditMode}
                              value={formData.idCardNumber}
                              onChange={(e) => handleInputChange('idCardNumber', e.target.value)}
                              placeholder="3273123456789012"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="address">Alamat Domisili</Label>
                          <textarea
                            id="address"
                            disabled={!isEditMode}
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:bg-zinc-50"
                            rows={3}
                            placeholder="Alamat lengkap sesuai domisili..."
                          />
                        </div>

                        <div className="rounded-md bg-zinc-50 p-4 border border-zinc-100 space-y-3">
                          <h4 className="text-xs font-bold text-zinc-700 tracking-wider uppercase">Kontak Darurat</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="emergencyContactName">Nama Kontak</Label>
                              <Input
                                id="emergencyContactName"
                                disabled={!isEditMode}
                                value={formData.emergencyContactName}
                                onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="emergencyContactPhone">Nomor Telepon</Label>
                              <Input
                                id="emergencyContactPhone"
                                disabled={!isEditMode}
                                value={formData.emergencyContactPhone}
                                onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Job & Salary */}
                    {(drawerTab === 'job' || !selectedEmployeeId) && (
                      <div className="space-y-4">
                        {!selectedEmployeeId && <div className="h-px bg-zinc-200 my-4" />}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="departmentId">Departemen</Label>
                            <select
                              id="departmentId"
                              disabled={!isEditMode}
                              value={formData.departmentId}
                              onChange={(e) => handleInputChange('departmentId', e.target.value)}
                              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:bg-zinc-50"
                            >
                              <option value="">Pilih Departemen</option>
                              {departments.data?.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="positionId">Posisi</Label>
                            <select
                              id="positionId"
                              disabled={!isEditMode}
                              value={formData.positionId}
                              onChange={(e) => handleInputChange('positionId', e.target.value)}
                              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:bg-zinc-50"
                            >
                              <option value="">Pilih Posisi</option>
                              {positions.data?.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="joinDate">Tanggal Bergabung</Label>
                            <Input
                              id="joinDate"
                              type="date"
                              disabled={!isEditMode}
                              value={formData.joinDate}
                              onChange={(e) => handleInputChange('joinDate', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="permanentDate">Tanggal Karyawan Tetap</Label>
                            <Input
                              id="permanentDate"
                              type="date"
                              disabled={!isEditMode}
                              value={formData.permanentDate}
                              onChange={(e) => handleInputChange('permanentDate', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="employmentStatus">Status Pekerjaan</Label>
                            <select
                              id="employmentStatus"
                              disabled={!isEditMode}
                              value={formData.employmentStatus}
                              onChange={(e) => handleInputChange('employmentStatus', e.target.value)}
                              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:bg-zinc-50"
                            >
                              <option value="probation">Masa Percobaan (Probation)</option>
                              <option value="active">Aktif</option>
                              <option value="resigned">Resigned</option>
                              <option value="terminated">Terminated (PHK)</option>
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="employmentType">Tipe Pekerjaan</Label>
                            <select
                              id="employmentType"
                              disabled={!isEditMode}
                              value={formData.employmentType}
                              onChange={(e) => handleInputChange('employmentType', e.target.value)}
                              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:bg-zinc-50"
                            >
                              <option value="permanent">Karyawan Tetap</option>
                              <option value="contract">Kontrak</option>
                              <option value="magang">Magang</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="basicSalary">Gaji Pokok (Rupiah)</Label>
                            <Input
                              id="basicSalary"
                              type="number"
                              disabled={!isEditMode}
                              value={formData.basicSalary}
                              onChange={(e) => handleInputChange('basicSalary', e.target.value)}
                              placeholder="5000000"
                            />
                          </div>
                          <div>
                            <Label htmlFor="ptkpStatus">Status PTKP (Pajak PPh21)</Label>
                            <select
                              id="ptkpStatus"
                              disabled={!isEditMode}
                              value={formData.ptkpStatus}
                              onChange={(e) => handleInputChange('ptkpStatus', e.target.value)}
                              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:bg-zinc-50"
                            >
                              <option value="TK0">TK/0 (Belum Menikah, 0 tanggungan)</option>
                              <option value="TK1">TK/1 (Belum Menikah, 1 tanggungan)</option>
                              <option value="TK2">TK/2 (Belum Menikah, 2 tanggungan)</option>
                              <option value="TK3">TK/3 (Belum Menikah, 3 tanggungan)</option>
                              <option value="K0">K/0 (Menikah, 0 tanggungan)</option>
                              <option value="K1">K/1 (Menikah, 1 tanggungan)</option>
                              <option value="K2">K/2 (Menikah, 2 tanggungan)</option>
                              <option value="K3">K/3 (Menikah, 3 tanggungan)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-1">
                            <Label htmlFor="bankName">Nama Bank</Label>
                            <Input
                              id="bankName"
                              disabled={!isEditMode}
                              value={formData.bankName}
                              onChange={(e) => handleInputChange('bankName', e.target.value)}
                              placeholder="BCA / Mandiri"
                            />
                          </div>
                          <div className="col-span-1">
                            <Label htmlFor="bankAccountNumber">Nomor Rekening</Label>
                            <Input
                              id="bankAccountNumber"
                              disabled={!isEditMode}
                              value={formData.bankAccountNumber}
                              onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                              placeholder="1234567890"
                            />
                          </div>
                          <div className="col-span-1">
                            <Label htmlFor="bankAccountName">Atas Nama</Label>
                            <Input
                              id="bankAccountName"
                              disabled={!isEditMode}
                              value={formData.bankAccountName}
                              onChange={(e) => handleInputChange('bankAccountName', e.target.value)}
                              placeholder="Nama Pemilik"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="taxNumber">Nomor NPWP</Label>
                            <Input
                              id="taxNumber"
                              disabled={!isEditMode}
                              value={formData.taxNumber}
                              onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                              placeholder="12.345.678.9-012.000"
                            />
                          </div>
                          <div>
                            <Label htmlFor="managerId">Atasan Langsung (Manager)</Label>
                            <select
                              id="managerId"
                              disabled={!isEditMode}
                              value={formData.managerId}
                              onChange={(e) => handleInputChange('managerId', e.target.value)}
                              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:bg-zinc-50"
                            >
                              <option value="">Pilih Manager</option>
                              {managers.data?.items
                                .filter((m) => m.id !== selectedEmployeeId)
                                .map((m) => (
                                  <option key={m.id} value={m.id}>{m.fullName} ({m.employeeNumber})</option>
                                ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </form>
                )}

                {/* Tab 3: Documents Management */}
                {selectedEmployeeId && drawerTab === 'documents' && (
                  <div className="space-y-6">
                    {/* Upload Form */}
                    {isEditMode && (
                      <div className="rounded-lg border border-zinc-200 p-4 space-y-4 bg-zinc-50/50">
                        <h4 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
                          <Upload className="size-4" />
                          Tambah Dokumen Baru
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="docType">Tipe Dokumen</Label>
                            <select
                              id="docType"
                              value={docType}
                              onChange={(e) => setDocType(e.target.value)}
                              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                            >
                              {DOCUMENT_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="docName">Nama Dokumen</Label>
                            <Input
                              id="docName"
                              value={docName}
                              onChange={(e) => setDocName(e.target.value)}
                              placeholder="mis. KTP Ahmad"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="docExpiryDate">Tanggal Kedaluwarsa (Opsional)</Label>
                          <Input
                            id="docExpiryDate"
                            type="date"
                            value={docExpiryDate}
                            onChange={(e) => setDocExpiryDate(e.target.value)}
                          />
                        </div>

                        <div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                            accept="image/*,application/pdf"
                          />
                          <Button
                            type="button"
                            disabled={uploadingFile || uploadDoc.isPending}
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-zinc-900 text-white hover:bg-zinc-800 w-full"
                          >
                            {uploadingFile ? (
                              <>
                                <Loader2 className="mr-1.5 size-4 animate-spin" />
                                Mengunggah file...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-1.5 size-4" />
                                Pilih File & Unggah
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-zinc-500 mt-1.5 text-center">Batas file maks 5MB (Format PDF, PNG, JPG)</p>
                        </div>
                      </div>
                    )}

                    {/* Document List */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-zinc-800">Daftar Dokumen Tersimpan</h4>
                      {documents.isLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="animate-spin text-zinc-500 size-5" />
                        </div>
                      ) : documents.data && documents.data.length > 0 ? (
                        <div className="space-y-2">
                          {documents.data.map((doc) => {
                            const matchedType = DOCUMENT_TYPES.find((t) => t.value === doc.documentType);
                            return (
                              <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 transition-colors">
                                <div className="min-w-0 pr-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-zinc-900 truncate">{doc.documentName}</span>
                                    <Badge className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100 text-[10px] border-zinc-200">
                                      {matchedType?.label || doc.documentType}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-zinc-500 mt-1 flex flex-wrap gap-x-2">
                                    <span>Diunggah: {fmtDate(doc.uploadDate)}</span>
                                    {doc.expiryDate && (
                                      <span className="text-amber-700">Kedaluwarsa: {fmtDate(doc.expiryDate)}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <a
                                    href={doc.documentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-semibold text-sky-600 hover:underline px-2 py-1"
                                  >
                                    Unduh
                                  </a>
                                  {isEditMode && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm('Hapus dokumen ini?')) deleteDoc.mutate(doc.id);
                                      }}
                                      className="p-1 text-zinc-400 hover:text-red-600 hover:bg-zinc-50 rounded"
                                    >
                                      <Trash2 className="size-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 py-4 text-center border border-dashed border-zinc-200 rounded-lg">Belum ada dokumen yang diunggah.</p>
                      )}
                    </div>
                  </div>
                )}
                {/* Tab 4: Performance Review */}
                {selectedEmployeeId && drawerTab === 'review' && (
                  <ReviewsPanel employeeId={selectedEmployeeId} />
                )}

                {/* Tab 5: Training */}
                {selectedEmployeeId && drawerTab === 'training' && (
                  <TrainingPanel employeeId={selectedEmployeeId} />
                )}

                {/* Tab 6: Asset */}
                {selectedEmployeeId && drawerTab === 'asset' && (
                  <AssetPanel employeeId={selectedEmployeeId} />
                )}

                {/* Tab: Family */}
                {selectedEmployeeId && (drawerTab as string) === 'family' && (
                  <FamilyPanel
                    employeeId={selectedEmployeeId}
                    familyMembers={employeeDetail.data?.familyMembers}
                    onRefresh={() => employeeDetail.refetch()}
                  />
                )}

                {/* Tab 7: Account (Admins only) */}
                {selectedEmployeeId && drawerTab === 'account' && user && roleAtLeast(user.role, 'admin') && (
                  <AccountPanel
                    employeeId={selectedEmployeeId}
                    userAccount={employeeDetail.data?.user ?? null}
                    employeeName={employeeDetail.data?.fullName ?? ''}
                  />
                )}
              </div>

              {/* Bottom Actions footer */}
              {isEditMode && (drawerTab === 'profile' || drawerTab === 'job' || !selectedEmployeeId) && (
                <div className="border-t border-zinc-100 bg-zinc-50/50 p-6 flex items-center justify-between gap-3 shrink-0">
                  {selectedEmployeeId ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (confirm('Apakah Anda yakin ingin menonaktifkan karyawan ini?')) {
                          deactivateEmployee.mutate();
                        }
                      }}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      Nonaktifkan Karyawan
                    </Button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsEditMode(false)}>
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      form="employee-form"
                      disabled={createEmployee.isPending || updateEmployee.isPending}
                      className="bg-zinc-900 text-white hover:bg-zinc-800"
                    >
                      {(createEmployee.isPending || updateEmployee.isPending) && (
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                      )}
                      Simpan Perubahan
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
