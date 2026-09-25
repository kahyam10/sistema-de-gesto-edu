// Ponto de entrada da API: sobe o servidor HTTP.
// A montagem da aplicação fica em app.ts (importável pelos testes via app.inject).
import { buildApp } from "./app.js";

async function start() {
  try {
    const app = await buildApp();
    const port = parseInt(process.env.PORT || "3051");
    const host = process.env.HOST || "0.0.0.0";

    await app.listen({ port, host });

    console.log(`
    🚀 Servidor rodando em http://localhost:${port}
    📚 Documentação: http://localhost:${port}/docs
    🏥 Health check: http://localhost:${port}/health
    `);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
