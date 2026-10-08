# หน้าเว็บของระบบย่อย (Next.js standalone) — docs/deployment.md ข้อ 3
# build จากรากของ repo เพราะ pnpm workspace เก็บ lockfile ไว้ที่ราก:
#   docker build -f frontend/Dockerfile -t <ชื่อระบบ>-web .
#
# - BACKEND_URL ถูกฝังลง image ตอน build
#   rewrites ของ next.config.ts ถูกคำนวณตอน next build
# - ค่าเริ่มต้น http://api:4000 คือ service "api"
#   ใน compose ของระบบเดียวกัน — ไม่ต้องแก้
# - ห้ามใส่ secret ใน ARG / ENV

# ---------- build stage ----------
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NEXT_TELEMETRY_DISABLED=1

RUN corepack enable pnpm

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY frontend/package.json frontend/

RUN pnpm install --frozen-lockfile --filter frontend...

COPY frontend/ frontend/

# บางระบบไม่มี public/ — สร้างไว้ให้ COPY ของ stage ถัดไปไม่พัง
RUN mkdir -p frontend/public

# BACKEND_URL ถูกฝังลง image ตอน build
ARG BACKEND_URL=http://api:4000
ARG CORE_HUB_WEB_URL=https://csmju2030.jowave.com

ENV BACKEND_URL=$BACKEND_URL \
    CORE_HUB_WEB_URL=$CORE_HUB_WEB_URL

RUN pnpm --filter frontend build


# ---------- runtime stage ----------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

COPY --from=builder --chown=node:node /app/frontend/.next/standalone ./
COPY --from=builder --chown=node:node /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder --chown=node:node /app/frontend/public ./frontend/public

USER node

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "require('net').connect(3000,'127.0.0.1').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"

CMD ["node", "frontend/server.js"]