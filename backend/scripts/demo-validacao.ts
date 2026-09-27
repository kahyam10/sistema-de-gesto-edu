/**
 * Usuários de VALIDAÇÃO (100% fictícios) para testar o dashboard por papel no
 * ambiente de DEV. Complementa scripts/demo-apps.ts (precisa da escola demo).
 * Nunca rode em produção.
 *
 *   docker compose -f docker-compose.dev.yml exec -T backend \
 *     npx tsx scripts/demo-validacao.ts > /tmp/gestao-edu-validacao-senha
 *
 * Cria semec.e2e, dir.e2e, coord.e2e e sec.e2e (@teste.local). A senha, a mesma
 * para os quatro, é gerada na hora e sai SOMENTE no stdout; o resto vai para o
 * stderr. Se os usuários já existem, não altera nada.
 */
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prismaSemEscopo as prisma } from "../src/lib/prisma.js";

const log = (...m: unknown[]) => console.error("[demo-validacao]", ...m);

const USUARIOS = [
  { email: "semec.e2e@teste.local", nome: "Gestora SEMEC (demo)", role: "SEMEC", daEscola: false },
  { email: "dir.e2e@teste.local", nome: "Diretora (demo)", role: "DIRETOR", daEscola: true },
  { email: "coord.e2e@teste.local", nome: "Coordenadora (demo)", role: "COORDENADOR", daEscola: true },
  { email: "sec.e2e@teste.local", nome: "Secretário escolar (demo)", role: "SECRETARIA", daEscola: true },
];

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Script de demonstração não roda em produção.");
  const escola = await prisma.escola.findUnique({ where: { codigo: "DEMO-APPS" }, select: { id: true } });
  if (!escola) {
    log("Escola demo não encontrada: rode antes scripts/demo-apps.ts.");
    process.exitCode = 1;
    return;
  }
  const existentes = await prisma.user.count({ where: { email: { in: USUARIOS.map((u) => u.email) } } });
  if (existentes > 0) {
    log("Usuários de validação já existem; nada foi alterado.");
    process.exitCode = 2;
    return;
  }
  const senha = randomBytes(12).toString("base64url");
  const hash = await bcrypt.hash(senha, 10);
  for (const u of USUARIOS) {
    await prisma.user.create({
      data: { email: u.email, nome: u.nome, role: u.role, password: hash, escolaId: u.daEscola ? escola.id : null },
    });
  }
  log(`Criados: ${USUARIOS.map((u) => `${u.email} (${u.role})`).join(", ")}`);
  process.stdout.write(senha + "\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
