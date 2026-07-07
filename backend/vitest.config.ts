import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: "./tests/global-setup.ts",
    setupFiles: ["./tests/setup.ts"],
    // SQLite não suporta escritas concorrentes de vários processos:
    // os arquivos de teste rodam em sequência contra o mesmo test.db
    fileParallelism: false,
    include: ["tests/**/*.test.ts"],
  },
});
