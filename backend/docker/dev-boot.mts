// Executado pelo `tsx watch` a cada (re)início no container de desenvolvimento.
// 1. dependências mudaram → derruba o container (restart policy + entrypoint reinstalam)
// 2. schema mudou → prisma generate
// 3. sempre → prisma migrate deploy (aplica SÓ migrations pendentes; nunca reseta)
// 4. sobe a API (src/server.ts)
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

// Mesmo cálculo do dev-entrypoint.sh: sha256 da concatenação dos arquivos
const hashDe = (...arquivos: string[]) =>
  createHash("sha256")
    .update(Buffer.concat(arquivos.map((a) => readFileSync(a))))
    .digest("hex");

const lockAtual = hashDe("/repo/package-lock.json", "/repo/backend/package.json");
const lockInstalado = existsSync("/repo/node_modules/.dev-lock-hash")
  ? readFileSync("/repo/node_modules/.dev-lock-hash", "utf8").trim()
  : "";
if (lockAtual !== lockInstalado) {
  console.log("📦 package-lock.json mudou — reiniciando o container para reinstalar...");
  process.kill(1, "SIGTERM");
  await new Promise(() => {}); // aguarda o término
}

const prisma = (...args: string[]) =>
  execFileSync("npx", ["prisma", ...args], { stdio: "inherit" });

const MARCA_SCHEMA = "/repo/backend/node_modules/.dev-schema-hash";
const schemaAtual = hashDe("prisma/schema.prisma");
const schemaGerado = existsSync(MARCA_SCHEMA) ? readFileSync(MARCA_SCHEMA, "utf8").trim() : "";
if (schemaAtual !== schemaGerado) {
  console.log("🧬 schema.prisma mudou — gerando Prisma Client...");
  prisma("generate");
  writeFileSync(MARCA_SCHEMA, schemaAtual);
}

console.log("🗄️  Aplicando migrations pendentes...");
prisma("migrate", "deploy");

await import("../src/server.js");
