import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { escolaService } from "../services/index.js";
import { createEscolaSchema, updateEscolaSchema } from "../schemas/index.js";
import { authMiddleware } from "../middleware/auth.js";

export async function escolasRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Listar todas as escolas
  app.get(
    "/",
    {
      schema: {
        tags: ["Escolas"],
        summary: "Listar todas as escolas",
        description: `
Lista todas as escolas cadastradas no sistema.

**Informações retornadas:**
- Dados básicos da escola (nome, código, contato)
- Endereço e telefone
- Status (ativo/inativo)
- Quantidade de salas
- Infraestrutura disponível
- Etapas de ensino atendidas
- Total de turmas e alunos matriculados

**Uso:**
Use este endpoint para exibir a lista completa de escolas da rede municipal.

**Ordenação:**
Escolas são ordenadas alfabeticamente por nome.
        `,
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Lista de escolas",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                nome: { type: "string", example: "Escola Municipal João Silva" },
                codigo: { type: "string", example: "EM-001" },
                endereco: { type: "string" },
                telefone: { type: "string", example: "(73) 3333-4444" },
                email: { type: "string", format: "email" },
                quantidadeSalas: { type: "integer", example: 12 },
                ativo: { type: "boolean" },
                etapas: { type: "array" },
                _count: {
                  type: "object",
                  properties: {
                    turmas: { type: "integer" },
                  },
                },
              },
            },
          },
          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              error: { type: "string", example: "Token inválido ou expirado" },
            },
          },
          500: {
            description: "Erro ao listar escolas",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const escolas = await escolaService.findAll();
        return reply.send(escolas);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao listar escolas";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar escola por ID
  app.get(
    "/:id",
    {
      schema: {
        tags: ["Escolas"],
        summary: "Obter escola por ID",
        description: `
Retorna os detalhes completos de uma escola específica.

**Informações retornadas:**
- Dados cadastrais completos
- Infraestrutura detalhada (áreas comuns, banheiros, tecnologia, acessibilidade)
- Etapas de ensino atendidas
- Lista de profissionais vinculados
- Turmas ativas
- Total de alunos matriculados
- Contatos e endereço

**Uso:**
Use este endpoint para exibir todos os detalhes de uma escola, incluindo sua capacidade e estrutura física.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da escola",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Escola encontrada",
            type: "object",
            properties: {
              id: { type: "string" },
              nome: { type: "string", example: "Escola Municipal João Silva" },
              codigo: { type: "string", example: "EM-001" },
              endereco: { type: "string" },
              telefone: { type: "string" },
              email: { type: "string", format: "email" },
              quantidadeSalas: { type: "integer", example: 12 },
              ativo: { type: "boolean" },
              etapas: { type: "array" },
              profissionais: { type: "array" },
              turmas: { type: "array" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          404: {
            description: "Escola não encontrada",
            type: "object",
            properties: {
              error: { type: "string", example: "Escola não encontrada" },
            },
          },
          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              error: { type: "string", example: "Token inválido ou expirado" },
            },
          },
          500: {
            description: "Erro ao buscar escola",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const escola = await escolaService.findById(id);

        if (!escola) {
          return reply.status(404).send({ error: "Escola não encontrada" });
        }

        return reply.send(escola);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao buscar escola";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Buscar estatísticas da escola
  app.get(
    "/:id/estatisticas",
    {
      schema: {
        tags: ["Escolas"],
        summary: "Obter estatísticas da escola",
        description: `
Retorna estatísticas completas de uma escola específica.

**Informações retornadas:**
- **Total de alunos matriculados** - Número total de alunos ativos
- **Total de turmas** - Quantidade de turmas ativas
- **Total de professores** - Professores vinculados à escola
- **Total de vagas** - Capacidade total das turmas
- **Vagas ocupadas** - Número de vagas preenchidas
- **Vagas disponíveis** - Vagas ainda não preenchidas
- **Taxa de ocupação** - Percentual de ocupação das vagas (%)
- **Distribuição por etapa** - Alunos por etapa de ensino
- **Distribuição por turno** - Alunos por turno (matutino/vespertino/noturno)

**Uso:**
Ideal para dashboards e relatórios gerenciais da escola. Fornece visão geral da capacidade e utilização da infraestrutura.

**Observações:**
- Considera apenas turmas e alunos ativos
- Taxa de ocupação calculada como (vagas ocupadas / total de vagas) * 100
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da escola",
              example: "clx1234567890",
            },
          },
        },
        response: {
          200: {
            description: "Estatísticas da escola",
            type: "object",
            properties: {
              totalAlunos: { type: "integer", example: 320 },
              totalTurmas: { type: "integer", example: 14 },
              totalProfessores: { type: "integer", example: 18 },
              totalVagas: { type: "integer", example: 350 },
              vagasOcupadas: { type: "integer", example: 320 },
              vagasDisponiveis: { type: "integer", example: 30 },
              taxaOcupacao: { type: "number", example: 91.4 },
              distribuicaoPorEtapa: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    etapa: { type: "string" },
                    total: { type: "integer" },
                  },
                },
              },
              distribuicaoPorTurno: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    turno: { type: "string" },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
          404: {
            description: "Escola não encontrada",
            type: "object",
            properties: {
              error: { type: "string", example: "Escola não encontrada" },
            },
          },
          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              error: { type: "string", example: "Token inválido ou expirado" },
            },
          },
          500: {
            description: "Erro ao buscar estatísticas",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const estatisticas = await escolaService.getEstatisticas(id);

        if (!estatisticas) {
          return reply.status(404).send({ error: "Escola não encontrada" });
        }

        return reply.send(estatisticas);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar estatísticas";
        return reply.status(500).send({ error: message });
      }
    }
  );

  // Criar escola
  app.post(
    "/",
    {
      schema: {
        tags: ["Escolas"],
        summary: "Criar nova escola",
        description: `
Cria uma nova escola no sistema.

**Campos obrigatórios:**
- \`nome\`: Nome da escola
- \`codigo\`: Código único da escola (ex: EM-001)

**Campos opcionais:**
- \`endereco\`: Endereço completo
- \`telefone\`: Telefone de contato
- \`email\`: Email da escola
- \`quantidadeSalas\`: Número de salas de aula (padrão: 0)
- \`ativo\`: Status ativo/inativo (padrão: true)
- \`etapasIds\`: Array de IDs das etapas de ensino atendidas

**Infraestrutura (todos opcionais):**
- Áreas comuns: pátio, parque, quadra, biblioteca, refeitório, etc.
- Banheiros: quantidade por tipo (alunos, alunas, adaptados, funcionários)
- Tecnologia: internet, sala de informática, computadores, projetores
- Acessibilidade: rampa, elevador, piso tátil, sinalização em braile

**Regras de negócio:**
- ⚠️ **Código deve ser único** - Não pode cadastrar escola com código já existente
- Email deve ser válido (se fornecido)
- Quantidades devem ser não-negativas

**Validações:**
- O sistema verifica se o código já existe antes de criar
- Retorna erro 400 se código duplicado
        `,
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["nome", "codigo"],
          properties: {
            nome: {
              type: "string",
              minLength: 1,
              description: "Nome da escola",
              example: "Escola Municipal João Silva",
            },
            codigo: {
              type: "string",
              minLength: 1,
              description: "Código único da escola",
              example: "EM-001",
            },
            endereco: {
              type: "string",
              description: "Endereço completo",
              example: "Rua das Flores, 123, Centro",
            },
            telefone: {
              type: "string",
              description: "Telefone de contato",
              example: "(73) 3333-4444",
            },
            email: {
              type: "string",
              format: "email",
              description: "Email da escola",
              example: "escolajoaosilva@ibirapitanga.ba.gov.br",
            },
            quantidadeSalas: {
              type: "integer",
              minimum: 0,
              default: 0,
              description: "Número de salas de aula",
              example: 12,
            },
            ativo: {
              type: "boolean",
              default: true,
              description: "Status da escola",
              example: true,
            },
            etapasIds: {
              type: "array",
              items: { type: "string" },
              description: "IDs das etapas de ensino atendidas",
              example: ["clx1234567890", "clx0987654321"],
            },
            // Infraestrutura - Áreas comuns
            possuiPatio: { type: "boolean", default: false },
            possuiParque: { type: "boolean", default: false },
            possuiQuadra: { type: "boolean", default: false },
            quadraCoberta: { type: "boolean", default: false },
            possuiBiblioteca: { type: "boolean", default: false },
            possuiRefeitorio: { type: "boolean", default: false },
            possuiSalaProfessores: { type: "boolean", default: false },
            possuiSecretaria: { type: "boolean", default: false },
            possuiDiretoria: { type: "boolean", default: false },
            possuiAlmoxarifado: { type: "boolean", default: false },
            possuiCozinha: { type: "boolean", default: false },
            possuiDispensa: { type: "boolean", default: false },
            // Infraestrutura - Banheiros
            qtdBanheirosAlunos: {
              type: "integer",
              minimum: 0,
              default: 0,
              description: "Quantidade de banheiros masculinos",
            },
            qtdBanheirosAlunas: {
              type: "integer",
              minimum: 0,
              default: 0,
              description: "Quantidade de banheiros femininos",
            },
            qtdBanheirosAdaptados: {
              type: "integer",
              minimum: 0,
              default: 0,
              description: "Quantidade de banheiros adaptados para PCD",
            },
            qtdBanheirosFuncionarios: {
              type: "integer",
              minimum: 0,
              default: 0,
              description: "Quantidade de banheiros para funcionários",
            },
            // Infraestrutura - Tecnologia
            possuiInternet: { type: "boolean", default: false },
            tipoInternet: {
              type: "string",
              nullable: true,
              description: "Tipo de conexão (Fibra, ADSL, etc.)",
            },
            velocidadeInternet: {
              type: "string",
              nullable: true,
              description: "Velocidade contratada",
            },
            possuiSalaInformatica: { type: "boolean", default: false },
            qtdComputadores: {
              type: "integer",
              minimum: 0,
              default: 0,
              description: "Quantidade de computadores disponíveis",
            },
            possuiProjetores: { type: "boolean", default: false },
            qtdProjetores: {
              type: "integer",
              minimum: 0,
              default: 0,
              description: "Quantidade de projetores",
            },
            // Infraestrutura - Acessibilidade
            possuiRampaAcesso: { type: "boolean", default: false },
            possuiElevador: { type: "boolean", default: false },
            possuiPisoTatil: { type: "boolean", default: false },
            possuiSinalizacaoBraile: { type: "boolean", default: false },
          },
        },
        response: {
          201: {
            description: "Escola criada com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              nome: { type: "string" },
              codigo: { type: "string" },
              endereco: { type: "string" },
              telefone: { type: "string" },
              email: { type: "string" },
              quantidadeSalas: { type: "integer" },
              ativo: { type: "boolean" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
          400: {
            description: "Erro de validação ou código duplicado",
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "Código de escola já cadastrado",
              },
            },
          },
          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              error: { type: "string", example: "Token inválido ou expirado" },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = createEscolaSchema.parse(request.body);

        // Verifica se código já existe
        const existing = await escolaService.findByCodigo(data.codigo);
        if (existing) {
          return reply
            .status(400)
            .send({ error: "Código de escola já cadastrado" });
        }

        const escola = await escolaService.create(data);
        return reply.status(201).send(escola);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao criar escola";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Atualizar escola
  app.put(
    "/:id",
    {
      schema: {
        tags: ["Escolas"],
        summary: "Atualizar escola",
        description: `
Atualiza os dados de uma escola existente.

**Campos atualizáveis:**
Todos os campos são opcionais. Envie apenas os campos que deseja atualizar.

**Campos disponíveis:**
- Dados cadastrais: nome, código, endereço, telefone, email
- Capacidade: quantidadeSalas
- Status: ativo (true/false)
- Etapas de ensino: etapasIds
- Infraestrutura completa (áreas comuns, banheiros, tecnologia, acessibilidade)

**Validações:**
- Código deve permanecer único se alterado
- Email deve ser válido
- Quantidades devem ser não-negativas

**Observações:**
- Para alterar código, certifique-se de que o novo código não está em uso
- Alterações na infraestrutura não afetam turmas existentes
- Desativar escola (ativo: false) não remove turmas ou alunos

**Uso comum:**
- Atualizar dados de contato
- Adicionar/atualizar informações de infraestrutura
- Vincular novas etapas de ensino
- Desativar temporariamente a escola
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da escola",
              example: "clx1234567890",
            },
          },
        },
        body: {
          type: "object",
          properties: {
            nome: { type: "string", example: "Escola Municipal Maria Santos" },
            codigo: { type: "string", example: "EM-002" },
            endereco: { type: "string" },
            telefone: { type: "string" },
            email: { type: "string", format: "email" },
            quantidadeSalas: { type: "integer", minimum: 0 },
            ativo: { type: "boolean" },
            etapasIds: {
              type: "array",
              items: { type: "string" },
              description: "IDs das etapas de ensino",
            },
            // Infraestrutura - Áreas comuns
            possuiPatio: { type: "boolean" },
            possuiParque: { type: "boolean" },
            possuiQuadra: { type: "boolean" },
            quadraCoberta: { type: "boolean" },
            possuiBiblioteca: { type: "boolean" },
            possuiRefeitorio: { type: "boolean" },
            possuiSalaProfessores: { type: "boolean" },
            possuiSecretaria: { type: "boolean" },
            possuiDiretoria: { type: "boolean" },
            possuiAlmoxarifado: { type: "boolean" },
            possuiCozinha: { type: "boolean" },
            possuiDispensa: { type: "boolean" },
            // Infraestrutura - Banheiros
            qtdBanheirosAlunos: { type: "integer", minimum: 0 },
            qtdBanheirosAlunas: { type: "integer", minimum: 0 },
            qtdBanheirosAdaptados: { type: "integer", minimum: 0 },
            qtdBanheirosFuncionarios: { type: "integer", minimum: 0 },
            // Infraestrutura - Tecnologia
            possuiInternet: { type: "boolean" },
            tipoInternet: { type: "string", nullable: true },
            velocidadeInternet: { type: "string", nullable: true },
            possuiSalaInformatica: { type: "boolean" },
            qtdComputadores: { type: "integer", minimum: 0 },
            possuiProjetores: { type: "boolean" },
            qtdProjetores: { type: "integer", minimum: 0 },
            // Infraestrutura - Acessibilidade
            possuiRampaAcesso: { type: "boolean" },
            possuiElevador: { type: "boolean" },
            possuiPisoTatil: { type: "boolean" },
            possuiSinalizacaoBraile: { type: "boolean" },
          },
        },
        response: {
          200: {
            description: "Escola atualizada com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              nome: { type: "string" },
              codigo: { type: "string" },
              endereco: { type: "string" },
              telefone: { type: "string" },
              email: { type: "string" },
              quantidadeSalas: { type: "integer" },
              ativo: { type: "boolean" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          400: {
            description: "Erro de validação",
            type: "object",
            properties: {
              error: { type: "string" },
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
            description: "Escola não encontrada",
            type: "object",
            properties: {
              error: { type: "string", example: "Escola não encontrada" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = updateEscolaSchema.parse(request.body);
        const escola = await escolaService.update(id, data);
        return reply.send(escola);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar escola";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Deletar escola
  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Escolas"],
        summary: "Deletar escola",
        description: `
Remove uma escola do sistema.

**⚠️ ATENÇÃO - Restrições Importantes:**
- **Não é possível deletar escola com turmas ativas**
- Não é possível deletar escola com alunos matriculados
- Não é possível deletar escola com profissionais vinculados

**Recomendação:**
Em vez de deletar, considere **desativar a escola** (campo \`ativo: false\`). Isso:
- Preserva histórico de turmas e alunos
- Mantém registros para relatórios
- Permite reativação futura
- Evita perda de dados

**Efeitos da deleção:**
- Remove todos os vínculos com etapas de ensino
- Remove informações de infraestrutura
- Remove permanentemente do banco de dados
- **Não pode ser desfeito**

**Quando usar:**
- Escola cadastrada por engano
- Duplicata de cadastro
- Escola nunca operou (sem turmas ou alunos)

**Validações:**
O sistema verifica automaticamente se existem turmas ativas antes de permitir a exclusão.
        `,
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "ID da escola",
              example: "clx1234567890",
            },
          },
        },
        response: {
          204: {
            description: "Escola deletada com sucesso",
            type: "null",
          },
          400: {
            description: "Não é possível deletar (possui dependências)",
            type: "object",
            properties: {
              error: {
                type: "string",
                example: "Não é possível deletar escola com turmas ativas",
              },
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
            description: "Escola não encontrada",
            type: "object",
            properties: {
              error: { type: "string", example: "Escola não encontrada" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await escolaService.delete(id);
        return reply.status(204).send();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao deletar escola";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
