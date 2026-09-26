# Imagem de PRODUÇÃO da API. Contexto de build = RAIZ do repositório
# (docker build -f backend/Dockerfile .): usa o package-lock.json do monorepo
# com `npm ci`, então o build é reprodutível.
ARG NODE_IMAGE=node:24-alpine

# ---- dependências (todas, para compilar) ----
FROM ${NODE_IMAGE} AS deps
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY dashboard/package.json dashboard/
COPY mcp_server/package.json mcp_server/
RUN mkdir -p backend/node_modules \
 && npm ci --workspace backend --include-workspace-root=false --no-audit --no-fund

# ---- build (tsc) ----
FROM deps AS build
COPY backend/prisma backend/prisma
COPY backend/tsconfig.json backend/
COPY backend/src backend/src
WORKDIR /app/backend
RUN npx prisma generate && npm run build

# ---- dependências de produção (inclui o prisma CLI p/ migrate deploy) ----
FROM ${NODE_IMAGE} AS prod-deps
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY dashboard/package.json dashboard/
COPY mcp_server/package.json mcp_server/
RUN mkdir -p backend/node_modules \
 && npm ci --omit=dev --workspace backend --include-workspace-root=false --no-audit --no-fund
COPY backend/prisma backend/prisma
RUN cd backend && npx prisma generate

# ---- runtime ----
FROM ${NODE_IMAGE}
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=prod-deps --chown=node:node /app/backend/node_modules ./backend/node_modules
COPY --from=build --chown=node:node /app/backend/dist ./backend/dist
COPY --chown=node:node backend/prisma ./backend/prisma
COPY --chown=node:node backend/package.json ./backend/
# Diretório do volume de uploads já pertencente ao usuário sem privilégios
RUN mkdir -p /app/uploads && chown node:node /app/uploads
USER node
WORKDIR /app/backend
EXPOSE 3051
# Aplica migrations pendentes, garante o admin inicial (idempotente) e sobe a API
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed-prod.cjs && node dist/server.js"]
