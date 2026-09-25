# Mapa de portas — Sistema de Gestão Educacional

Faixa reservada deste projeto na máquina de desenvolvimento: **3050–3059**.
As mesmas portas valem para `docker-compose.dev.yml` (desenvolvimento) e
`docker-compose.yml` (produção local): suba **um ou outro**, não os dois.

| Porta | Serviço | Onde roda | Exposição |
|---|---|---|---|
| **3050** | Dashboard (Next.js) | `cd dashboard && npm run dev` (dev) · container `gestao-edu-dashboard` (prod local) | host |
| **3051** | API (Fastify) | container `gestao-edu-dev-backend` (dev) · `gestao-edu-backend` (prod local) | dev: só `127.0.0.1` |
| **3052** | PostgreSQL 16 | container `gestao-edu-dev-postgres` (dev) · `gestao-edu-postgres` (prod local) | dev: só `127.0.0.1` |
| 3053 | *reservada* — app mobile web / PWA (Expo), Fase 3 | — | — |
| 3054–3059 | *reservadas* | — | — |

Dentro da rede Docker o Postgres continua na 5432 (`postgres:5432`); a porta
3052 é só o mapeamento para o host (Prisma Studio, psql, testes fora do container).

## Produção (Coolify)

Em produção nada disso é exposto: o Coolify publica o dashboard e a API por
domínio (HTTPS 443) e o Postgres fica só na rede interna. A API continua
escutando na 3051 dentro do container (`PORT`), e o healthcheck é `GET /health`.

## Por que a faixa 3050

Outros projetos da mesma máquina ocupam 3010–3030, 3070–3081, 3100–3105,
3130–3132 e 3200–3205. Ao criar um serviço novo neste projeto, use a próxima
porta livre da faixa e atualize esta tabela.
