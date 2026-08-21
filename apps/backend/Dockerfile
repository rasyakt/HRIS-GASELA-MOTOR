# syntax=docker/dockerfile:1
# Build context = ROOT repo (lihat docker/docker-compose.prod.yml)

FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/ packages/
COPY apps/backend/ apps/backend/

# Optimasi timeout koneksi & hanya install dependensi backend (abaikan mobile/web)
RUN pnpm config set fetch-timeout 600000 && \
    pnpm config set fetch-retries 5 && \
    pnpm install --frozen-lockfile --filter @gasela/backend...

RUN pnpm --filter @gasela/shared-types build
RUN pnpm --filter @gasela/shared-utils build
RUN pnpm --filter @gasela/backend prisma:generate
RUN pnpm --filter @gasela/backend build

# Folder produksi mandiri: node_modules prod + package.json
RUN pnpm --filter @gasela/backend deploy --legacy --prod /prod/backend
RUN cp -r /app/apps/backend/dist /prod/backend/dist && \
    cp -r /app/apps/backend/prisma /prod/backend/prisma

FROM node:22-alpine AS runner
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /prod/backend ./

# Prisma CLI untuk migrasi saat start (devDependency tidak ikut deploy --prod)
RUN npm install -g prisma@6.19.3
RUN prisma generate --schema=prisma/schema.prisma

EXPOSE 3001
CMD ["sh", "-c", "prisma migrate deploy --schema=prisma/schema.prisma && prisma generate --schema=prisma/schema.prisma && node dist/main"]
