# API Reference — Gasela HRIS

> Base URL: `http://localhost:3001/api` (dev)
> Swagger interaktif: `http://localhost:3001/api/docs` (export JSON: `/api/docs-json`)

## Authentication

Semua endpoint (kecuali `POST /auth/login` & `GET /health`) dilindungi bearer token.
Header: `Authorization: Bearer <accessToken>`.

## Endpoint aktif (Fase 0)

| Method | Path | Deskripsi | Auth |
|---|---|---|---|
| GET | `/health` | Health check (DB up/down) | none |

## Roadmap endpoint (per fase — lihat PROJECT_PLAN Bagian 4)

- **Fase 1:** `auth/*`, `employees/*`, `departments/*`, `positions/*`, `attendances/*`, `shifts/*`, `overtime/*`, `leaves/*`, `dashboard/*`
- **Fase 2:** `payroll/*`, `announcements/*`, `notifications/*`, `settings/company`, `uploads`
- **Fase 3:** `reports/*`, performance/training/asset/document modules

## Contoh request/response kunci

Lihat `PLAN.md` §4 untuk detail: `POST /auth/login`, `POST /attendances/check-in`, `POST /payroll/generate`.