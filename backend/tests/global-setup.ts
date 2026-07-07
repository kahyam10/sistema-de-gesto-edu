import { execFileSync } from "node:child_process";

// Cria/reseta o banco de teste (prisma/test.db) antes da suíte.
// A URL relativa é resolvida a partir do diretório do schema (prisma/).
export default function setup() {
  execFileSync(
    "npx",
    ["prisma", "db", "push", "--force-reset", "--skip-generate"],
    {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: "file:./test.db" },
      stdio: "inherit",
    }
  );
}
