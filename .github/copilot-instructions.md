# Sistema de Gestão Educacional - Ibirapitanga-BA

Sistema completo de gestão educacional municipal, construído como monorepo com backend Fastify + Prisma e frontend Next.js.

## 📋 Visão Geral do Projeto

- **Propósito**: Centralizar toda gestão educacional do município em uma plataforma única
- **Fase Atual**: Desenvolvimento Ativo - Fase 1 (Fundação)
- **Módulos em Desenvolvimento**: Gestão de Matrículas, Alunos e RH Básico
- **Cronograma**: 9 módulos distribuídos em 4 fases ao longo de 12 meses

## 🏗️ Arquitetura do Projeto

```
sistema-de-gesto-edu/
├── backend/              # API Fastify + Prisma (porta 3333)
├── dashboard/            # Frontend Next.js 15 (porta 3000)
├── mcp_server/           # Servidor MCP para scaffolding
├── PRD.md                # Documento de Requisitos do Produto
├── ANALISE_PROJETO.md    # Análise completa do projeto
└── package.json          # Monorepo com npm workspaces
```

## 🛠️ Stack Tecnológico

### Backend (`/backend`)

- **Framework**: Fastify 4.x com TypeScript
- **ORM**: Prisma 5.x com SQLite (dev) → PostgreSQL (prod)
- **Autenticação**: @fastify/jwt com bcryptjs
- **Validação**: Zod
- **Documentação**: Swagger UI em `/docs`

### Frontend (`/dashboard`)

- **Framework**: Next.js 15 com App Router
- **UI**: Radix UI + Tailwind CSS + shadcn/ui
- **Estado**: React Query (TanStack Query)
- **Animações**: Framer Motion
- **Ícones**: Lucide React + Phosphor Icons

### Ferramentas de Desenvolvimento

- **Build**: tsx (dev), tsc (prod)
- **Testes**: Vitest
- **Node**: >= 20.0.0

## 📁 Estrutura do Backend

### Camadas da Aplicação

```
backend/src/
├── server.ts           # Entrada principal, configuração do Fastify
├── lib/
│   └── prisma.ts       # Cliente Prisma singleton
├── middleware/
│   └── auth.ts         # Middleware de autenticação JWT
├── routes/             # Rotas organizadas por domínio
│   ├── auth.routes.ts
│   ├── escolas.routes.ts
│   ├── etapas.routes.ts
│   ├── series.routes.ts
│   ├── turmas.routes.ts
│   ├── matriculas.routes.ts
│   ├── profissionais.routes.ts
│   ├── salas.routes.ts
│   ├── calendario.routes.ts
│   ├── modules.routes.ts
│   └── phase.routes.ts
├── services/           # Lógica de negócio
│   └── [dominio].service.ts
├── schemas/            # Schemas Zod para validação
│   └── index.ts
└── types/
    └── fastify.d.ts    # Extensões de tipos do Fastify
```

### Padrão de Rotas

Todas as rotas seguem o padrão RESTful:

```typescript
// GET    /api/[recurso]      - Listar todos
// GET    /api/[recurso]/:id  - Buscar por ID
// POST   /api/[recurso]      - Criar novo
// PUT    /api/[recurso]/:id  - Atualizar
// DELETE /api/[recurso]/:id  - Remover
```

### Endpoints da API

| Prefixo                | Descrição                        |
| ---------------------- | -------------------------------- |
| `/api/auth`            | Autenticação (login, registro)   |
| `/api/tipos-educacao`  | Tipos de educação (nível 1)      |
| `/api/etapas`          | Etapas de ensino (nível 2)       |
| `/api/niveis-ensino`   | Níveis de ensino (nível 3)       |
| `/api/series`          | Séries escolares (nível 4)       |
| `/api/escolas`         | Escolas municipais (+ `/censo`)  |
| `/api/turmas`          | Turmas por escola/série (+ `/censo`) |
| `/api/matriculas`      | Matrículas (+ `/transferencias`) |
| `/api/profissionais`   | Professores e auxiliares (+ `/censo`) |
| `/api/salas`           | Salas físicas das escolas        |
| `/api/calendario`      | Calendário letivo e eventos      |
| `/api/modules`         | Módulos do sistema (roadmap)     |
| `/api/phases`          | Fases de implementação           |
| `/health`              | Health check (público)           |
| `/docs`                | Swagger UI (público)             |

## 📁 Estrutura do Frontend

```
dashboard/src/
├── app/
│   ├── layout.tsx           # Layout raiz com providers
│   ├── providers.tsx        # QueryClient + Theme + AuthProvider + AuthGate
│   ├── login/page.tsx       # Página de login (pública)
│   ├── (app)/               # Grupo com MainLayout/Sidebar
│   │   ├── page.tsx         # Dashboard (OverviewTab)
│   │   ├── modulos/ cronograma/ desenvolvimento/ kpis/ tech-stack/
│   │   └── cadastros/       # calendario, hierarquia, escolas,
│   │                        #   profissionais, matriculas
│   ├── questionario-escola/[escolaId]/   # Censo INEP da escola
│   ├── questionario-gestor/[escolaId]/   # Censo INEP do gestor
│   └── questionario-turma/[turmaId]/     # Censo INEP da turma
├── components/
│   ├── ui/                  # Componentes shadcn/ui (40+)
│   ├── layout/              # MainLayout, Sidebar (com logout)
│   ├── AuthGate.tsx         # Guard global de autenticação
│   ├── enrollment/          # EscolasManager, EscolaDetails, TurmaDetails,
│   │                        #   MatriculasManager, ProfissionaisManager,
│   │                        #   HierarquiaEnsinoManager, SalasManager, ...
│   ├── OverviewTab.tsx ModulesTab.tsx TimelineTab.tsx
│   ├── DevelopmentTab.tsx KPITab.tsx TechStackTab.tsx
│   └── CalendarioLetivoManager.tsx
├── hooks/
│   ├── useApi.ts       # Hooks React Query para toda a API
│   └── use-mobile.ts   # Detecção de dispositivo
├── lib/
│   ├── api.ts          # Cliente API (NEXT_PUBLIC_API_URL)
│   ├── auth.tsx        # Contexto de autenticação
│   ├── types.ts        # Tipagens TypeScript
│   └── data.ts         # Dados estáticos (KPIs/tech stack)
└── types/
    └── lucide-react.d.ts
```

## 🗄️ Modelo de Dados (Prisma)

### Entidades Principais

| Modelo                   | Descrição                              |
| ------------------------ | -------------------------------------- |
| `User`                   | Usuários do sistema (auth)             |
| `TipoEducacao`           | Tipo de educação (Regular, EJA, ...)   |
| `EtapaEnsino`            | Etapas (Ed. Infantil, Fund. I/II)      |
| `NivelEnsino`            | Níveis dentro da etapa                 |
| `Serie`                  | Séries escolares (1º Ano, etc.)        |
| `Escola`                 | Escolas com infraestrutura + `dadosCenso` |
| `Sala`                   | Salas físicas das escolas              |
| `Turma`                  | Turmas com capacidade, limite PCD e `dadosCenso` |
| `Matricula`              | Matrículas com dados completos         |
| `TransferenciaMatricula` | Histórico/auditoria de transferências  |
| `ProfissionalEducacao`   | Professores e auxiliares (+ `dadosCenso` do gestor) |
| `FormacaoProfissional`   | Formações acadêmicas                   |
| `AnoLetivo`              | Anos letivos                           |
| `EventoCalendario`       | Eventos do calendário letivo           |
| `Module`                 | Módulos do roadmap                     |
| `SubModule`              | Submódulos                             |
| `Phase`                  | Fases de implementação                 |

### Tabelas de Junção (N:M)

- `EscolaEtapa` - Escola ↔ EtapaEnsino
- `EscolaProfissional` - Escola ↔ ProfissionalEducacao
- `TurmaProfessor` - Turma ↔ ProfissionalEducacao

### Hierarquia de Dados

```
TipoEducacao (Educação Regular, EJA, ...)
  └── EtapaEnsino (Ed. Infantil, Fund. I, Fund. II)
        └── NivelEnsino
              └── Serie (1º Ano, 2º Ano, ...)
                    └── Turma (vinculada também a Escola)
                          └── Matricula (aluno matriculado)
```

## 🔐 Autenticação e Autorização

### Roles de Usuário

- `ADMIN` - Administrador geral
- `SEMEC` - Secretaria Municipal de Educação
- `DIRETOR` - Diretor de escola
- `COORDENADOR` - Coordenador pedagógico
- `PROFESSOR` - Professor
- `SECRETARIA` - Secretário escolar
- `USER` - Usuário básico

### Fluxo de Autenticação

1. Login via `/api/auth/login` (única rota `/api/*` pública)
2. Token JWT retornado (expira conforme `JWT_EXPIRES_IN`, padrão 7d)
3. Token enviado no header `Authorization: Bearer <token>`
4. Hook global `onRequest` em `server.ts` valida o token em toda rota `/api/*`
5. RBAC por método/caminho no mesmo hook: escritas de estrutura
   (hierarquia, modules, phases, calendario) e DELETEs de recurso exigem
   ADMIN/SEMEC; demais escritas exigem equipe operacional (ADMIN, SEMEC,
   DIRETOR, COORDENADOR, SECRETARIA); GET liberado a qualquer autenticado
6. `POST /api/auth/register` é restrito a ADMIN/SEMEC (o schema aceita `role`)
7. No dashboard: página `/login` + `AuthGate` em `providers.tsx` protege
   todas as rotas (inclusive questionários); logout no Sidebar

## 📝 Convenções de Código

### Geral

- **Linguagem**: TypeScript strict mode
- **Comentários**: Em português (PT-BR)
- **Nomes de variáveis**: camelCase
- **Nomes de tipos**: PascalCase
- **Nomes de arquivos**: kebab-case ou PascalCase para componentes

### Backend

- Rotas em arquivos separados por domínio (`[dominio].routes.ts`)
- Services contêm lógica de negócio
- Schemas Zod para validação de entrada
- Usar `prisma.ts` para acessar o cliente Prisma
- Extensões `.js` nos imports (ES modules)

### Frontend

- Componentes em PascalCase (`MyComponent.tsx`)
- Hooks em camelCase prefixados com `use` (`useApi.ts`)
- Usar componentes shadcn/ui de `/components/ui`
- React Query para estado servidor
- Tailwind CSS para estilos

## 🚀 Comandos Essenciais

### Raiz do Projeto

```bash
npm install              # Instala dependências de todos os workspaces
npm run dev              # Roda backend e frontend em paralelo
npm run dev:backend      # Apenas backend (porta 3333)
npm run dev:dashboard    # Apenas frontend (porta 3000)
npm run build            # Build de produção
npm run db:push          # Sincroniza schema Prisma
npm run db:seed          # Popula banco com dados iniciais
npm run db:studio        # Abre Prisma Studio
```

### Backend

```bash
cd backend
npm run dev              # Desenvolvimento com hot reload
npm run db:migrate       # Cria nova migration
npm run db:generate      # Gera Prisma Client
```

### Frontend

```bash
cd dashboard
npm run dev              # Next.js dev server
npm run build            # Build de produção
npm run lint             # ESLint
```

## 🎨 Design System

### Cores (OKLCH)

- **Primary (Deep Blue)**: `oklch(0.45 0.12 250)` - Confiança, estabilidade
- **Secondary (Soft Teal)**: `oklch(0.65 0.10 200)` - Crescimento, aprendizado
- **Accent (Vibrant Orange)**: `oklch(0.70 0.18 50)` - CTAs, progresso
- **Muted (Light Gray)**: `oklch(0.92 0.01 60)` - Elementos secundários

### Tipografia

- **Fonte**: Inter (Google Fonts)
- **Hierarquia**: H1 32px Bold → H2 24px SemiBold → H3 18px SemiBold → Body 16px

### Componentes

Usar biblioteca shadcn/ui com componentes em `/dashboard/src/components/ui/`:
- Dialog, Select, Tabs, Card, Button, Input, Badge, Progress, ScrollArea, etc.

## 🧪 Testes

```bash
cd backend
npm run test             # Roda testes com Vitest
```

## 📊 Status dos Módulos

> Fonte de verdade: tracker em `/desenvolvimento` (banco) e
> [PLANO_FINALIZACAO_E_DEPLOY.md](../PLANO_FINALIZACAO_E_DEPLOY.md).
> Atualizado em 07/07/2026.

### Fase 1 - Fundação
- [x] Gestão de Matrículas e Alunos — em progresso (~60%; falta histórico escolar e matrícula online externa)
- [x] Gestão de RH — em progresso (~20%; cadastro/formações/vínculos prontos; lotação formal, ponto e licenças pendentes)

### Fase 2 - Núcleo Pedagógico
- [x] Gestão Pedagógica — em progresso (~20%; Calendário Letivo completo; frequência/notas/planejamento pendentes)
- [ ] Portais de Acesso — apenas autenticação/login implementados

### Fase 3 - Gestão
- [ ] Gestão Democrática

### Fase 4 - Expansão
- [ ] Programas Especiais
- [ ] Alimentação Escolar
- [ ] Transporte Escolar
- [ ] Comunicação e Eventos

### Além do plano original (implementado)
- Hierarquia de ensino em 4 níveis, Salas, Questionários do Censo INEP
  (escola/gestor/turma, persistidos em `dadosCenso`), tracker de desenvolvimento

## 🔧 Regras de Negócio Importantes

### Matrículas

- Limite de alunos PCD por turma: configurável (padrão 2-3)
- Validação hierárquica: Série → Etapa → Escola → Turma
- Status possíveis: ATIVA, TRANSFERIDA, CANCELADA, CONCLUIDA

### Turmas

- Turnos: MATUTINO, VESPERTINO, NOTURNO, INTEGRAL
- Capacidade máxima configurável por turma
- Vinculação obrigatória: Escola + Série

### Profissionais

- Tipos: PROFESSOR, AUXILIAR, COORDENADOR, DIRETOR
- Múltiplas formações acadêmicas por profissional
- Vinculação N:M com escolas

### Calendário Letivo

- Eventos obrigatórios: INICIO_ANO_LETIVO, FIM_ANO_LETIVO (únicos por ano)
- Eventos podem ser da REDE (todas escolas) ou específicos de ESCOLA
- Suporte a eventos recorrentes

## 💡 Dicas para Desenvolvimento

1. **Sempre verificar schema.prisma** antes de criar novas features
2. **Usar Swagger UI** (`/docs`) para testar endpoints
3. **Prisma Studio** para visualizar e editar dados
4. **React Query DevTools** para debug de cache
5. **Componentes shadcn/ui** como base para novos componentes

## 📚 Referências

- [PRD.md](../PRD.md) - Requisitos detalhados do produto
- [ANALISE_PROJETO.md](../ANALISE_PROJETO.md) - Análise completa do projeto
- [Prisma Schema](../backend/prisma/schema.prisma) - Modelo de dados
- [Swagger Docs](http://localhost:3333/docs) - Documentação da API
