import { execFileSync } from "node:child_process";
import { TEST_DATABASE_URL } from "./test-db-url.js";

// Recria o banco de teste (gestao_edu_test) antes da suíte aplicando as
// MIGRATIONS reais (não db push) — assim a suíte também valida as migrations.
// test-db-url.ts garante que o banco termina em _test.
export default function setup() {
  execFileSync(
    "npx",
    ["prisma", "migrate", "reset", "--force", "--skip-seed", "--skip-generate"],
    {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: "inherit",
    }
  );
}
