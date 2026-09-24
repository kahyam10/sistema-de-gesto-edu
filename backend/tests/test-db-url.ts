// URL do banco de TESTE — nunca fica no código.
// Ordem: variável de ambiente TEST_DATABASE_URL (CI / container de dev)
// → arquivo backend/.env.test (fora do git; modelo em .env.test.example).
import { existsSync } from "node:fs";

if (!process.env.TEST_DATABASE_URL && existsSync(".env.test")) {
  process.loadEnvFile(".env.test");
}

const url = process.env.TEST_DATABASE_URL;
if (!url) {
  throw new Error(
    "TEST_DATABASE_URL não definida. Crie backend/.env.test a partir de .env.test.example " +
      "ou rode os testes no container de dev (npm run test:docker na raiz)."
  );
}

// Trava de segurança: a suíte RESETA este banco. Só aceita bancos *_test.
const nomeBanco = new URL(url).pathname.replace(/^\//, "");
if (!nomeBanco.endsWith("_test")) {
  throw new Error(
    `TEST_DATABASE_URL aponta para "${nomeBanco}" — o banco de teste precisa terminar em _test (a suíte apaga tudo nele).`
  );
}

export const TEST_DATABASE_URL = url;
