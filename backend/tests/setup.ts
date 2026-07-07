// Executa antes de cada arquivo de teste, antes de qualquer import de
// src/lib/prisma — garante que o client aponte para o banco de teste.
import { TEST_DATABASE_URL } from "./test-db-url.js";

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = "segredo-de-teste";
process.env.NODE_ENV = "test";
