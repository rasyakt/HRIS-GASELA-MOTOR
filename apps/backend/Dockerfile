# Build context = ROOT repo (lihat docker/docker-compose.prod.yml)

FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /app

# 1. Salin konfigurasi workspace, package.json & prisma schema saja (Layer Cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/shared-config/ ./packages/shared-config/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/prisma/ ./apps/backend/prisma/

# 2. Konfigurasi registry Cloudflare CDN & timeout agar cepat dan stabil
RUN pnpm config set registry https://registry.yarnpkg.com && \
    pnpm config set fetch-timeout 300000 && \
    pnpm config set fetch-retries 5

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @gasela/backend...

# 3. Salin seluruh kode sumber setelah node_modules selesai di-cache
COPY packages/ packages/
COPY apps/backend/ apps/backend/

RUN pnpm --filter @gasela/shared-types build
RUN pnpm --filter @gasela/shared-utils build
RUN pnpm --filter @gasela/backend prisma:generate
RUN pnpm --filter @gasela/backend build

# Folder produksi mandiri: node_modules prod + package.json
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm --filter @gasela/backend deploy --legacy --prod /prod/backend

RUN cp -r /app/apps/backend/dist /prod/backend/dist && \
    cp -r /app/apps/backend/prisma /prod/backend/prisma && \
    (cp -r /app/apps/backend/scripts /prod/backend/scripts 2>/dev/null || true)

FROM node:22-alpine AS runner
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Jakarta /etc/localtime && \
    echo "Asia/Jakarta" > /etc/timezone
RUN corepack enable
ENV NODE_ENV=production
ENV TZ=Asia/Jakarta
WORKDIR /app

COPY --from=builder /prod/backend ./

# Prisma CLI untuk migrasi saat start (devDependency tidak ikut deploy --prod)
RUN npm install -g prisma@6.19.3
RUN prisma generate --schema=prisma/schema.prisma

EXPOSE 3001
CMD ["sh", "-c", "prisma migrate deploy --schema=prisma/schema.prisma && prisma generate --schema=prisma/schema.prisma && node dist/main"]
