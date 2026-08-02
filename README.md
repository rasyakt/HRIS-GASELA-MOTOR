# GASELA HRIS

Sistem HRIS Gasela Motor — full-stack monorepo (backend NestJS, web Next.js, mobile React Native).
Lihat `PROMPT_NGODING_PAKE_AI.md` dan `docs/` untuk konteks lengkap proyek.

## Struktur

| Path | Deskripsi |
|---|---|
| `apps/backend` | NestJS API + Prisma + MySQL |
| `apps/web` | Next.js 14+ (App Router) portal HRD/Manager/Owner |
| `apps/mobile` | React Native (Expo) app karyawan |
| `packages/shared-types` | Zod schemas + TS types (single source of truth) |
| `packages/shared-config` | base eslint/tsconfig/prettier |
| `packages/shared-utils` | date/currency formatter, konstanta BPJS |

## Prasyarat

- Node.js ≥ 20
- pnpm ≥ 9 (`npm i -g pnpm`)
- MySQL 8+ (Laragon / Docker)

## Setup lokal

```bash
pnpm install
# salin .env sesuai template di tiap app
cp apps/backend/.env.example apps/backend/.env
pnpm --filter backend prisma:migrate
pnpm --filter backend prisma:seed
pnpm dev
```

## Scripts (root)

| Script | Fungsi |
|---|---|
| `pnpm dev` | Run semua app dev mode (Turborepo) |
| `pnpm build` | Build semua app |
| `pnpm lint` | Lint semua package |
| `pnpm typecheck` | Typecheck semua package |
| `pnpm test` | Test semua package |