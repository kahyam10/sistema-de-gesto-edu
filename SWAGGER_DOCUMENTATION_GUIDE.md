# 📚 Guia de Documentação Swagger - API Sistema de Gestão Educacional

## ✅ O Que Foi Implementado

### 1. Configuração Avançada do Swagger

**Arquivo**: `backend/src/server.ts`

- ✅ Descrição completa da API com markdown
- ✅ Tags organizadas por módulos
- ✅ Schemas de erro padronizados
- ✅ Responses reutilizáveis (Unauthorized, Forbidden, NotFound, BadRequest)
- ✅ Informações de contato e licença
- ✅ Múltiplos servidores (dev e produção)
- ✅ Documentação de autenticação JWT
- ✅ Guia de paginação

### 2. Tema Personalizado

**Arquivo**: `backend/public/swagger-theme.css`

- ✅ Cores baseadas no dashboard do sistema
- ✅ Estilo moderno e profissional
- ✅ Cores diferenciadas por método HTTP:
  - GET: Azul (info)
  - POST: Verde (success)
  - PUT: Amarelo (warning)
  - DELETE: Vermelho (error)
  - PATCH: Roxo
- ✅ Responsivo para mobile
- ✅ Scrollbar customizada
- ✅ Destaque para botões e inputs

### 3. Documentação Detalhada de Rotas

**Exemplo implementado**: `backend/src/routes/auth.routes.ts`

Rotas documentadas:
- ✅ `POST /api/auth/register` - Registro de usuário
- ✅ `POST /api/auth/login` - Login com JWT

Cada rota inclui:
- **Tags**: Para agrupamento
- **Summary**: Título curto
- **Description**: Explicação detalhada com markdown
- **Body schema**: Tipos, validações, exemplos
- **Response schema**: Para cada status code
- **Exemplos práticos**: Valores reais de exemplo

## 🎯 Como Acessar

### Swagger UI Padrão
```
http://localhost:3333/docs
```

### Swagger UI Customizado (com tema)
```
http://localhost:3333/public/swagger-custom.html
```

### Especificação OpenAPI JSON
```
http://localhost:3333/docs/json
```

## 📝 Como Documentar Novas Rotas

### Template Básico

```typescript
import { FastifyInstance } from "fastify";

export async function minhaRota(app: FastifyInstance) {
  app.post(
    "/criar",
    {
      schema: {
        tags: ["Nome do Módulo"],
        summary: "Título curto da operação",
        description: `
Descrição detalhada em **markdown**.

**Regras de negócio:**
- Regra 1
- Regra 2

**Observações:**
- Nota importante
        `,
        body: {
          type: "object",
          required: ["campo1", "campo2"],
          properties: {
            campo1: {
              type: "string",
              description: "Descrição do campo",
              example: "Valor de exemplo",
            },
            campo2: {
              type: "number",
              minimum: 0,
              description: "Campo numérico",
              example: 100,
            },
          },
        },
        response: {
          201: {
            description: "Sucesso ao criar",
            type: "object",
            properties: {
              id: { type: "string", example: "clx123456" },
              nome: { type: "string", example: "Nome" },
            },
          },
          400: {
            $ref: "#/components/responses/BadRequest",
          },
          401: {
            $ref: "#/components/responses/Unauthorized",
          },
        },
      },
    },
    async (request, reply) => {
      // Implementação aqui
    }
  );
}
```

### Tipos de Dados Comuns

```typescript
// String
{
  type: "string",
  minLength: 3,
  maxLength: 100,
  pattern: "^[A-Z]",
  example: "Exemplo"
}

// Number
{
  type: "number",
  minimum: 0,
  maximum: 100,
  example: 50
}

// Integer
{
  type: "integer",
  example: 10
}

// Boolean
{
  type: "boolean",
  example: true
}

// Enum
{
  type: "string",
  enum: ["OPCAO1", "OPCAO2", "OPCAO3"],
  example: "OPCAO1"
}

// Date
{
  type: "string",
  format: "date",
  example: "2026-02-12"
}

// DateTime
{
  type: "string",
  format: "date-time",
  example: "2026-02-12T14:30:00.000Z"
}

// Email
{
  type: "string",
  format: "email",
  example: "usuario@exemplo.com"
}

// Array
{
  type: "array",
  items: {
    type: "string"
  },
  example: ["item1", "item2"]
}

// Object aninhado
{
  type: "object",
  properties: {
    campo: { type: "string" }
  }
}

// Nullable
{
  type: "string",
  nullable: true
}
```

### Query Parameters (Paginação, Filtros)

```typescript
schema: {
  tags: ["Módulo"],
  summary: "Listar itens",
  querystring: {
    type: "object",
    properties: {
      page: {
        type: "integer",
        minimum: 1,
        default: 1,
        description: "Número da página",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        default: 20,
        description: "Itens por página",
      },
      escolaId: {
        type: "string",
        description: "Filtrar por escola",
      },
      ativo: {
        type: "boolean",
        description: "Filtrar por status ativo",
      },
    },
  },
  response: {
    200: {
      description: "Lista de itens (paginada ou completa)",
      type: "object",
      properties: {
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              nome: { type: "string" },
            },
          },
        },
        pagination: {
          $ref: "#/components/schemas/PaginationMeta",
        },
      },
    },
  },
}
```

### Path Parameters

```typescript
schema: {
  tags: ["Módulo"],
  summary: "Obter item por ID",
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: {
        type: "string",
        description: "ID do recurso",
        example: "clx1234567890",
      },
    },
  },
  response: {
    200: {
      description: "Item encontrado",
      type: "object",
      properties: {
        id: { type: "string" },
        nome: { type: "string" },
      },
    },
    404: {
      $ref: "#/components/responses/NotFound",
    },
  },
}
```

### Rota com Autenticação

```typescript
app.get(
  "/protegida",
  {
    preHandler: [app.authenticate],
    schema: {
      tags: ["Módulo"],
      summary: "Endpoint protegido",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: "Sucesso",
          type: "object",
          properties: {
            data: { type: "string" },
          },
        },
        401: {
          $ref: "#/components/responses/Unauthorized",
        },
      },
    },
  },
  async (request, reply) => {
    // Tem acesso a request.user
  }
);
```

## 📋 Checklist de Documentação

Para cada rota, documente:

- [ ] **Tag** - Qual módulo pertence
- [ ] **Summary** - Título descritivo
- [ ] **Description** - Explicação detalhada
- [ ] **Body/Querystring/Params** - Todos os parâmetros de entrada
- [ ] **Required fields** - Campos obrigatórios
- [ ] **Validations** - Limites, padrões, enum
- [ ] **Examples** - Valores de exemplo realistas
- [ ] **Response 2xx** - Resposta de sucesso
- [ ] **Response 4xx/5xx** - Possíveis erros
- [ ] **Security** - Se requer autenticação

## 🎨 Personalização do Tema

### Cores Principais

O tema usa as seguintes variáveis CSS (em `backend/public/swagger-theme.css`):

```css
--primary: 222.2 47.4% 11.2%;        /* Azul escuro */
--success: 142.1 76.2% 36.3%;        /* Verde */
--info: 221.2 83.2% 53.3%;           /* Azul */
--warning: 47.9 95.8% 53.1%;         /* Amarelo */
--error: 0 84.2% 60.2%;              /* Vermelho */
```

Para alterar, edite o arquivo `swagger-theme.css`.

## 🚀 Próximos Passos

### Rotas Prioritárias para Documentar

1. **Matrículas** (`matriculas.routes.ts`)
   - POST /api/matriculas - Criar matrícula
   - GET /api/matriculas - Listar matrículas
   - GET /api/matriculas/:id - Obter matrícula
   - PUT /api/matriculas/:id - Atualizar matrícula
   - DELETE /api/matriculas/:id - Excluir matrícula

2. **Turmas** (`turmas.routes.ts`)
   - POST /api/turmas - Criar turma
   - GET /api/turmas - Listar turmas (com paginação)
   - GET /api/turmas/:id - Obter turma
   - PUT /api/turmas/:id - Atualizar turma
   - POST /api/turmas/:id/alunos - Adicionar aluno

3. **Profissionais** (`profissionais.routes.ts`)
   - POST /api/profissionais - Criar profissional
   - GET /api/profissionais - Listar profissionais
   - PUT /api/profissionais/:id - Atualizar profissional

4. **Escolas** (`escolas.routes.ts`)
5. **Frequência** (`frequencia.routes.ts`)
6. **Notas** (`notas.routes.ts`)
7. **Grade Horária** (`grade-horaria.routes.ts`)

### Dicas

- Use o padrão da rota `/auth/login` como referência
- Copie e adapte o schema para suas necessidades
- Teste cada rota documentada no Swagger UI
- Mantenha exemplos realistas e atualizados
- Documente regras de negócio importantes
- Use markdown para formatação

## 📖 Referências

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Fastify Swagger Plugin](https://github.com/fastify/fastify-swagger)
- [Swagger UI Configuration](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/)

## ✨ Resultado Final

Com a documentação completa, você terá:

- ✅ API totalmente documentada e testável via browser
- ✅ Exemplos práticos para cada endpoint
- ✅ Validações claras de entrada/saída
- ✅ Interface profissional e moderna
- ✅ Fácil onboarding de novos desenvolvedores
- ✅ Documentação sempre atualizada com o código
