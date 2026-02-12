# 📚 Sistema de Gestão Educacional - Ibirapitanga/BA

Sistema completo para gerenciamento de instituições educacionais municipais, desenvolvido para a Secretaria Municipal de Educação e Cultura (SEMEC) de Ibirapitanga-BA.

## 🎯 Sobre o Projeto

O Sistema de Gestão Educacional é uma plataforma web completa que digitaliza e automatiza processos educacionais, incluindo:

- **Gestão Acadêmica**: Matrículas, turmas, frequência e notas
- **Gestão de Pessoas**: Alunos, profissionais e responsáveis
- **Gestão Pedagógica**: Avaliações, boletim digital e grade horária
- **Gestão Escolar**: Escolas, salas, calendário letivo
- **Comunicação**: Comunicados, notificações e portal de transparência
- **Observabilidade**: Monitoramento de performance e logs
- **Integração IA**: Servidor MCP para agentes de IA

## 🏗️ Arquitetura

### Stack Tecnológico

**Backend:**
- Fastify 4.x (Node.js web framework)
- Prisma ORM (Database toolkit)
- PostgreSQL (Produção) / SQLite (Desenvolvimento)
- Zod (Schema validation)
- JWT (Autenticação)
- TypeScript

**Frontend:**
- Next.js 15 (React framework)
- React 19
- TanStack React Query (State management)
- Radix UI (Component primitives)
- Tailwind CSS (Styling)
- Sonner (Toast notifications)
- Recharts (Data visualization)

**Observabilidade:**
- Sistema próprio de logs e métricas
- Dashboard de monitoramento
- Rastreamento de erros

**Integração IA:**
- MCP Server (Model Context Protocol da Anthropic)
- 20+ ferramentas para agentes de IA
- 4 recursos de dados em tempo real

### Estrutura do Monorepo

```
sistema-de-gesto-edu/
├── backend/               # API REST com Fastify
│   ├── prisma/           # Schema e migrations
│   ├── src/
│   │   ├── routes/       # Endpoints da API
│   │   ├── services/     # Lógica de negócio
│   │   ├── middleware/   # Auth, observability, etc
│   │   └── schemas/      # Validação Zod
│   └── public/           # Swagger UI customizado
├── dashboard/            # Frontend Next.js
│   ├── src/
│   │   ├── app/         # Pages e layouts
│   │   ├── components/  # Componentes React
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # API client e utils
├── mcp-server/          # Servidor MCP para IA
│   └── src/
└── docs/                # Documentação
```

## 📚 Documentação da API

A API está completamente documentada com **Swagger/OpenAPI 3.0**. Acesse a documentação interativa em:

```
http://localhost:3333/docs
```

### Features da Documentação

- ✅ **150+ endpoints** totalmente documentados
- ✅ Schemas completos de request/response
- ✅ Exemplos de uso para cada endpoint
- ✅ Try it out integrado (teste direto no navegador)
- ✅ Autenticação JWT configurada
- ✅ Agrupamento por módulos (tags)
- ✅ Descrições detalhadas de regras de negócio

### Status da Documentação

**✅ Módulos Concluídos:**
- Autenticação (login, registro, profile)
- Gestão Acadêmica (escolas, turmas, disciplinas, salas)
- Gestão Pedagógica (grade horária, frequência, avaliações, notas, calendário)
- Recursos Humanos (profissionais, ponto digital, licenças)

**🔄 Próximos Módulos:**
- Programas Especiais (Busca Ativa, AEE, Acompanhamento)
- Comunicação (Comunicados, Notificações, Reuniões, Plantões)
- Cadastros (Matrículas, Etapas, Séries)

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+ e npm
- PostgreSQL (produção) ou SQLite (desenvolvimento)

### 1. Instalação

Clone o repositório e instale as dependências:

```bash
git clone <repository-url>
cd sistema-de-gesto-edu
npm install
```

### 2. Configuração do Backend

```bash
cd backend

# Copie o arquivo de ambiente
cp .env.example .env

# Edite o .env com suas configurações
# Para desenvolvimento, SQLite já está configurado

# Execute as migrations
npx prisma db push

# (Opcional) Popule o banco com dados de exemplo
npx prisma db seed
```

### 3. Iniciar o Backend

```bash
# Em modo desenvolvimento
npm run dev

# Em modo produção
npm run build
npm start
```

O backend estará disponível em: http://localhost:3333

**Documentação da API (Swagger):**
- Padrão: http://localhost:3333/docs
- Customizado: http://localhost:3333/public/swagger-custom.html

### 4. Iniciar o Frontend

```bash
cd dashboard

# Em modo desenvolvimento
npm run dev

# Em modo produção
npm run build
npm start
```

O frontend estará disponível em: http://localhost:3000

### 5. (Opcional) Configurar o MCP Server

Para permitir que agentes de IA (como Claude) interajam com o sistema:

```bash
cd mcp-server

# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Edite .env com a URL da API e token JWT

# Build
npm run build
```

Consulte [mcp-server/README.md](mcp-server/README.md) para instruções completas de configuração com Claude Desktop.

## 📖 Documentação

### Guias de Implementação

- [GUIA_IMPLEMENTACAO.md](GUIA_IMPLEMENTACAO.md) - Roadmap e fases do projeto
- [SWAGGER_DOCUMENTATION_GUIDE.md](SWAGGER_DOCUMENTATION_GUIDE.md) - Como documentar a API
- [PAGINACAO_EXEMPLO.md](PAGINACAO_EXEMPLO.md) - Como usar paginação
- [mcp-server/README.md](mcp-server/README.md) - Servidor MCP para IA

### API Documentation

A documentação completa da API está disponível através do Swagger UI quando o backend está rodando:

**Swagger UI Customizado (Recomendado):**
```
http://localhost:3333/public/swagger-custom.html
```

**Swagger UI Padrão:**
```
http://localhost:3333/docs
```

**Especificação OpenAPI JSON:**
```
http://localhost:3333/docs/json
```

### Principais Endpoints

| Módulo | Endpoint Base | Descrição |
|--------|--------------|-----------|
| Autenticação | `/api/auth` | Login, registro, JWT |
| Matrículas | `/api/matriculas` | Gestão de matrículas |
| Turmas | `/api/turmas` | Gestão de turmas |
| Escolas | `/api/escolas` | Gestão de escolas |
| Profissionais | `/api/profissionais` | Gestão de professores/staff |
| Frequência | `/api/frequencia` | Registro de presença |
| Notas | `/api/notas` | Lançamento de notas |
| Avaliações | `/api/avaliacoes` | Gestão de avaliações |
| Calendário | `/api/calendario` | Calendário letivo |
| Comunicados | `/api/comunicados` | Comunicação com pais |
| Observabilidade | `/api/observability` | Métricas e logs |

## 🔐 Autenticação

O sistema usa JWT (JSON Web Tokens) para autenticação. Para acessar endpoints protegidos:

1. Faça login via `POST /api/auth/login`
2. Copie o token retornado
3. Inclua o token no header: `Authorization: Bearer <token>`

No Swagger UI, clique no botão **Authorize** (🔒) e cole o token.

### Roles de Usuário

- **ADMIN**: Acesso total ao sistema
- **SEMEC**: Secretaria Municipal de Educação
- **DIRETOR**: Diretor de escola
- **PROFESSOR**: Professor
- **RESPONSAVEL**: Pai/mãe/responsável

## 🗄️ Banco de Dados

### Desenvolvimento

Por padrão, o sistema usa SQLite para desenvolvimento:
- Arquivo: `backend/prisma/dev.db`
- Não requer instalação adicional
- Ideal para desenvolvimento local

### Produção

Para produção, use PostgreSQL:

1. Configure a connection string no `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/gestao_educacional"
```

2. Execute as migrations:
```bash
npx prisma migrate deploy
```

### Prisma Studio

Para visualizar e editar dados via interface gráfica:

```bash
cd backend
npx prisma studio
```

## 📊 Observabilidade

O sistema inclui um módulo completo de observabilidade:

### Recursos Monitorados

- **Requisições**: Total, taxa de erro, tempo médio de resposta
- **Rotas**: Estatísticas por endpoint
- **Erros**: Rastreamento e agrupamento de erros
- **Sistema**: Memória, CPU, uptime
- **Timeline**: Dados históricos com granularidade configurável

### Dashboard de Observabilidade

Acesse pelo frontend:
```
http://localhost:3000
```

Navegue até a aba "Observabilidade" (requer role ADMIN).

### API de Observabilidade

Endpoints disponíveis (requer autenticação ADMIN):

- `GET /api/observability/overview` - Visão geral do sistema
- `GET /api/observability/routes` - Métricas por rota
- `GET /api/observability/errors` - Lista de erros
- `GET /api/observability/logs` - Logs de requisições
- `GET /api/observability/timeline` - Dados históricos
- `GET /api/observability/modules` - Estatísticas por módulo

## 🤖 Integração com IA (MCP Server)

O sistema inclui um servidor MCP que permite que agentes de IA (como Claude) interajam com o sistema de forma autônoma.

### Recursos Disponíveis

**20+ Ferramentas (Tools):**
- Listar e criar matrículas
- Gerenciar turmas e obter estatísticas
- Consultar escolas e profissionais
- Registrar frequência
- Lançar notas e consultar boletins
- Criar comunicados
- Monitorar métricas do sistema

**4 Recursos (Resources):**
- Estatísticas gerais
- Lista de escolas
- Resumo de turmas
- Saúde do sistema

### Como Usar

Consulte o guia completo em [mcp-server/README.md](mcp-server/README.md) para:
- Configuração com Claude Desktop
- Lista completa de ferramentas
- Exemplos de uso
- Troubleshooting

## 🧪 Testes

```bash
# Backend
cd backend
npm test

# Frontend
cd dashboard
npm test
```

## 🔨 Scripts Úteis

### Backend

```bash
npm run dev          # Modo desenvolvimento
npm run build        # Build para produção
npm start            # Iniciar produção
npm run prisma:studio # Abrir Prisma Studio
npm run prisma:generate # Gerar Prisma Client
```

### Frontend

```bash
npm run dev          # Modo desenvolvimento
npm run build        # Build para produção
npm start            # Iniciar produção
npm run lint         # Executar ESLint
```

### MCP Server

```bash
npm run dev          # Modo desenvolvimento com hot reload
npm run build        # Compilar TypeScript
npm start            # Iniciar servidor
```

## 🐛 Troubleshooting

### Backend não inicia

1. Verifique se as portas 3333 estão disponíveis
2. Confirme que o arquivo `.env` está configurado corretamente
3. Execute `npx prisma db push` para criar o schema

### Frontend não conecta à API

1. Verifique se o backend está rodando em http://localhost:3333
2. Confirme que o CORS está habilitado no backend
3. Verifique o console do navegador para erros

### Erro de autenticação

1. Faça login novamente para obter um novo token
2. Verifique se o token não expirou
3. Confirme que o header `Authorization` está correto

### MCP Server não aparece no Claude

1. Verifique o caminho no `claude_desktop_config.json`
2. Certifique-se de que o build foi executado (`npm run build`)
3. Reinicie completamente o Claude Desktop
4. Consulte os logs em `%APPDATA%\Claude\logs`

## 🤝 Contribuindo

### Padrões de Código

- **TypeScript**: Strict mode habilitado
- **ESLint**: Configuração padrão
- **Prettier**: Formatação automática
- **Conventional Commits**: Mensagens de commit padronizadas

### Adicionando Novas Funcionalidades

1. **Backend**:
   - Adicione o model no `prisma/schema.prisma`
   - Crie o service em `src/services/`
   - Crie as rotas em `src/routes/`
   - Registre as rotas em `src/routes/index.ts`
   - Documente no Swagger

2. **Frontend**:
   - Adicione tipos em `lib/api.ts`
   - Crie hooks em `hooks/useApi.ts`
   - Crie componentes em `components/`
   - Use TanStack Query para cache

3. **MCP Server**:
   - Adicione ferramenta em `src/index.ts`
   - Documente no README

## 📝 Changelog

### v1.0.0 (Atual)

**✨ Funcionalidades:**
- ✅ Sistema completo de matrículas e turmas
- ✅ Gestão de escolas e profissionais
- ✅ Frequência e notas
- ✅ Grade horária e calendário letivo
- ✅ Comunicados e notificações
- ✅ Documentação Swagger completa
- ✅ Sistema de observabilidade
- ✅ Paginação server-side
- ✅ MCP Server para IA

**🔜 Próximas Versões:**
- 🔲 Migração para PostgreSQL
- 🔲 Relatórios em PDF
- 🔲 Integração com e-mail
- 🔲 App mobile (React Native)

## 📄 Licença

MIT © SEMEC Ibirapitanga

## 👥 Equipe

**Desenvolvido para:**
Secretaria Municipal de Educação e Cultura (SEMEC)
Prefeitura Municipal de Ibirapitanga - Bahia

## 📞 Suporte

Para dúvidas, problemas ou sugestões:
- Abra uma issue no repositório
- Entre em contato com a SEMEC Ibirapitanga

---

**Feito com ❤️ para a educação de Ibirapitanga/BA**
