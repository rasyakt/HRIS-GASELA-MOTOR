# syntax=docker/dockerfile:1
# Build context = ROOT repo (lihat docker/docker-compose.prod.yml)

FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/ packages/
COPY apps/web/ apps/web/

# API diakses dari server (SSR) via proxy internal compose
ENV NEXT_PUBLIC_API_URL=http://backend:3001

# Optimasi timeout koneksi & hanya install dependensi web (abaikan mobile/backend)
RUN pnpm config set fetch-timeout 600000 && \
    pnpm config set fetch-retries 5 && \
    pnpm install --frozen-lockfile --filter @gasela/web...

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
