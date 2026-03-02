# ==========================
# Backend - Sistema de Gestão Educacional
# Multi-stage build
# ==========================

# Stage 1: Build
FROM node:20-alpine3.18 AS builder

WORKDIR /app

# Set NODE_ENV to development for build stage (install devDependencies)
ENV NODE_ENV=development

# Copiar arquivos de dependências
COPY package.json ./
COPY prisma ./prisma/

# Instalar TODAS as dependências (incluindo devDependencies para tsc)
RUN npm install --include=dev

# Gerar Prisma Client
RUN npx prisma generate

# Copiar código fonte
COPY tsconfig.json ./
COPY src ./src/

# Build TypeScript usando o tsc local
RUN ./node_modules/.bin/tsc

# Stage 2: Production
FROM node:20-alpine3.18 AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiar dependências de produção
COPY package.json ./
RUN npm install --omit=dev

# Copiar Prisma schema e gerar client
COPY prisma ./prisma/
RUN npx prisma generate

# Copiar build
COPY --from=builder /app/dist ./dist/

# Copiar arquivos estáticos
COPY public ./public/

# Criar diretório de uploads
RUN mkdir -p uploads/documentos

# Expor porta
EXPOSE 3200

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3200/health || exit 1

# Iniciar aplicação
CMD ["node", "dist/server.js"]
