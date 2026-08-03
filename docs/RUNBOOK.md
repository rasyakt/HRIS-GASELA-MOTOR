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

## Deploy production (Docker Compose)

```bash
# 1. Siapkan environment
cp .env.example .env                 # isi DB_ROOT_PASSWORD & CORS_ORIGINS
cp apps/backend/.env.example apps/backend/.env   # DATABASE_URL boleh tetap localhost (di-override compose)
cp apps/web/.env.example apps/web/.env

# 2. Jalankan
docker compose -f docker/docker-compose.prod.yml up -d --build

# 3. Verifikasi
curl http://localhost:3001/api/health
curl http://localhost:80            # web via nginx
```

- Backend container menjalankan `prisma migrate deploy` otomatis saat start.
- Database & upload tersimpan di volume Docker (`mysql-data`, `backend-uploads`).
- SSL Let's Encrypt via service `certbot` + nginx (folder `docker/nginx`).

## Backup MySQL

```bash
# Manual — dari host (pastikan DB_ROOT_PASSWORD sesuai)
docker compose -f docker/docker-compose.prod.yml exec mysql \
  sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" gasela_hris' > backup_$(date +%F).sql

# Schedule (crontab, setiap hari 02.00)
0 2 * * * cd /opt/gasela-hris && docker compose -f docker/docker-compose.prod.yml exec -T mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" gasela_hris' | gzip > backups/gasela_$(date +\%F).sql.gz
```

## Audit log

- Aksi kritikal (login, approve/reject cuti & lembur, approve/pay gaji, edit gaji, nonaktifkan karyawan) tercatat di tabel `audit_logs`.
- Lihat via API: `GET /api/audit-logs` (role admin/hrd/owner).

## Prosedur mendatang (isi saat fase sesuai selesai)
- [ ] Generate payroll bulanan
- [ ] Restore backup MySQL
- [ ] Rotasi JWT secret
- [ ] Renew SSL