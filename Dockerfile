FROM node:22-alpine AS deps

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

# ---

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN apk add --no-cache libc6-compat netcat-openbsd \
  && addgroup -S brt && adduser -S brt -G brt

COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules

COPY tsconfig.json drizzle.config.ts ./
COPY data ./data
COPY src ./src
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh \
  && chown -R brt:brt /app

USER brt

EXPOSE 3001

ENTRYPOINT ["/entrypoint.sh"]
CMD ["npx", "tsx", "src/local/server.ts"]
