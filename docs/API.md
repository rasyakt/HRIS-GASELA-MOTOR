# API Reference — Gasela HRIS

> Base URL: `http://localhost:3001/api` (dev)
> Swagger interaktif: `http://localhost:3001/api/docs` (export JSON: `/api/docs-json`)

## Authentication

Semua endpoint (kecuali `POST /auth/login` & `GET /health`) dilindungi bearer token.
Header: `Authorization: Bearer <accessToken>`.

## Endpoint aktif (Fase 1 — Autentikasi)

| Method | Path | Deskripsi | Auth |
|---|---|---|---|
| GET | `/health` | Health check (DB up/down) | none |
| POST | `/auth/login` | Login → `{ accessToken, refreshToken, user }` | none |
| POST | `/auth/refresh` | Rotasi pasangan token (`{ refreshToken }`) | none |
| POST | `/auth/logout` | Cabut sesi (hapus refresh hash) | bearer |
| GET | `/auth/me` | Profil user yang login | bearer |
| POST | `/auth/change-password` | Ganti password sendiri | bearer |

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

- **Fase 1:** `auth/*`, `employees/*`, `departments/*`, `positions/*`, `attendances/*`, `shifts/*`, `overtime/*`, `leaves/*`, `dashboard/*`
- **Fase 2:** `payroll/*`, `announcements/*`, `notifications/*`, `settings/company`, `uploads`
- **Fase 3:** `reports/*`, performance/training/asset/document modules

## Contoh request/response kunci

Lihat `PLAN.md` §4 untuk detail: `POST /auth/login`, `POST /attendances/check-in`, `POST /payroll/generate`.