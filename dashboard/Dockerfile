# Imagem de PRODUÇÃO do dashboard. Contexto de build = RAIZ do repositório
# (docker build -f dashboard/Dockerfile .) para usar o package-lock do monorepo.
ARG NODE_IMAGE=node:20-alpine

FROM ${NODE_IMAGE} AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY dashboard/package.json dashboard/
COPY mcp_server/package.json mcp_server/
RUN mkdir -p dashboard/node_modules \
 && npm ci --workspace dashboard --include-workspace-root=false --no-audit --no-fund

FROM deps AS build
COPY dashboard dashboard
# NEXT_PUBLIC_* é embutido no bundle durante o build (não basta env de runtime)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app/dashboard
RUN mkdir -p public && npm run build

# ---- runtime: saída standalone do Next (raiz de tracing = raiz do monorepo) ----
FROM ${NODE_IMAGE}
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/dashboard/.next/standalone ./
COPY --from=build --chown=node:node /app/dashboard/.next/static ./dashboard/.next/static
COPY --from=build --chown=node:node /app/dashboard/public ./dashboard/public
USER node
EXPOSE 3000
CMD ["node", "dashboard/server.js"]
