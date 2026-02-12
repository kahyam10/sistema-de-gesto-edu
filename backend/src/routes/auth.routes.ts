import { FastifyInstance } from "fastify";
import { authService } from "../services/index.js";
import { registerSchema, loginSchema } from "../schemas/index.js";

export async function authRoutes(app: FastifyInstance) {
  // Registro de usuário
  app.post(
    "/register",
    {
      schema: {
        tags: ["Autenticação"],
        summary: "Registrar novo usuário",
        description: `Cria um novo usuário no sistema.

**Roles disponíveis:**
- \`ADMIN\`: Administrador do sistema (acesso total)
- \`SEMEC\`: Secretaria Municipal de Educação
- \`DIRETOR\`: Diretor de escola
- \`COORDENADOR\`: Coordenador pedagógico
- \`PROFESSOR\`: Professor
- \`SECRETARIO\`: Secretário escolar

**Regras de negócio:**
- Email deve ser único no sistema
- Senha deve ter no mínimo 6 caracteres
- Se \`escolaId\` for fornecido, o usuário será vinculado à escola
- Apenas usuários ADMIN ou SEMEC podem criar novos usuários
        `,
        body: {
          type: "object",
          required: ["email", "password", "nome"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "Email do usuário (deve ser único)",
              example: "diretor@escola.com",
            },
            password: {
              type: "string",
              minLength: 6,
              description: "Senha do usuário (mínimo 6 caracteres)",
              example: "senha123",
            },
            nome: {
              type: "string",
              minLength: 3,
              description: "Nome completo do usuário",
              example: "João da Silva",
            },
            role: {
              type: "string",
              enum: [
                "ADMIN",
                "SEMEC",
                "DIRETOR",
                "COORDENADOR",
                "PROFESSOR",
                "SECRETARIO",
              ],
              default: "SECRETARIO",
              description: "Papel do usuário no sistema",
            },
            escolaId: {
              type: "string",
              description: "ID da escola (opcional, para vincular o usuário)",
              example: "clx1234567890",
            },
          },
        },
        response: {
          201: {
            description: "Usuário criado com sucesso",
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  id: { type: "string", example: "clx1234567890" },
                  email: { type: "string", example: "diretor@escola.com" },
                  nome: { type: "string", example: "João da Silva" },
                  role: { type: "string", example: "DIRETOR" },
                  ativo: { type: "boolean", example: true },
                  createdAt: {
                    type: "string",
                    format: "date-time",
                    example: "2026-02-12T14:30:00.000Z",
                  },
                },
              },
              token: {
                type: "string",
                description: "Token JWT para autenticação",
                example:
                  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNseDEyMzQ1Njc4OTAiLCJlbWFpbCI6ImRpcmV0b3JAZXN...",
              },
            },
          },
          400: {
            description: "Dados inválidos ou email já existe",
            type: "object",
            properties: {
              error: { type: "string", example: "Email já cadastrado" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const data = registerSchema.parse(request.body);
        const user = await authService.register(data);

        const token = app.jwt.sign({
          id: user.id,
          email: user.email,
          nome: user.nome,
          role: user.role,
        });

        return reply.status(201).send({ user, token });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao registrar usuário";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Login
  app.post(
    "/login",
    {
      schema: {
        tags: ["Autenticação"],
        summary: "Fazer login no sistema",
        description: `Autentica um usuário e retorna um token JWT.

**Como usar o token:**
1. Faça login com email e senha
2. Copie o token retornado
3. Clique no botão "Authorize" (🔒) no topo da página
4. Cole o token no campo "Value" (apenas o token, sem "Bearer")
5. Clique em "Authorize"
6. Agora você pode testar os endpoints protegidos

**Token JWT:**
- Expira após o período configurado no servidor
- Contém informações do usuário (id, email, nome, role)
- Deve ser enviado no header: \`Authorization: Bearer <token>\`

**Segurança:**
- Máximo de tentativas de login antes de bloquear (configurável)
- Senha é criptografada com bcrypt
- Token é assinado com secret key do servidor
        `,
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "Email do usuário",
              example: "diretor@escola.com",
            },
            password: {
              type: "string",
              description: "Senha do usuário",
              example: "senha123",
            },
          },
        },
        response: {
          200: {
            description: "Login realizado com sucesso",
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  id: { type: "string", example: "clx1234567890" },
                  email: { type: "string", example: "diretor@escola.com" },
                  nome: { type: "string", example: "João da Silva" },
                  role: { type: "string", example: "DIRETOR" },
                  ativo: { type: "boolean", example: true },
                  escola: {
                    type: "object",
                    nullable: true,
                    properties: {
                      id: { type: "string" },
                      nome: { type: "string" },
                      codigo: { type: "string" },
                    },
                  },
                },
              },
              token: {
                type: "string",
                description: "Token JWT (válido por tempo configurado)",
                example:
                  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNseDEyMzQ1Njc4OTAiLCJlbWFpbCI6ImRpcmV0b3JAZXN...",
              },
            },
          },
          401: {
            description: "Credenciais inválidas",
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "Email ou senha incorretos",
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const data = loginSchema.parse(request.body);
        const user = await authService.login(data);

        const token = app.jwt.sign({
          id: user.id,
          email: user.email,
          nome: user.nome,
          role: user.role,
        });

        return reply.send({ user, token });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao fazer login";
        return reply.status(401).send({ error: message });
      }
    }
  );

  // Obter usuário logado
  app.get(
    "/me",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["Autenticação"],
        summary: "Obter dados do usuário autenticado",
        description: `Retorna os dados completos do usuário autenticado pelo token JWT.

**Uso:**
- Endpoint protegido que requer autenticação
- Útil para verificar se o token ainda é válido
- Retorna informações atualizadas do usuário logado

**Requer autenticação:**
- Token JWT válido no header Authorization
        `,
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Dados do usuário autenticado",
            type: "object",
            properties: {
              id: { type: "string", example: "clx1234567890" },
              email: { type: "string", example: "diretor@escola.com" },
              nome: { type: "string", example: "João da Silva" },
              role: { type: "string", example: "DIRETOR" },
              ativo: { type: "boolean", example: true },
              escolaId: { type: "string", nullable: true },
              escola: {
                type: "object",
                nullable: true,
                properties: {
                  id: { type: "string" },
                  nome: { type: "string" },
                  codigo: { type: "string" },
                },
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: {
            description: "Usuário não encontrado",
            type: "object",
            properties: { error: { type: "string" } },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const userPayload = request.user as { id: string };
        const user = await authService.getUserById(userPayload.id);

        if (!user) {
          return reply.status(404).send({ error: "Usuário não encontrado" });
        }

        return reply.send(user);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar usuário";
        return reply.status(500).send({ error: message });
      }
    }
  );
}
