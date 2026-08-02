# RUNBOOK — Gasela HRIS

> Prosedur operasional. Isi per item saat modul terkait selesai (Fase 2+: payroll, backup, rotasi secret).

## Setup lokal (Fase 0)

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
pnpm --filter @gasela/backend prisma:migrate   # migrate dev
pnpm --filter @gasela/backend prisma:seed
pnpm dev
```

- Backend: http://localhost:3001/api (Swagger: `/api/docs`)
- Web: http://localhost:3000

## Akun seed default

| username | password | role |
|---|---|---|
| `admin` | `Admin123!` | admin |

> Ganti password segera setelah login pertama.

## Prosedur mendatang (isi saat fase sesuai selesai)
- [ ] Generate payroll bulanan
- [ ] Restore backup MySQL
- [ ] Rotasi JWT secret
- [ ] Renew SSL