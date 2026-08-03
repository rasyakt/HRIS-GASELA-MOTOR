# syntax=docker/dockerfile:1
# Build context = ROOT repo (lihat docker/docker-compose.prod.yml)

FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/ packages/
COPY apps/backend/ apps/backend/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @gasela/shared-types build
RUN pnpm --filter @gasela/shared-utils build
RUN pnpm --filter @gasela/backend build

# Folder produksi mandiri: node_modules prod + package.json
RUN pnpm --filter @gasela/backend deploy --prod /prod/backend
COPY apps/backend/dist /prod/backend/dist
COPY apps/backend/prisma /prod/backend/prisma

FROM node:22-alpine AS runner
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /prod/backend ./

# Prisma CLI untuk migrasi saat start (devDependency tidak ikut deploy --prod)
RUN npm install -g prisma@6.19.3

EXPOSE 3001
CMD ["sh", "-c", "prisma migrate deploy --schema=prisma/schema.prisma && node dist/main"]
