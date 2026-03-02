import { FastifyInstance } from "fastify";
import { authService, refreshTokenService } from "../services/index.js";
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
    },
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
                description: "Access Token JWT (válido por 15 minutos)",
                example:
                  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNseDEyMzQ1Njc4OTAiLCJlbWFpbCI6ImRpcmV0b3JAZXN...",
              },
              refreshToken: {
                type: "string",
                description:
                  "Refresh Token (válido por 30 dias, usar em POST /refresh)",
                example: "a1b2c3d4e5f6...",
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

        // Gerar refresh token
        const refreshToken = await refreshTokenService.generateRefreshToken(
          user.id,
        );

        return reply.send({ user, token, refreshToken });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao fazer login";
        return reply.status(401).send({ error: message });
      }
    },
  );

  // Refresh Token - Gera novo access token
  app.post(
    "/refresh",
    {
      schema: {
        tags: ["Autenticação"],
        summary: "Renovar access token usando refresh token",
        description: `Gera um novo access token e um novo refresh token (rotation).

**Token Rotation:**
- O refresh token antigo é revogado ao usar este endpoint
- Um novo refresh token é retornado junto com o novo access token
- Se um refresh token revogado for reutilizado, TODOS os tokens do usuário são revogados (proteção contra roubo)

**Uso típico:**
1. Access token expira (erro 401)
2. Frontend chama POST /refresh com o refresh token salvo
3. Recebe novo access token + novo refresh token
4. Atualiza os tokens armazenados
        `,
        body: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: {
              type: "string",
              description: "Refresh token obtido no login",
            },
          },
        },
        response: {
          200: {
            description: "Tokens renovados com sucesso",
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  email: { type: "string" },
                  nome: { type: "string" },
                  role: { type: "string" },
                },
              },
              token: {
                type: "string",
                description: "Novo access token JWT (15 min)",
              },
              refreshToken: {
                type: "string",
                description: "Novo refresh token (30 dias)",
              },
            },
          },
          401: {
            description: "Refresh token inválido ou expirado",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { refreshToken } = request.body as { refreshToken: string };

        if (!refreshToken) {
          return reply
            .status(401)
            .send({ error: "Refresh token não fornecido" });
        }

        const result =
          await refreshTokenService.rotateRefreshToken(refreshToken);

        if (!result) {
          return reply
            .status(401)
            .send({ error: "Refresh token inválido ou expirado" });
        }

        const token = app.jwt.sign({
          id: result.user.id,
          email: result.user.email,
          nome: result.user.nome,
          role: result.user.role,
        });

        return reply.send({
          user: result.user,
          token,
          refreshToken: result.refreshToken,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao renovar token";
        return reply.status(401).send({ error: message });
      }
    },
  );

  // Logout - Revogar refresh token
  app.post(
    "/logout",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["Autenticação"],
        summary: "Fazer logout (revogar refresh token)",
        description: `Revoga o refresh token do usuário.

**Opções:**
- Enviar \`refreshToken\` no body: revoga apenas aquele token (logout deste dispositivo)
- Enviar \`allDevices: true\`: revoga TODOS os refresh tokens do usuário (logout de todos os dispositivos)
        `,
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            refreshToken: {
              type: "string",
              description: "Refresh token a ser revogado",
            },
            allDevices: {
              type: "boolean",
              description: "Se true, revoga tokens de todos os dispositivos",
              default: false,
            },
          },
        },
        response: {
          200: {
            description: "Logout realizado com sucesso",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { refreshToken, allDevices } = request.body as {
          refreshToken?: string;
          allDevices?: boolean;
        };
        const userPayload = request.user as { id: string };

        if (allDevices) {
          await refreshTokenService.revokeAllUserTokens(userPayload.id);
          return reply.send({
            message: "Logout realizado em todos os dispositivos",
          });
        }

        if (refreshToken) {
          await refreshTokenService.revokeToken(refreshToken);
        }

        return reply.send({ message: "Logout realizado com sucesso" });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao fazer logout";
        return reply.status(500).send({ error: message });
      }
    },
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
          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              error: { type: "string", example: "Token inválido ou expirado" },
            },
          },
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
    },
  );
}
