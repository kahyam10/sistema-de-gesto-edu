// Executa antes de cada arquivo de teste, antes de qualquer import de
// src/lib/prisma — garante que o client aponte para o banco de teste.
import { TEST_DATABASE_URL } from "./test-db-url.js";
import { configurarZodPtBr } from "../src/lib/zod-pt-br.js";

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = "segredo-de-teste";
process.env.NODE_ENV = "test";
// Storage local isolado para os testes de upload (limpo pelo próprio teste)
process.env.UPLOADS_DIR = "./.uploads-test";
process.env.STORAGE_DRIVER = "local";

// Mesmo errorMap PT-BR do boot do servidor
configurarZodPtBr();
