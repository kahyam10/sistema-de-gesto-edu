#!/bin/sh
# Boot do container de desenvolvimento: garante dependências e sobe a API em watch.
set -eu
cd /repo

HASH=$(cat package-lock.json backend/package.json | sha256sum | cut -d' ' -f1)
if [ "$(cat node_modules/.dev-lock-hash 2>/dev/null || true)" != "$HASH" ]; then
  echo "📦 Dependências mudaram (ou 1º boot) — npm ci do workspace backend..."
  npm ci --workspace backend --include-workspace-root=false --no-audit --no-fund
  echo "$HASH" > node_modules/.dev-lock-hash
fi

cd /repo/backend
# tsx reinicia ao salvar qualquer arquivo importado (src/**) e também quando
# o schema ou as migrations mudam; dev-boot.mts aplica as migrations antes de subir.
TSX=/repo/node_modules/.bin/tsx
[ -x "$TSX" ] || TSX=/repo/backend/node_modules/.bin/tsx
exec "$TSX" watch \
  --clear-screen=false \
  --include "prisma/schema.prisma" \
  --include "prisma/migrations/**/*.sql" \
  --include "../package-lock.json" \
  docker/dev-boot.mts
