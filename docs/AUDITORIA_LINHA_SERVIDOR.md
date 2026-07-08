# Auditoria da Linha do Servidor (34 commits) — Parecer de Resgate

> **Data:** 08/07/2026 · **Escopo:** commits `5c0f48a..aa1f63d` (divergiram de `4a47269`, preservados como 2º pai do merge `5e04b23`)
> **Método:** 3 auditorias paralelas (backend, frontend, viabilidade de cherry-pick) sobre worktree somente-leitura de `aa1f63d`.

## Conclusão executiva

**Cherry-pick direto é inviável** — o schema Prisma diverge em ~1100 linhas, o `app/page.tsx` (monólito de abas deles) foi removido pela linha atual, e as camadas compartilhadas (`server.ts`, `schemas/index.ts`, `api.ts`, `useApi.ts`) foram reescritas nas duas pontas. O resgate real é **porte manual, módulo a módulo**, favorecido por dois fatos:

1. As features vivem majoritariamente em **arquivos novos** (services/routes de M2/4/5/9, managers, `errors/*`) — copiáveis sem conflito.
2. Os managers do frontend usam os **primitivos shadcn de `components/ui/`**, que o redesign re-estilizou — ao portar, **herdam o visual novo automaticamente** (re-skin leve).

O trabalho é **real** (não é vaporware): frequência, notas com média ponderada e situação cruzando frequência <75%, boletim, grade horária com PDF, ponto/licenças com fluxo de aprovação, busca ativa/AEE/PEI, comunicados com controle de leitura — tudo cabeado a hooks TanStack Query com paginação server-side e estados de loading. **Mas** vem com dívidas: zero testes, RBAC deles é código morto, e um **backdoor de autenticação**.

## 🔴 Nunca portar

| Item | Onde | Motivo |
|---|---|---|
| **Backdoor de login** | `auth.service.ts` (`admin@kssoft.com.br`/`1234` → JWT ADMIN, sem checar NODE_ENV) | Vulnerabilidade grave, vale em produção |
| `server.ts` deles | — | Auth por plugin (frágil); o nosso hook global + RBAC é superior |
| RBAC deles (`authorization.ts`, `types/roles.ts`) | — | Código morto — **nenhuma rota usa**; qualquer autenticado deleta tudo |
| Migrations deles | `20260302012527_init_postgresql` | Incompatível com nosso baseline; regenerar sempre |
| Docker/Swagger/paginação como commits | `4125bd7`, `970ed3d`, `f0f8e6a`, `673e349` + fixes | Já temos em forma melhor (P1/P2) |
| `CadastrosTab` + Etapas/SeriesManager deles | — | Regredidos — usam hierarquia antiga Etapa→Série, sem Nível/Censo |
| Wrappers `portals/Portal*.tsx` | — | Órfãos (nunca montados) sobre AuthContext não-montado; reimplementar roteamento por papel |

## 🟢 Vale resgatar (em ordem)

| # | O quê | Qualidade | Ajustes necessários |
|---|---|---|---|
| 1 | **Sistema de erros** (`errors/AppError.ts`, `error-codes.json` com 166 códigos, `middleware/error-handler.ts` com mapeamento Prisma, `utils/logger.ts`) | Bem-feito, transversal | Registrar no nosso `server.ts`; adotar antes dos módulos |
| 2 | **Módulo 2 — Pedagógico** (models `Disciplina/Avaliacao/Nota/Frequencia/ConfiguracaoAvaliacao/GradeHoraria`; 6 services + rotas; 10 managers, Boletim, Grade com PDF) | ⭐ Melhor ativo — regra de negócio correta (`nota.service.ts:321-407`) | Trocar `throw new Error`→`AppError`; corrigir N+1 do boletim; plugar no nosso RBAC; reconciliar acoplamento a **Etapa→Nível** em Notas/Disciplinas/Config; telas viram rotas `(app)` com PageWrap |
| 3 | **Módulo 5 — Programas Especiais** (BuscaAtiva+visitas+encaminhamentos, PEI/AEE/SalaRecursos, Acompanhamento) | Mais maduro (AppError, paginação, AJV) | Menor atrito de todos; plugar auth/RBAC |
| 4 | **Módulo 9 — Comunicação** (Comunicado c/ leitura confirmada, Notificação multicanal, ReuniãoPais c/ presença, Plantão) | Maduro | Corrigir `userId` placeholder (`ComunicacaoTab.tsx:21`); plugar auth |
| 5 | **Módulo 4 — RH** (Ponto c/ horas, Licenças c/ aprovação, Afastamento, Certificação, HistóricoContratação) | Bom, mas sem transações e com `Error` cru | Refatorar erros/transações; cuidado: estende o model compartilhado `ProfissionalEducacao` |
| 6 | **Gráficos Recharts do OverviewTab** (matrículas×capacidade, pizza por status/etapa) | Bons, aditivos (nosso dashboard não tem charts) | Reescrever container p/ Panel/KpiCard; paleta → tokens `chart-*` |
| 7 | **Extras**: PDFs `@react-pdf/renderer` (Ficha/Declaração de matrícula, RelatórioPCD, relatórios), `refresh-token.service.ts` (rotação/revogação), matriz `ModulePermissions` como referência de RBAC fino, rate-limit global | Pontuais | `@react-pdf/renderer` é a única dependência nova |

## Ordem de dependência do porte

```
Nível 0  Sistema de erros (habilita os módulos)
Nível 1  Models no schema.prisma atual + migration nova (por módulo)
Nível 2  Services + rotas (registrar no server.ts atual, sob o RBAC global)
Nível 3  api.ts/useApi.ts — merge aditivo dos hooks (~120 hooks novos)
Nível 4  Telas: managers copiados → rotas app/(app)/... com PageWrap
```

Regra: nunca reaproveitar migrations; sempre gerar `prisma migrate dev` novo sobre o schema atual. Módulos M5 e M9 são os de menor atrito; M2 é o de maior valor; M4 exige mais refatoração.

## Números da divergência (para referência)

- `schema.prisma`: 1431L (servidor) vs 502L (atual) — ~26 models novos resgatáveis
- `api.ts`: 3302L vs 1234L · `useApi.ts`: 3317L (204 hooks) vs 1552L (~88)
- Testes: **0** (servidor) vs 17 (atual) · `.bak` versionados no servidor
- GUIA deles admite como "pendente" justamente o que a linha atual já fez (Postgres, Docker, CORS, rate-limit, health, segurança)
