# ==========================
# MCP Server - Sistema de Gestão Educacional
# ==========================

FROM node:20-alpine AS builder

WORKDIR /app

# Set NODE_ENV to development for build stage (install devDependencies)
ENV NODE_ENV=development

COPY package.json tsconfig.json ./
RUN npm install --include=dev --ignore-scripts

COPY src ./src/
RUN ./node_modules/.bin/tsc

# Production
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
RUN npm install --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist/

EXPOSE 3202

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3202/health || exit 1

CMD ["node", "dist/index.js"]
