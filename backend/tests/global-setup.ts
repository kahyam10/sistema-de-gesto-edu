import { execFileSync } from "node:child_process";
import { TEST_DATABASE_URL } from "./test-db-url.js";

// Cria/reseta o banco de teste (gestao_edu_test) antes da suíte.
// Requer o Postgres do docker compose rodando: docker compose up -d postgres
export default function setup() {
  execFileSync(
    "npx",
    ["prisma", "db", "push", "--force-reset", "--skip-generate"],
    {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: "inherit",
    }
  );
}
