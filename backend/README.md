# Sistema de Gestão Educacional - Backend

Backend do Sistema de Gestão Educacional de Ibirapitanga-BA.

## Tecnologias

- **Node.js 20+** - Runtime
- **Fastify** - Framework web
- **Prisma** - ORM
- **SQLite** - Banco de dados (desenvolvimento)
- **JWT** - Autenticação
- **Zod** - Validação

## Setup

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` conforme necessário.

### 3. Criar banco de dados e executar migrations

```bash
npm run db:push
```

### 4. Popular banco com dados iniciais (opcional)

```bash
npm run db:seed
```

### 5. Iniciar servidor de desenvolvimento

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3333`

## Scripts

| Comando               | Descrição                               |
| --------------------- | --------------------------------------- |
| `npm run dev`         | Inicia servidor em modo desenvolvimento |
| `npm run build`       | Compila o projeto                       |
| `npm run start`       | Inicia servidor compilado               |
| `npm run db:generate` | Gera cliente Prisma                     |
| `npm run db:push`     | Sincroniza schema com banco             |
| `npm run db:migrate`  | Executa migrations                      |
| `npm run db:studio`   | Abre Prisma Studio                      |
| `npm run db:seed`     | Popula banco com dados iniciais         |

## Endpoints da API

### Autenticação

| Método | Endpoint             | Descrição         |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/register` | Registrar usuário |
| POST   | `/api/auth/login`    | Login             |
| GET    | `/api/auth/me`       | Usuário logado    |

### Séries

| Método | Endpoint                     | Descrição        |
| ------ | ---------------------------- | ---------------- |
| GET    | `/api/series`                | Listar séries    |
| GET    | `/api/series/:id`            | Buscar série     |
| GET    | `/api/series/etapa/:etapaId` | Séries por etapa |
| POST   | `/api/series`                | Criar série      |
| PUT    | `/api/series/:id`            | Atualizar série  |
| DELETE | `/api/series/:id`            | Deletar série    |

### Etapas de Ensino

| Método | Endpoint          | Descrição       |
| ------ | ----------------- | --------------- |
| GET    | `/api/etapas`     | Listar etapas   |
| GET    | `/api/etapas/:id` | Buscar etapa    |
| POST   | `/api/etapas`     | Criar etapa     |
| PUT    | `/api/etapas/:id` | Atualizar etapa |
| DELETE | `/api/etapas/:id` | Deletar etapa   |

### Escolas

| Método | Endpoint                        | Descrição              |
| ------ | ------------------------------- | ---------------------- |
| GET    | `/api/escolas`                  | Listar escolas         |
| GET    | `/api/escolas/:id`              | Buscar escola          |
| GET    | `/api/escolas/:id/estatisticas` | Estatísticas da escola |
| POST   | `/api/escolas`                  | Criar escola           |
| PUT    | `/api/escolas/:id`              | Atualizar escola       |
| DELETE | `/api/escolas/:id`              | Deletar escola         |

### Turmas

| Método | Endpoint                                      | Descrição             |
| ------ | --------------------------------------------- | --------------------- |
| GET    | `/api/turmas`                                 | Listar turmas         |
| GET    | `/api/turmas/:id`                             | Buscar turma          |
| GET    | `/api/turmas/:id/estatisticas`                | Estatísticas da turma |
| GET    | `/api/turmas/escola/:escolaId`                | Turmas por escola     |
| POST   | `/api/turmas`                                 | Criar turma           |
| PUT    | `/api/turmas/:id`                             | Atualizar turma       |
| DELETE | `/api/turmas/:id`                             | Deletar turma         |
| POST   | `/api/turmas/:id/alunos`                      | Adicionar aluno       |
| DELETE | `/api/turmas/:id/alunos/:matriculaId`         | Remover aluno         |
| POST   | `/api/turmas/:id/professores`                 | Adicionar professor   |
| DELETE | `/api/turmas/:id/professores/:profissionalId` | Remover professor     |

### Matrículas

| Método | Endpoint                         | Descrição            |
| ------ | -------------------------------- | -------------------- |
| GET    | `/api/matriculas`                | Listar matrículas    |
| GET    | `/api/matriculas/sem-turma`      | Alunos sem turma     |
| GET    | `/api/matriculas/estatisticas`   | Estatísticas         |
| GET    | `/api/matriculas/:id`            | Buscar matrícula     |
| GET    | `/api/matriculas/numero/:numero` | Buscar por número    |
| POST   | `/api/matriculas`                | Criar matrícula      |
| PUT    | `/api/matriculas/:id`            | Atualizar matrícula  |
| DELETE | `/api/matriculas/:id`            | Deletar matrícula    |
| PATCH  | `/api/matriculas/:id/cancelar`   | Cancelar matrícula   |
| PATCH  | `/api/matriculas/:id/transferir` | Transferir matrícula |

### Profissionais

| Método | Endpoint                                   | Descrição                |
| ------ | ------------------------------------------ | ------------------------ |
| GET    | `/api/profissionais`                       | Listar profissionais     |
| GET    | `/api/profissionais/:id`                   | Buscar profissional      |
| GET    | `/api/profissionais/escola/:escolaId`      | Profissionais por escola |
| POST   | `/api/profissionais`                       | Criar profissional       |
| PUT    | `/api/profissionais/:id`                   | Atualizar profissional   |
| DELETE | `/api/profissionais/:id`                   | Deletar profissional     |
| POST   | `/api/profissionais/:id/escolas`           | Vincular escola          |
| DELETE | `/api/profissionais/:id/escolas/:escolaId` | Desvincular escola       |

## Documentação

Acesse `http://localhost:3333/docs` para visualizar a documentação Swagger da API.

## Credenciais de Teste

Após executar o seed:

- **Email:** admin@ibirapitanga.ba.gov.br
- **Senha:** admin123
