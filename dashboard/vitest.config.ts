import { defineConfig } from "vitest/config";

import react from "@vitejs/plugin-react";
import path from "node:path";

// O vitest só define NODE_ENV=test quando a variável está vazia. Se o shell
// exportar NODE_ENV=production, o React carrega o build de produção (sem act)
// e os testes de componente quebram — força o ambiente de teste.
process.env.NODE_ENV = "test";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
