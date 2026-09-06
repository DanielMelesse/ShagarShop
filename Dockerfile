# Bun-based production image for Railway (use if Nixpacks is flaky).
# Railway: Settings → Build → Dockerfile path = Dockerfile

FROM oven/bun:1.2.21-alpine AS deps
WORKDIR /app
RUN apk add --no-cache bash openssl libc6-compat
COPY package.json bun.lock ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile

FROM oven/bun:1.2.21-alpine AS builder
WORKDIR /app
RUN apk add --no-cache bash openssl libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN bun run build

FROM oven/bun:1.2.21-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache bash openssl libc6-compat

COPY --from=builder /app/package.json /app/bun.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000

CMD ["bun", "run", "start:railway"]
