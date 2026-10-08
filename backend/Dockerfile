# ---------- build stage ----------
# build context คือ "รากของ repo" เพราะ pnpm workspace เก็บ lockfile ไว้ที่ราก
#   docker build -f backend/Dockerfile .
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable pnpm

# `prisma generate` ต้องมี DATABASE_URL
# การ generate ไม่ได้ต่อฐานข้อมูล ค่านี้จึงเป็น placeholder ตอน build
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build_only

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/ backend/

RUN pnpm install --frozen-lockfile --filter backend...

RUN pnpm --filter backend exec prisma generate \
 && pnpm --filter backend build


# ---------- runtime stage ----------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable pnpm

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json backend/

# Prisma postinstall ต้องเห็น schema/config ตอน pnpm install
COPY backend/prisma ./backend/prisma
COPY backend/prisma.config.ts ./backend/prisma.config.ts

# ห้ามใช้ --ignore-scripts เพราะ Prisma engines ต้องติดตั้ง
# ลบ pnpm store ใน RUN เดียวกันเพื่อไม่ให้ store ติดไปใน image
RUN pnpm install --frozen-lockfile --prod --filter backend... \
 && pnpm store prune

# dist/ มีทั้งโค้ดที่ compile แล้วและ Prisma client
COPY --from=builder /app/backend/dist ./backend/dist

COPY backend/docker/entrypoint.sh ./backend/docker/entrypoint.sh

# ไม่ chown -R ทั้ง /app ตาม deployment standard
RUN chmod +x ./backend/docker/entrypoint.sh

USER node

WORKDIR /app/backend

EXPOSE 4000

ENTRYPOINT ["./docker/entrypoint.sh"]

CMD ["node", "dist/src/main.js"]