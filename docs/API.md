# API Reference — Gasela HRIS

> Base URL: `http://localhost:3001/api` (dev)
> Swagger interaktif: `http://localhost:3001/api/docs` (export JSON: `/api/docs-json`)

## Authentication

Semua endpoint (kecuali `POST /auth/login` & `GET /health`) dilindungi bearer token.
Header: `Authorization: Bearer <accessToken>`.

## Endpoint aktif (Fase 1 — Autentikasi, Master Data, Shift, Kehadiran, Cuti, Lembur & Dashboard)

| Method | Path | Deskripsi | Auth |
|---|---|---|---|
| GET | `/health` | Health check (DB up/down) | none |
| POST | `/auth/login` | Login → `{ accessToken, refreshToken, user }` | none |
| POST | `/auth/refresh` | Rotasi pasangan token (`{ refreshToken }`) | none |
| POST | `/auth/logout` | Cabut sesi (hapus refresh hash) | bearer |
| GET | `/auth/me` | Profil user yang login | bearer |
| POST | `/auth/change-password` | Ganti password sendiri | bearer |
| GET/POST | `/departments`, `/departments/:id` (GET/PATCH/DELETE) | Master departemen (hierarki, soft delete) | GET: bearer; tulis: admin/hrd |
| GET/POST | `/positions`, `/positions/:id` (GET/PATCH/DELETE) | Master posisi | GET: bearer; tulis: admin/hrd |
| GET | `/employees?page&limit&search&departmentId&positionId&employmentStatus` | List karyawan (pagination) | admin/hrd/manager |
| GET | `/employees/:id` | Detail karyawan (+ user akun) | admin/hrd/manager |
| POST | `/employees` | Buat karyawan | admin/hrd |
| PATCH | `/employees/:id` | Update karyawan | admin/hrd |
| DELETE | `/employees/:id` | Nonaktifkan (soft delete + akun user) | admin/hrd |
| GET/POST | `/shifts`, `/shifts/:id` (GET/PATCH/DELETE) | Master shift kerja | GET: bearer; tulis: admin/hrd |
| POST | `/attendances/check-in` | Check-in + geofence (`office.location`, `office.radius_meters`) | bearer |
| POST | `/attendances/check-out` | Check-out + hitung `workHours`/`earlyLeaveMinutes` | bearer |
| GET | `/attendances/my?page&limit&from&to` | Riwayat kehadiran sendiri | bearer |
| GET | `/attendances?page&limit&employeeId&from&to` | Rekap semua karyawan | admin/hrd |
| GET | `/leaves/types?includeInactive` | Daftar jenis cuti | bearer |
| POST/PATCH/DELETE | `/leaves/types` `/leaves/types/:id` | Kelola jenis cuti | admin/hrd |
| GET | `/leaves/balances/my?year` | Saldo cuti sendiri per tahun | bearer |
| GET | `/leaves/balances?year&employeeId` | Semua saldo cuti | admin/hrd |
| POST | `/leaves/requests` | Ajukan cuti (diri sendiri) | bearer |
| GET | `/leaves/requests/my?page&limit&status` | Pengajuan sendiri | bearer |
| GET | `/leaves/requests?page&limit&status&employeeId` | Semua pengajuan | admin/hrd/manager |
| POST | `/leaves/requests/:id/decide` | Approve/tolak (`{status, rejectionReason?}`) | admin/hrd/manager |
| POST | `/leaves/requests/:id/cancel` | Batalkan pengajuan sendiri (hanya pending) | bearer |
| POST | `/overtime/requests` | Ajukan lembur (`overtimeDate`, `startTime`, `endTime`, `purpose`; jam dihitung otomatis) | bearer |
| GET | `/overtime/requests/my?page&limit&status` | Pengajuan lembur sendiri | bearer |
| GET | `/overtime/requests?page&limit&status&employeeId` | Semua pengajuan lembur | admin/hrd/manager |
| POST | `/overtime/requests/:id/decide` | Approve/tolak lembur | admin/hrd/manager |
| POST | `/overtime/requests/:id/cancel` | Batalkan sendiri (pending; baris dihapus) | bearer |
| GET | `/dashboard/summary` | Ringkasan per role: `employee` (kehadiran hari ini, saldo cuti, pending, riwayat 7 hari) / `manager` (+ approvals & statistik tim) / `admin` (+ statistik perusahaan & sebaran departemen) | bearer |

## Endpoint aktif (Fase 2 — Payroll, Pengumuman, Notifikasi, Pengaturan)

| Method | Path | Deskripsi | Auth |
|---|---|---|---|
| GET/POST | `/payroll/salary-components`, PATCH/DELETE `:id` | Kelola komponen gaji (fixed/percentage, allowance/deduction; deactivate ditolak jika sudah dipakai slip) | admin/hrd/owner |
| POST | `/payroll/generate` | Generate slip `{month, year}` — engine: gaji pokok + komponen (snapshot), lembur (basic/173 × 1.5 × jam approved), BPJS dari `bpjs.rates`, PPh21 TER (tabel `ter_rates`); idempotent (`skipped`) | admin/hrd/owner |
| GET | `/payroll?month&year&status&page&limit` | Semua slip (pagination) | admin/hrd/owner |
| GET | `/payroll/:id` | Detail slip + komponen | admin/hrd/owner |
| POST | `/payroll/approve` | Batch `{payPeriods:[{payrollId}]}` draft → approved | admin/hrd/owner |
| POST | `/payroll/mark-paid` | Batch `{payrollIds}` approved → paid (set `paymentDate`) | admin/hrd/owner |
| GET | `/payroll/my?month&year&status&page&limit` | Slip gaji sendiri | bearer |
| GET | `/payroll/my/:id` | Detail slip sendiri (403 jika bukan miliknya) | bearer |
| GET | `/payroll/:id/payslip` | Unduh PDF slip gaji (header `Content-Disposition: attachment`) | admin/hrd/owner |
| GET | `/payroll/my/:id/payslip` | Unduh PDF slip sendiri | bearer |
| POST | `/announcements` | Buat pengumuman draft (title/content/priority/targetAudience/publishDate/expiryDate + target departemen/posisi/karyawan) | admin/hrd/owner |
| PATCH | `/announcements/:id` | Perbarui pengumuman | admin/hrd/owner |
| POST | `/announcements/:id/publish` | Publikasikan + kirim push FCM ke token target | admin/hrd/owner |
| DELETE | `/announcements/:id` | Hapus pengumuman | admin/hrd/owner |
| GET | `/announcements?page&limit&status&keyword` | Semua pengumuman (filter draft/published) | admin/hrd/owner |
| GET | `/announcements/my?page&limit` | Pengumuman terbit yang sesuai target user (`all`/departemen/posisi/individu) + `isRead` | bearer |
| POST | `/announcements/read` | Tandai dibaca `{announcementId}` (upsert `announcement_reads`) | bearer |
| GET | `/announcements/unread-count` | Jumlah pengumuman belum dibaca untuk user | bearer |
| POST | `/notifications/register-device` | Daftarkan token FCM `{token, platform}` (upsert per `(employeeId, token)`); FCM dikirim saat publish bila `FCM_SERVER_KEY` terisi, selain itu log warning | bearer |
| GET/PUT | `/settings/company` | Baca/ubah pengaturan perusahaan (whitelist key: `company.name`, `office.location`, `office.radius_meters`, `bpjs.rates`, `overtime.rate_multiplier_weekday`) | admin/hrd/owner |
| GET/POST | `/settings/holidays`, PATCH/DELETE `:id` | Kalender hari libur (filter `year`; tanggal unik, `isRecurringYearly` opsional) | admin/hrd |

### Payslip PDF

- PDF di-generate on-demand dengan **pdfkit** (A4): header perusahaan (`company.name`), identitas karyawan, tabel PENERIMAAN (gaji pokok, lembur, komponen allowance, total bruto) & POTONGAN (BPJS, PPh21, komponen deduction, total potongan), lalu **GAJI BERSIH**.
- Dikenai RBAC yang sama dengan detail slip: karyawan hanya bisa slip sendiri (`/my/:id/payslip`), admin/hrd/owner semua.

### Pengumuman & Notifikasi

- Targeting: `all` → semua; `department` → wajib `targetDepartmentId`; `position` → wajib `targetPositionId`; `specific` → wajib `targetEmployeeId`. `/my` & `/unread-count` memfilter sesuai departemen/posisi user.
- Publish mengirim push notification (FCM legacy API) ke `device_tokens` target; jika `FCM_SERVER_KEY` kosong → request sukses dengan mode `unconfigured` (log warning) — API tetap stabil.
- `expiryDate` opsional; pengumuman kedaluwarsa tidak muncul di `/my`.

Aturan tulis (write) dilindungi `@Roles('admin','hrd')`; role hierarki memungkinkan level lebih tinggi (mis. owner) tetap bisa.

### Shift & Kehadiran

- Shift: `startTime`/`endTime` format `HH:mm` atau `HH:mm:ss` (dinormalisasi ke `HH:mm:ss`); `gracePeriodMinutes` (default 15) & `workHours` (default 8) wajib dikirim; DELETE shift ditolak bila sudah dipakai attendance.
- Check-in: dalam radius kantor (default 100 m dari `office.location`) → status `present`/`late` (late = melewati `startTime + grace`); satu baris per `(employee_id, attendance_date)` — check-in ganda → `409`.
- Check-out: tanpa check-in → `404`; dua kali → `409`; `workHours` dihitung (check-out − check-in), `earlyLeaveMinutes` bila pulang sebelum akhir shift.
- Tanggal disimpan sebagai UTC-midnight dari tanggal lokal (`localDateKey`) agar konsisten lintas zona server/database.

### Cuti

- Jenis cuti (seed: CT 12th, CS, CM, CK, CA, CIS) — syarat `minNoticeDays` & `maxConsecutiveDays` per jenis; `annualQuota > 0` wajib punya saldo `leave_balances`.
- `totalDays` dihitung dari **hari kerja** (Sen–Jum) inklusif.
- Validasi ajuan: jenis aktif, notifikasi minimum, panjang maks hari beruntun, tidak tumpang tindih (pending/approved), saldo cukup (`409` saat kurang).
- Approve → `leaveBalance.used` naik & `remaining` turun di dalam transaksi (`$transaction`); hanya ajuan `pending` yang bisa diputuskan (ulang → `409`); tolak wajib `rejectionReason`.
- Cancel hanya untuk pemilik & status `pending`.

### Lembur

- `hours` dihitung otomatis dari `startTime`–`endTime` (desimal, 2 digit); `startTime`/`endTime` `HH:mm`/`HH:mm:ss`.
- Nomor request `OT-YYYYMMDD-XXXX`; decide ulang → `409`; cancel hanya pemilik & `pending` (baris dihapus — enum tanpa status `cancelled`).

### Dashboard

- `GET /dashboard/summary` memilih payload berdasarkan role pemanggil (union `role` field):
  - `employee`: `today.attendance` (status/jam/telat/jam kerja/nama shift), `leaveBalances` (tahun berjalan), `pendingLeave`, `pendingOvertime`, `recentAttendance` (7 hari terakhir).
  - `manager`: tambahan `approvals` (10 pending cuti+lembur teratas) & `team` (total bawahan, hadir/telat/cuti hari ini).
  - `hrd/admin/owner`: tambahan `stats` (karyawan aktif, hadir/telat/absent/cuti hari ini, pending, jam lembur bulan berjalan) & `departments` (sebaran karyawan aktif per departemen).
- `absentToday` = karyawan aktif − hadir − telat − cuti (approval hari ini).

### RBAC

`UserRole`: `owner > admin > hrd > manager > employee` (hierarki). Endpoint dapat diberi
batasan via `@Roles('hrd', 'manager')` — user dengan role setara atau lebih tinggi diizinkan.
Guard global: `JwtAuthGuard` (401 jika token hilang/tidak valid) + `RolesGuard` (403 jika hak tidak cukup).

### Alur token

1. `POST /auth/login` → simpan `accessToken` (TTL `JWT_ACCESS_TTL`, default 15m) + `refreshToken` (7d, hash bcrypt disimpan di `users.refresh_token_hash`).
2. Saat access token habis: `POST /auth/refresh` → pasangan baru (rotasi; hash lama diganti).
3. Refresh token yang dipakai ulang (tidak cocok hash) → **seluruh sesi dicabut** (anti-replay).
4. `POST /auth/logout` atau ganti password → sesi di-cabut.

## Roadmap endpoint (per fase — lihat PROJECT_PLAN Bagian 4)

- **Fase 1:** ✅ selesai (auth, master data, shifts, attendances, leaves, overtime, dashboard) — UI web ✅ (login, dashboard role-aware, kehadiran, cuti, lembur, persetujuan, karyawan) — UI mobile ✅ (login, home, check-in/out GPS, cuti, lembur, profil) — sisa: hardening
- **Fase 2:** ✅ `payroll/*` (salary-components CRUD, generate engine BPJS+PPh21 TER, list/detail, approve, mark-paid, my payslip; UI web penggajian role-aware) · ✅ payslip PDF (`GET /payroll/:id/payslip`, `GET /payroll/my/:id/payslip` — unduh PDF via tombol di web) · ✅ `announcements/*` (CRUD, publish + push FCM, my list target-aware, mark-read, unread-count; UI web pengumuman role-aware) · ✅ `notifications/*` (register-device token FCM; graceful skip jika `FCM_SERVER_KEY` kosong) · ✅ `settings/company` + `settings/holidays` (UI web pengaturan) — sisa: `uploads`, notifikasi FCM aktif (isi `FCM_SERVER_KEY`), UI mobile announcements/payslip
- **Fase 3:** `reports/*`, performance/training/asset/document modules

## Contoh request/response kunci

Lihat `PLAN.md` §4 untuk detail: `POST /auth/login`, `POST /attendances/check-in`, `POST /payroll/generate`.