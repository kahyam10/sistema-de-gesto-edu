// Executa antes de cada arquivo de teste, antes de qualquer import de
// src/lib/prisma — garante que o client aponte para o banco de teste.
process.env.DATABASE_URL = "file:./test.db";
process.env.JWT_SECRET = "segredo-de-teste";
process.env.NODE_ENV = "test";
