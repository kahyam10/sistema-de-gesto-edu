# ==========================
# Backend - Sistema de Gestão Educacional
# Multi-stage build
# ==========================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm install

# Gerar Prisma Client
RUN npx prisma generate

# Copiar código fonte
COPY tsconfig.json ./
COPY src ./src/

# Build TypeScript
RUN npx tsc

# Stage 2: Production
FROM node:20-alpine AS runner

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
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3200/health || exit 1

# Iniciar aplicação
CMD ["node", "dist/server.js"]
