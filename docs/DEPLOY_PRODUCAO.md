# Deploy de produção — checklist

Complementa o §5 do `PLANO_FINALIZACAO_E_DEPLOY.md` com o que mudou nas
Fases 0–4 (sessão por cookie, escopo LGPD, app mobile, imagens reprodutíveis).

## 1. Imagens

As duas imagens usam a **raiz do repositório como contexto de build**, porque o
`package-lock.json` do monorepo fica lá (`npm ci`, build reprodutível):

| Serviço | Dockerfile | Contexto | Porta interna |
|---|---|---|---|
| API | `backend/Dockerfile` | `/` (raiz) | 3051 |
| Dashboard | `dashboard/Dockerfile` | `/` (raiz) | 3000 |

No Coolify: **Base Directory = `/`** e **Dockerfile Location** = o caminho acima.
Ambas rodam como usuário `node`, sem root. O CI (job `imagens`) confere que as
duas constroem a cada PR.

A API aplica sozinha as migrations pendentes no boot (`prisma migrate deploy`)
e garante o admin inicial (`seed-prod.cjs`, idempotente, nunca apaga nada).

## 2. Domínios (obrigatório para o login funcionar)

A sessão web usa cookies `httpOnly; Secure; SameSite=Strict`. O navegador só
envia esses cookies se o dashboard e a API estiverem no **mesmo site**
(mesmo domínio registrável):

- ✅ `app.educacao.ibirapitanga.ba.gov.br` + `api.educacao.ibirapitanga.ba.gov.br`
- ❌ `app.kssoft.com.br` + `api.outrodominio.com.br`

HTTPS obrigatório nos dois (Let's Encrypt pelo Coolify).

## 3. Variáveis de ambiente

### API
| Variável | Valor | Observação |
|---|---|---|
| `DATABASE_URL` | connection string interna do Postgres | nunca expor a 5432 |
| `JWT_SECRET` | `openssl rand -hex 64` | obrigatório, ≥ 32 caracteres |
| `CORS_ORIGIN` | `https://app.<domínio>` | obrigatório em produção |
| `TRUST_PROXY` | `1` | IP real atrás do proxy do Coolify (rate limit e auditoria) |
| `ACCESS_TOKEN_MINUTOS` | `15` | |
| `REFRESH_TOKEN_DIAS` / `SESSAO_MAX_DIAS` | `7` / `30` | |
| `LOGIN_MAX_FALHAS` / `LOGIN_MAX_POR_IP` | `5` / `60` | |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | admin inicial | trocar a senha no 1º acesso |
| `UPLOADS_DIR` / `STORAGE_DRIVER` | `/app/uploads` / `local` | volume persistente em `/app/uploads` |
| `NODE_ENV` / `PORT` / `HOST` | `production` / `3051` / `0.0.0.0` | |
| `FRACAO_MAXIMA_REGENCIA` | vazio (= `2/3`) | opcional; só se o estatuto do magistério municipal fixar outro limite de regência |

### Dashboard (build-arg, não env de runtime)
| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.<domínio>` |

### App mobile (build EAS)
| Variável | Valor |
|---|---|
| `EXPO_PUBLIC_API_URL` | `https://api.<domínio>` (o app recusa `http://` em produção) |

## 4. Usuários e escopo (LGPD)

- **ADMIN/SEMEC** enxergam a rede toda.
- **DIRETOR, COORDENADOR, SECRETARIA** só enxergam e alteram a **própria escola**.
  O usuário **precisa** ter `escolaId`; sem escola, não vê dado de escola nenhuma.
- **PROFESSOR** só as turmas em que leciona (vínculo em Turmas → Professores) e
  precisa estar ligado a um cadastro de profissional (`profissionalId`). Recebe
  os alunos sem CPF, NIS, endereço e contatos do responsável.
- **RESPONSAVEL** só o portal dos alunos vinculados a ele pela secretaria.

Antes de liberar o acesso: conferir que cada usuário de escola tem a escola
certa e cada professor tem o profissional e as turmas vinculados.

## 5. Checklist do dia

- [ ] DNS dos dois subdomínios no mesmo domínio + HTTPS
- [ ] Postgres no ar, sem porta pública; backup diário com retenção ≥ 14 dias e **uma restauração testada**
- [ ] Volume persistente de uploads (documentos de matrícula) incluído no backup
- [ ] API: variáveis da §3, healthcheck `GET /health` verde
- [ ] Dashboard: build com `NEXT_PUBLIC_API_URL` correto
- [ ] Smoke: `GET /health` 200; `GET /api/escolas` sem sessão → 401; login pelo navegador → painel carrega; `POST` sem `X-CSRF-Token` → 403
- [ ] Trocar a senha do admin inicial; criar os usuários reais com escola/profissional vinculados
- [ ] `GET /api/auditoria` mostrando os logins (ADMIN/SEMEC)
