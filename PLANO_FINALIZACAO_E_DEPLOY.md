# Plano de Finalização e Deploy — Sistema de Gestão Educacional (Ibirapitanga-BA)

> **Data da análise:** 07/07/2026
> **Base:** auditoria completa de backend, dashboard e documentos de planejamento (PRD.md, ANALISE_PROJETO.md, tracker interno de módulos).
> **Stack real:** Backend Fastify 4 + Prisma 5 (SQLite dev → PostgreSQL prod) · Dashboard Next.js 15 App Router + React 19 + TanStack Query 5 · Monorepo npm workspaces.

---

## 1. Status Real do Sistema

### 1.1 Módulos do PRD vs realidade

O tracker interno (seed + banco + página /desenvolvimento) marca **todos os 9 módulos como "planning"/0%**, enquanto os docs (`copilot-instructions.md`, `ANALISE_PROJETO.md`) alegam mod-1 = 60% e mod-4 = 40%. **Ambos estão errados.** Status real apurado no código:

| # | Módulo (PRD) | Fase | Status real | Evidência |
|---|--------------|------|-------------|-----------|
| 1 | Gestão de Matrículas e Alunos | 1 | **~85% implementado** — CRUD completo de matrículas (criar, editar, cancelar, transferir, sem-turma, estatísticas), alunos, vagas por turma, limite PCD | `backend/src/routes/matriculas.routes.ts`, `dashboard/.../MatriculasManager.tsx` |
| 2 | Gestão Pedagógica | 2 | **~20%** — Calendário letivo completo (anos letivos, eventos, dias letivos); frequência, notas e planejamento **não iniciados** | `backend/src/services/calendario.service.ts`, `CalendarioLetivoManager.tsx` |
| 3 | Portais de Acesso | 2 | **~10%** — login/auth agora existe (07/2026); portais por papel (professor, aluno, diretor…) não iniciados | `dashboard/src/app/login/page.tsx` |
| 4 | Gestão de RH | 1 | **~50%** — CRUD de profissionais, formações, vínculo escola/turma, diretor por escola; lotação formal, folha de ponto e licenças **não iniciados** | `backend/src/routes/profissionais.routes.ts`, `ProfissionaisManager.tsx` |
| 5 | Programas Especiais | 4 | **0%** — não iniciado | — |
| 6 | Alimentação Escolar | 4 | **0%** — não iniciado | — |
| 7 | Transporte Escolar | 4 | **0%** — não iniciado | — |
| 8 | Gestão Democrática | 3 | **0%** — não iniciado | — |
| 9 | Comunicação e Eventos | 4 | **0%** — não iniciado | — |

### 1.2 Implementado além do plano (não consta no tracker)

- **Hierarquia de ensino de 4 níveis** (TipoEducacao → EtapaEnsino → NivelEnsino → Série → Turma) com CRUD completo — `HierarquiaEnsinoManager.tsx`.
- **Salas por escola** com estatísticas — `salas.routes.ts`, `SalasManager`.
- **Questionários do Censo Escolar INEP 2025** (escola, gestor, turma) — `dashboard/src/app/questionario-*` + `models/forms/`.
- **Infraestrutura escolar** (~40 campos por escola) — schema + `EscolaDetails`.
- **Tracker de desenvolvimento** (módulos/submódulos/fases) — dogfooding do próprio sistema.

### 1.3 Divergências de documentação

- `PRD.md`/`ANALISE_PROJETO.md` descrevem stack antiga (React+Vite+Spark useKV, "backend inexistente") — datados de nov/2025, **anteriores ao backend atual**.
- `Jest` citado nos docs; o backend configura **Vitest** (sem nenhum teste escrito).
- `spark.meta.json` ainda declara `dbType: kv`.
- Tabela de entidades do `copilot-instructions.md` omite `NivelEnsino`/`TipoEducacao`/`Sala`/`AnoLetivo`/`EventoCalendario`.

---

## 2. Correções críticas (P0) — ✅ APLICADAS em 07/07/2026

Tudo abaixo foi implementado, compilado e testado (curl + builds):

| # | Correção | Onde |
|---|----------|------|
| 1 | **Autenticação global**: todo `/api/*` exige JWT (401 sem token); públicos: `/api/auth/login`, `/health`, `/docs` | `backend/src/server.ts` (hook `onRequest`) |
| 2 | **RBAC mínimo**: `DELETE` de recursos exige ADMIN/SEMEC (403); DELETEs de vínculo (aluno/professor de turma, escola/formação de profissional) liberados para operação rotineira | `backend/src/server.ts` |
| 3 | **Registro admin-only**: `POST /api/auth/register` exige token ADMIN/SEMEC (fecha escalada de privilégio — o schema aceita `role`) | `backend/src/routes/auth.routes.ts` + `middleware/auth.ts` |
| 4 | **JWT expira** (`JWT_EXPIRES_IN`, padrão 7d) e **fail-fast em produção** sem `JWT_SECRET`/`CORS_ORIGIN`; CORS por env (lista separada por vírgula) | `backend/src/server.ts`, `.env.example` |
| 5 | **Atomicidade**: updates de escola/profissional (deleteMany+createMany de vínculos) agora em `prisma.$transaction` | `escola.service.ts`, `profissional.service.ts` |
| 6 | **Censo persiste de verdade**: coluna `dadosCenso` (JSON) em Escola/Turma/ProfissionalEducacao + `PUT /api/{escolas,turmas,profissionais}/:id/censo`; os 3 questionários salvam na API e recarregam do banco (fim do toast de sucesso falso e do localStorage) | migration `20260707044853_add_dados_censo`, páginas `questionario-*/[id]` |
| 7 | **Página de login** + `AuthGate` global (protege inclusive os questionários), logout no Sidebar, redirect automático em 401 | `dashboard/src/app/login/page.tsx`, `components/AuthGate.tsx`, `layout/Sidebar.tsx`, `lib/api.ts` |
| 8 | Badges de censo em `EscolaDetails` leem o banco (não mais localStorage); botão "Censo da Turma" em `TurmaDetails` | `EscolaDetails.tsx`, `TurmaDetails.tsx` |
| 9 | **URLs parametrizadas**: rewrite hardcoded removido do `next.config.js` (+ `output: "standalone"` p/ Docker); `dashboard/.env.example` com `NEXT_PUBLIC_API_URL` | `next.config.js`, `.env.example` |
| 10 | **Higiene**: `dev.db` fora do git (`git rm --cached` + `.gitignore`); 9 componentes órfãos + 3 `.bak` deletados | `backend/.gitignore`, `dashboard/src/components/` |

> ⚠️ **Deploy conjunto obrigatório**: backend e dashboard desta versão devem subir juntos — a API protegida com o dashboard antigo (sem login) inutiliza a UI.

---

## 3. Qualidade (P1) — ✅ APLICADA em 07/07/2026

| # | Item | Como ficou |
|---|------|------------|
| 1 | **Validação zod completa** | Novos schemas em `schemas/index.ts` (ano letivo, evento com `tipoEventoEnum` e `z.coerce.date`, phase, formação, vínculo escola, transferência) cabeados em `calendario/phase/profissionais/matriculas.routes.ts` — datas inválidas e enums falsos agora retornam 400 |
| 2 | **RBAC por papel nas escritas** | Tabela declarativa de regras no hook global (`server.ts`): estrutura da rede/planejamento e criação/exclusão de escolas = ADMIN/SEMEC; escritas operacionais (matrículas, turmas, profissionais, salas, censo) = equipe (ADMIN/SEMEC/DIRETOR/COORDENADOR/SECRETARIA); GET liberado a autenticados |
| 3 | **Histórico de transferência** | Model `TransferenciaMatricula` (migration `add_transferencia_matricula`); `transferir()` grava origem/destino/motivo em `$transaction`; `GET /api/matriculas/:id/transferencias` |
| 4 | **Enum-drift corrigido** | Comentário do schema atualizado com `INICIO_AULAS_REGULARES`/`FIM_AULAS_REGULARES` + validação real via `tipoEventoEnum` |
| 5 | **Lint consertado** | eslint 8 + @typescript-eslint instalados, `.eslintrc.cjs` criado — `npm run lint` passa com 0 erros/0 warnings |
| 6 | **Testes Vitest: 17/17 passando** | `tests/{auth,matricula,calendario}.service.test.ts` contra banco SQLite de teste isolado (`prisma/test.db`, reset via globalSetup); `npm test` agora é `vitest run` |
| 7 | **KPITab honesto** | "Atual" → "Linha de base (diagnóstico)"; texto de medição automática corrigido; techStack de `data.ts` atualizado para a stack real |
| 8 | **Tracker sincronizado** | Seed + banco: mod-1 in-progress 60%, mod-2 in-progress 20% (Calendários completed), mod-4 in-progress 20%, submódulos com status/observações reais, Fases 1-2 in-progress |
| 9 | **Padronizações** | `phases` registrado com prefix `/api/phases`; extensões `.js` unificadas; interfaces duplicadas de nivel-ensino/tipo-educacao removidas (tipos zod); +3 escritas não-atômicas de salas corrigidas com `$transaction`; `services/index.ts` re-exporta todos os services |
| 10 | **Docs atualizados** | `copilot-instructions.md` (hierarquia 4 níveis, endpoints, auth/RBAC, status real, estrutura do frontend); banners de atualização no `PRD.md` e `ANALISE_PROJETO.md` apontando para este documento |

**Pendências P1 restantes (menores):** RBAC ainda não checa *propriedade* (um DIRETOR pode editar qualquer escola, não só a sua); mensagens de erro zod retornam o JSON bruto do ZodError (funcional, mas feio); frontend sem testes.

---

## 4. Pré-produção (P2) — ✅ APLICADA em 07/07/2026

| # | Item | Como ficou |
|---|------|------------|
| 1 | **Prisma → PostgreSQL** | `provider = "postgresql"` no schema; **rebaseline feito** — migrations SQLite antigas removidas (preservadas no histórico git) e baseline única `init` gerada contra Postgres 16. Dev usa o Postgres do docker compose (porta **3052** do host, antes 5435); testes usam banco separado `gestao_edu_test` no mesmo Postgres (17/17 passando). Campos JSON continuam como `String` serializado — conversão para `Json` nativo fica como refinamento futuro (exige mudanças coordenadas no frontend) |
| 2 | **Seed de produção** | `backend/prisma/seed-prod.cjs` — idempotente, roda a cada boot: cria admin de `ADMIN_EMAIL`/`ADMIN_PASSWORD` (não sobrescreve senha se já existir; exige ≥8 caracteres) e a hierarquia de ensino padrão só se a tabela estiver vazia. **Zero `deleteMany`** |
| 3 | **Dockerfiles** | `backend/Dockerfile` multi-stage (build tsc + deps de produção com prisma CLI; boot = `migrate deploy` → `seed-prod` → `node dist/server.js`); `dashboard/Dockerfile` com `ARG NEXT_PUBLIC_API_URL` e runtime da saída `standalone`; `.dockerignore` em ambos; `prisma` CLI movido para `dependencies` (necessário no runtime) |
| 4 | **Swagger em produção** | `/docs` registrado apenas quando `NODE_ENV !== "production"` |
| 5 | **Compose local** | `docker-compose.yml` na raiz: postgres 16 (host 3052, volume `pgdata`, healthcheck) + backend (host 3051, healthcheck `/health`) + dashboard (host **3050**). Faixa 3050+ adotada em 09/2026 (ver `docs/MAPA_PORTAS.md`). Segredos via `.env` na raiz (gitignored; template em `.env.docker.example`) |

Pendência P2 restante: CI no GitHub Actions (build + testes em PRs) — opcional para o launch.

---

## 4b. Resgate da linha do servidor — ✅ APLICADO em 08/07/2026

Porte manual dos módulos auditados em [docs/AUDITORIA_LINHA_SERVIDOR.md](docs/AUDITORIA_LINHA_SERVIDOR.md), adaptados à hierarquia atual (Serie→Nível→Etapa), ao RBAC global e ao redesign:

| Resgate | Conteúdo | Rota |
|---|---|---|
| Sistema de erros | AppError + 166 códigos + handler (Zod/Prisma→HTTP) + logger pino + rate-limit 300/min | transversal |
| **Módulo 2 Pedagógico** | Frequência diária, notas com média ponderada, boletim com situação (média+frequência<75%), grade horária com PDF, relatório mensal, disciplinas, configuração de avaliação, recuperação, conselho de classe (muda status da matrícula), conflitos de horário — 6 models, 6 services, 10 telas | `/pedagogico` |
| **Módulo 5 Programas Especiais** | Busca ativa (visitas domiciliares + encaminhamentos a órgãos), Educação Especial (PEI/AEE/salas de recursos), acompanhamento individualizado — 7 models | `/programas` |
| **Módulo 9 Comunicação** | Comunicados com confirmação de leitura, notificações, plantão pedagógico, reuniões de pais com presença — 6 models | `/comunicacao` |
| **Módulo 4 RH** | Ponto digital com cálculo de horas, licenças com fluxo de aprovação (restrito à gestão), afastamentos/certificações/histórico + campos de RH no profissional | `/rh` |
| PDFs | Ficha e Declaração de matrícula (@react-pdf/renderer) no detalhe do aluno | — |

**Segurança do resgate:** backdoor de login da linha do servidor descartado; fallback de admin hardcodado removido da aprovação de licenças; leitura de licenças/pontos restrita à equipe operacional; RBAC estendido com perfil PEDAGOGICO (professor lança frequência/notas) e recibos de leitura abertos a autenticados. Tracker de módulos atualizado (M2 60%, M4 60%, M5 90%, M9 75%).

**Descartado conscientemente:** portais wrapper do M3 (órfãos), Cadastros regredidos, Docker/Swagger/paginação deles (já tínhamos melhor), auth-bypass.

## 4c. Dívidas antigas + ajustes do resgate — ✅ APLICADOS em 08/07/2026

Rodada final de qualidade sobre o código resgatado e as pendências acumuladas:

| # | Item | Entrega |
|---|---|---|
| F1 | Qualidade dos módulos resgatados | Guard `AppError`/`ZodError` nos 117 blocos catch das 17 rotas (erros de negócio deixam de virar 500); 404 com código de catálogo (NF_004–NF_014) nos services; boletim sem N+1 (1 query por turma); ponto com constraint única `profissionalId+data` + `$transaction` (elimina duplicata por corrida) |
| F2 | Saúde e emergência na matrícula | 9 campos (tipo sanguíneo, alergias, medicamentos, condições, cartão SUS, plano, contato de emergência) — migration, schema zod, formulário e ficha PDF |
| F3 | RBAC de propriedade | JWT passa a carregar `escolaId`; vínculo `User↔Profissional` no schema; DIRETOR só escreve na própria escola (validado ao vivo: 200 própria / 403 alheia) |
| F4 | Testes + CI | Backend 26 testes (auth, matrícula, calendário, pedagógico, RH/comunicação) em banco dedicado; dashboard 10 testes (nav por papel + UI); workflow GitHub Actions com Postgres de serviço |
| F5 | Dashboard executivo | Gráficos Recharts (barras alunos×capacidade, rosca por etapa) com dados reais; @react-pdf e grade horária em lazy-load (página pedagógico 513 kB → 34 kB) |
| F6 | **Dark mode completo** | Tokens do design (`surface/ink/hairline/softs`) convertidos para CSS vars com derivação dark na família do navy da marca; toggle sol/lua na topbar (next-themes, sem tema do SO); `color-scheme` para controles nativos; login permanece light por design (escopo `.force-light`); pílulas e botões soft com contraste corrigido nos dois temas; verificação visual Playwright (dashboard, escolas, pedagógico, diálogo, drawer mobile) |
| F7 | Verificação final | Builds backend+dashboard limpos, 26+10 testes verdes, imagens Docker reconstruídas e stack local no ar (health OK, API 401 sem token, login 200) |

**Adiado conscientemente (não bloqueia lançamento):** — ✅ **TUDO IMPLEMENTADO em 12–15/07/2026, ver §4d.**
- ~~Upload de documentos da matrícula~~ → feito (§4d.3)
- ~~Reimplementação dos portais do M3, módulos 6/7/8 e integrações externas~~ → feito (§4d.4–4d.7)

## 4d. Itens adiados — ✅ APLICADOS em 12–15/07/2026

Implementação integral da lista "adiado conscientemente", em duas ondas (fundações centrais + 6 frentes paralelas):

| # | Entrega | Conteúdo |
|---|---|---|
| 1 | **Erros zod amigáveis** | errorMap PT-BR global (`lib/zod-pt-br.ts`) + formatador central (`errors/zod-format.ts`): resposta `{ statusCode: 400, error: "VALIDATION", message, issues: [{campo, mensagem}] }`; 133 blocos catch unificados em 18 arquivos de rota; `api.ts` do dashboard lê os 3 formatos coexistentes |
| 2 | **JSON nativo (jsonb)** | 7 campos String-serializados convertidos (`dadosCenso` ×3, `documentosEntregues`, `moduleIds`, `evolucoes`, `canais`) com migration de fallback seguro (`to_jsonb_seguro` — nada é perdido); fim de todo `JSON.parse/stringify` nos services; 3 campos mantidos como String por decisão documentada (texto livre) |
| 3 | **Upload de documentos da matrícula + LGPD** | Abstração `StorageDriver` (disco local via `UPLOADS_DIR`; ponto de extensão S3/Supabase documentado); `@fastify/multipart` 10MB com whitelist de MIME + magic bytes + chaves anti-traversal; model `DocumentoMatricula` com checklist automático em `documentosEntregues` (Record<tipo, boolean> jsonb); download com stream; exclusão individual (OPERACAO) e expurgo LGPD (GESTAO); leitura restrita (LGPD art. 14); política em `docs/LGPD_RETENCAO.md`; volume `uploads` no compose; UI no detalhe do aluno |
| 4 | **Módulo 6 — Alimentação Escolar (85%)** | Cardápios (escola/rede), estoque com movimentações imutáveis e saldo derivado + alerta de mínimo, registro de refeições (único por escola/dia/turno/tipo), relatório FNDE/PNAE com custos — `/alimentacao` com 4 abas |
| 5 | **Módulo 7 — Transporte Escolar (85%)** | Rotas (escolas + alunos com validação de capacidade), frota com vencimentos (licenciamento/seguro/vistoria) e alertas, motoristas com CNH/curso (CTB art. 138) e bloqueio de CNH vencida, manutenções com custos por veículo — `/transporte` com 4 abas |
| 6 | **Módulo 8 — Gestão Democrática (85%)** | Colegiado (membros por segmento/cargo, mandato), grêmio por ano letivo (chapas, apuração de eleição em transação, atividades), líderes de turma (líder+vice por turma/ano), reuniões/assembleias (pauta, ata, decisões, presenças) — `/gestao-democratica` com 4 abas |
| 7 | **Módulo 3 — Portais (85%)** | Rota única `/portal` com dispatch por papel: Professor (turmas, aulas do dia, pendências de frequência), Aluno/Responsável (boletim, frequência, comunicados — novo papel `RESPONSAVEL` + vínculo `MatriculaUsuario` criado pela secretaria), Diretor/Coordenação (indicadores da escola), Secretaria (estatísticas + gestão de acessos), SEMEC (consolidado municipal). Defesa em 3 camadas para dados de aluno (allowlist no guard + identidade do JWT + `PERM_005` no vínculo) |
| 8 | **Integrações como exportadores** | Educacenso/INEP: arquivo de migração TXT pipe-delimited (registros 00/20/30/40/50/60/99, ISO-8859-1) + relatório de pendências por campo; Sistema Presença (Bolsa Família): CSV de baixa frequência com limiares oficiais (60% pré-escola / 75% 6–17 anos, Lei 14.601/2023) e campo `nisAluno` novo na matrícula — `/exportacoes` (leitura restrita a OPERACAO: CPF/NIS) |
| 9 | **RBAC testável** | Tabelas extraídas do server.ts para `lib/rbac.ts` (função pura `autorizar()`), allowlist do papel RESPONSAVEL, regras dos módulos novos — 15 testes unitários |
| 10 | **Nav por papel v2** | `EQUIPE` vs papéis externos: RESPONSAVEL/USER veem só "Meu Portal"; Exportações/RH só p/ equipe operacional; 5 itens novos na sidebar |

**Verificação:** backend 96 testes (14 arquivos) verdes + build tsc limpo + lint 0 erros; dashboard typecheck limpo, testes e build de produção verdes. Migrations novas: `json_nativo_campos_serializados`, `documento_matricula`, `onda2_modulos_e_portais`. Tracker (seed + banco) sincronizado: M3/M6/M7/M8 in-progress 85%, Fases 3–4 in-progress.

**Follow-ups conhecidos (menores):** harmonizar erros ajv (módulo 9) com o formato novo; trilha de auditoria de downloads de documentos; lint com ~170 warnings `no-explicit-any` herdados do padrão dos services; matrícula online pelo responsável (M1) e notificações push/SMS/email (M9) continuam pendentes.

## 5. Passo a passo do deploy de lançamento — VPS + Coolify + Supabase self-hosted

> ⚠️ **Atualizado em 09/2026:** as imagens agora usam a raiz do repo como contexto
> (Base Directory `/`), a sessão web exige dashboard e API no **mesmo domínio**, e
> há novas variáveis (`TRUST_PROXY`, `ACCESS_TOKEN_MINUTOS`...). O checklist
> vigente está em **[docs/DEPLOY_PRODUCAO.md](docs/DEPLOY_PRODUCAO.md)**; os
> passos abaixo continuam válidos para VPS, Coolify e Supabase.

### 5.1 Provisionar a VPS
1. Ubuntu 22.04/24.04 LTS, mínimo **4 vCPU / 8 GB RAM / 80 GB SSD** (o stack Supabase self-hosted sozinho consome ~2-4 GB).
2. DNS (registros A para o IP da VPS):
   - `app.SEUDOMINIO` → dashboard
   - `api.SEUDOMINIO` → backend
   - `supabase.SEUDOMINIO` → Supabase Studio (opcional, recomendado proteger)
   - `coolify.SEUDOMINIO` → painel do Coolify
3. Firewall: liberar somente 22 (SSH), 80 e 443. Nunca expor 5432 (Postgres) publicamente.

### 5.2 Instalar o Coolify
```bash
ssh root@SEU_IP
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```
Acessar `http://SEU_IP:8000`, criar o usuário admin, definir o domínio do painel (`coolify.SEUDOMINIO`) e conectar o repositório Git (GitHub App ou deploy key).

### 5.3 Subir o Supabase (banco de produção)
1. No Coolify: **+ New → Service → Supabase** (template one-click).
2. Definir domínio do Studio (`supabase.SEUDOMINIO`) e senhas geradas (guardar o `POSTGRES_PASSWORD`).
3. Deploy e aguardar todos os containers ficarem saudáveis.
4. Criar o banco da aplicação (via Studio → SQL Editor, ou psql no container):
   ```sql
   CREATE DATABASE gestao_edu;
   ```
5. Connection string interna (rede Docker do Coolify — o backend acessa sem sair da VPS):
   ```
   postgresql://postgres:SENHA@SERVICO-supabase-db:5432/gestao_edu
   ```
   > O hostname exato aparece no painel do serviço (container do `supabase-db`). Extras do Supabase (Studio, Storage, Auth) ficam disponíveis para evolução futura; **no lançamento usa-se apenas o Postgres** — a autenticação continua no Fastify/JWT.

### 5.4 Deploy do backend
1. **+ New → Application** → repositório, base directory `backend/`, build via **Dockerfile** (criado na P2).
2. Variáveis de ambiente:
   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | connection string do passo 5.3 |
   | `JWT_SECRET` | `openssl rand -hex 64` |
   | `JWT_EXPIRES_IN` | `7d` (ou menor, ex. `12h`) |
   | `CORS_ORIGIN` | `https://app.SEUDOMINIO` |
   | `NODE_ENV` | `production` |
   | `PORT` / `HOST` | `3051` / `0.0.0.0` |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | credenciais do admin inicial (seed-prod) |
3. Comando de release (pre-deploy no Coolify): `npx prisma migrate deploy` (e `node dist/seed-prod.js` só no primeiro deploy).
4. Healthcheck: `GET /health` porta 3051. Domínio `api.SEUDOMINIO` — HTTPS automático (Let's Encrypt via proxy do Coolify).

### 5.5 Deploy do dashboard
1. **+ New → Application** → mesmo repositório, base directory `dashboard/`, Dockerfile.
2. **Build-arg** (não basta env de runtime — o Next embute no bundle): `NEXT_PUBLIC_API_URL=https://api.SEUDOMINIO`.
3. Domínio `app.SEUDOMINIO`, porta 3000.

### 5.6 Smoke test de lançamento
```bash
curl https://api.SEUDOMINIO/health                          # 200 ok
curl https://api.SEUDOMINIO/api/escolas                     # 401 (protegido ✔)
```
No navegador: `https://app.SEUDOMINIO` → redireciona a `/login` → entrar com o admin → CRUD de escola → preencher questionário do censo → recarregar → dados persistidos → logout.

### 5.7 Operação contínua
- **Backups**: no Coolify, habilitar backup agendado do volume do Postgres (destino S3 ou local) — diário, retenção ≥ 14 dias. Testar restauração uma vez.
- **Auto-deploy**: webhook do Git no Coolify (push na `main` → redeploy). Recomendado criar branch `production` para controlar o que sobe.
- **Monitoramento**: alertas de container unhealthy do próprio Coolify (e-mail/Telegram/Discord); logs pelo painel.
- **Pós-lançamento imediato**: trocar a senha do admin inicial; criar os usuários reais (via `POST /api/auth/register` autenticado como admin); revisar `JWT_EXPIRES_IN`.

---

## 6. Checklist go/no-go do lançamento

**Código (feito em 07/07/2026):**
- [x] API exige autenticação em todas as rotas de dados
- [x] Registro de usuários restrito a admin
- [x] Tokens JWT com expiração
- [x] Questionários do censo persistem no banco
- [x] Login/logout funcionais no dashboard
- [x] URLs parametrizadas por ambiente
- [x] `dev.db` fora do controle de versão
- [x] Builds de produção passando (backend `tsc` + dashboard `next build`)

**Qualidade (P1 — feito em 07/07/2026):**
- [x] Validação zod em todas as rotas de escrita
- [x] RBAC por papel (estrutura = ADMIN/SEMEC; operação = equipe)
- [x] Histórico de transferência de matrícula
- [x] Lint funcionando (0 erros) e testes Vitest 17/17
- [x] Tracker de módulos e documentação refletindo o status real

**Pré-deploy (P2 — feito em 07/07/2026):**
- [x] Migração Prisma para PostgreSQL (rebaseline `init`)
- [x] Seed de produção idempotente, sem `deleteMany` e sem senha padrão
- [x] Dockerfiles backend + dashboard + docker-compose.yml
- [x] Swagger `/docs` desabilitado em produção
- [x] Deploy local em containers testado nesta máquina

**Infra (dia do deploy):**
- [ ] VPS provisionada + DNS propagado + firewall
- [ ] Coolify instalado e conectado ao repositório
- [ ] Supabase up + banco `gestao_edu` criado
- [ ] Backend no ar com HTTPS e healthcheck verde
- [ ] Dashboard no ar apontando para a API
- [ ] Smoke test 5.6 completo
- [ ] Backup automático configurado e testado
- [ ] Senha do admin trocada + usuários reais criados

**Pós-lançamento (P1/P3):**
- [ ] RBAC fino por papel nas rotas de escrita
- [ ] Testes automatizados dos serviços críticos
- [ ] Tracker de módulos atualizado com o status real
- [ ] Docs (PRD/ANALISE) atualizados para a stack real
- [ ] Roadmap dos módulos 2, 3, 5-9 (frequência, notas, portais, LGPD)
