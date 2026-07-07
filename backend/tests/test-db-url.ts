// URL do banco de TESTE (banco separado no Postgres do docker compose).
// Sobrescreva com TEST_DATABASE_URL se o Postgres local usar outra porta/senha.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:9552a57204c16a9351f01130@localhost:5435/gestao_edu_test?schema=public";
