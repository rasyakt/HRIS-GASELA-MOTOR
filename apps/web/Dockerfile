# Build context = ROOT repo (lihat docker/docker-compose.prod.yml)

FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /app

# 1. Salin konfigurasi workspace & package.json saja (Layer Cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/shared-config/ ./packages/shared-config/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY apps/web/package.json ./apps/web/

# 2. Konfigurasi registry Cloudflare CDN & timeout agar cepat dan stabil
RUN pnpm config set registry https://registry.yarnpkg.com && \
    pnpm config set fetch-timeout 300000 && \
    pnpm config set fetch-retries 5

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @gasela/web...

# 3. Salin seluruh kode sumber setelah node_modules selesai di-cache
COPY packages/ packages/
COPY apps/web/ apps/web/

# API diakses dari server (SSR) via proxy internal compose
ENV NEXT_PUBLIC_API_URL=http://backend:3001

# 4. Build paket
RUN pnpm --filter @gasela/shared-types build
RUN pnpm --filter @gasela/shared-utils build
RUN pnpm --filter @gasela/web build

FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
WORKDIR /app

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
