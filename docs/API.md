# API Reference — Gasela HRIS

> Base URL: `http://localhost:3001/api` (dev)
> Swagger interaktif: `http://localhost:3001/api/docs` (export JSON: `/api/docs-json`)

## Authentication

Semua endpoint (kecuali `POST /auth/login` & `GET /health`) dilindungi bearer token.
Header: `Authorization: Bearer <accessToken>`.

## Endpoint aktif (Fase 1 — Autentikasi, Master Data, Shift & Kehadiran)

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

Aturan tulis (write) dilindungi `@Roles('admin','hrd')`; role hierarki memungkinkan level lebih tinggi (mis. owner) tetap bisa.

### Shift & Kehadiran

- Shift: `startTime`/`endTime` format `HH:mm` atau `HH:mm:ss` (dinormalisasi ke `HH:mm:ss`); `gracePeriodMinutes` (default 15) & `workHours` (default 8) wajib dikirim; DELETE shift ditolak bila sudah dipakai attendance.
- Check-in: dalam radius kantor (default 100 m dari `office.location`) → status `present`/`late` (late = melewati `startTime + grace`); satu baris per `(employee_id, attendance_date)` — check-in ganda → `409`.
- Check-out: tanpa check-in → `404`; dua kali → `409`; `workHours` dihitung (check-out − check-in), `earlyLeaveMinutes` bila pulang sebelum akhir shift.
- Tanggal disimpan sebagai UTC-midnight dari tanggal lokal (`localDateKey`) agar konsisten lintas zona server/database.

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

- **Fase 1 (sisa):** `overtime/*`, `leaves/*`, `dashboard/*`
- **Fase 2:** `payroll/*`, `announcements/*`, `notifications/*`, `settings/company`, `uploads`
- **Fase 3:** `reports/*`, performance/training/asset/document modules

## Contoh request/response kunci

Lihat `PLAN.md` §4 untuk detail: `POST /auth/login`, `POST /attendances/check-in`, `POST /payroll/generate`.