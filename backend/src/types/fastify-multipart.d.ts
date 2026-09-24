// Ponte de tipos para o @fastify/multipart içado pelo npm workspaces para o
// node_modules da RAIZ do monorepo: lá o `declare module "fastify"` do pacote
// não resolve (o fastify vive em backend/node_modules), então a augmentação de
// request.file() se perde. Redeclaramos aqui, resolvendo 'fastify' localmente.
import type { MultipartFile } from "@fastify/multipart";
import type { BusboyConfig } from "@fastify/busboy";

declare module "fastify" {
  interface FastifyRequest {
    file(
      options?: Omit<BusboyConfig, "headers">
    ): Promise<MultipartFile | undefined>;
  }
}
