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

# MCP Server uses stdio transport, no HTTP healthcheck needed

CMD ["node", "dist/index.js"]
