import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";

// Schemas de validação
const createSalaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.enum([
    "AULA",
    "INFORMATICA",
    "LEITURA",
    "LABORATORIO",
    "MULTIUSO",
    "AEE",
  ]),
  capacidade: z.number().int().min(1).default(25),
  possuiArCondicionado: z.boolean().default(false),
  possuiVentilador: z.boolean().default(false),
  possuiTV: z.boolean().default(false),
  possuiProjetor: z.boolean().default(false),
  possuiQuadro: z.boolean().default(true),
  metragem: z.number().positive().optional().nullable(),
  andar: z.number().int().min(0).default(0),
  acessivel: z.boolean().default(true),
  observacoes: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
});

const updateSalaSchema = createSalaSchema.partial();

export async function salasRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Listar todas as salas de uma escola
  app.get(
    "/api/escolas/:escolaId/salas",
    {
      schema: {
        tags: ["Salas"],
        summary: "Listar todas as salas de uma escola",
        description:
          "Retorna a lista completa de salas cadastradas para uma escola específica, ordenadas por tipo e nome.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["escolaId"],
          properties: {
            escolaId: {
              type: "string",
              format: "uuid",
              description: "ID da escola",
            },
          },
        },
        response: {
          200: {
            description: "Lista de salas retornada com sucesso",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                nome: { type: "string", example: "Sala 1A" },
                tipo: {
                  type: "string",
                  enum: ["AULA", "INFORMATICA", "LEITURA", "LABORATORIO", "MULTIUSO", "AEE"],
                  example: "AULA",
                },
                capacidade: { type: "number", example: 30 },
                possuiArCondicionado: { type: "boolean", example: true },
                possuiVentilador: { type: "boolean", example: true },
                possuiTV: { type: "boolean", example: true },
                possuiProjetor: { type: "boolean", example: false },
                possuiQuadro: { type: "boolean", example: true },
                metragem: { type: "number", nullable: true, example: 45.5 },
                andar: { type: "number", example: 0 },
                acessivel: { type: "boolean", example: true },
                observacoes: { type: "string", nullable: true },
                ativo: { type: "boolean", example: true },
                escolaId: { type: "string", format: "uuid" },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          },
          500: {
            description: "Erro interno do servidor",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { escolaId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId } = request.params;

        const salas = await prisma.sala.findMany({
          where: { escolaId },
          orderBy: [{ tipo: "asc" }, { nome: "asc" }],
        });

        return reply.send(salas);
      } catch (error) {
        console.error("Erro ao listar salas:", error);
        return reply.status(500).send({ error: "Erro ao listar salas" });
      }
    }
  );

  // Buscar sala por ID
  app.get(
    "/api/salas/:id",
    {
      schema: {
        tags: ["Salas"],
        summary: "Buscar sala por ID",
        description:
          "Retorna uma sala específica pelo seu identificador único, incluindo informações da escola.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "ID da sala",
            },
          },
        },
        response: {
          200: {
            description: "Sala encontrada",
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              nome: { type: "string", example: "Sala 1A" },
              tipo: { type: "string", example: "AULA" },
              capacidade: { type: "number", example: 30 },
              possuiArCondicionado: { type: "boolean" },
              possuiVentilador: { type: "boolean" },
              possuiTV: { type: "boolean" },
              possuiProjetor: { type: "boolean" },
              possuiQuadro: { type: "boolean" },
              metragem: { type: "number", nullable: true },
              andar: { type: "number" },
              acessivel: { type: "boolean" },
              observacoes: { type: "string", nullable: true },
              ativo: { type: "boolean" },
              escolaId: { type: "string", format: "uuid" },
              escola: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  nome: { type: "string" },
                  codigo: { type: "string" },
                },
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          404: {
            description: "Sala não encontrada",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          500: {
            description: "Erro interno do servidor",
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

        const sala = await prisma.sala.findUnique({
          where: { id },
          include: {
            escola: {
              select: { id: true, nome: true, codigo: true },
            },
          },
        });

        if (!sala) {
          return reply.status(404).send({ error: "Sala não encontrada" });
        }

        return reply.send(sala);
      } catch (error) {
        console.error("Erro ao buscar sala:", error);
        return reply.status(500).send({ error: "Erro ao buscar sala" });
      }
    }
  );

  // Criar nova sala
  app.post(
    "/api/escolas/:escolaId/salas",
    async (
      request: FastifyRequest<{
        Params: { escolaId: string };
        Body: z.infer<typeof createSalaSchema>;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId } = request.params;
        const data = createSalaSchema.parse(request.body);

        // Verificar se a escola existe
        const escola = await prisma.escola.findUnique({
          where: { id: escolaId },
        });

        if (!escola) {
          return reply.status(404).send({ error: "Escola não encontrada" });
        }

        const sala = await prisma.sala.create({
          data: {
            ...data,
            escolaId,
          },
        });

        // Atualizar quantidade de salas da escola se for sala de aula
        if (data.tipo === "AULA") {
          await prisma.escola.update({
            where: { id: escolaId },
            data: {
              quantidadeSalas: {
                increment: 1,
              },
            },
          });
        }

        return reply.status(201).send(sala);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors });
        }
        console.error("Erro ao criar sala:", error);
        return reply.status(500).send({ error: "Erro ao criar sala" });
      }
    }
  );

  // Atualizar sala
  app.put(
    "/api/salas/:id",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: z.infer<typeof updateSalaSchema>;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = updateSalaSchema.parse(request.body);

        // Verificar se a sala existe
        const salaExistente = await prisma.sala.findUnique({
          where: { id },
        });

        if (!salaExistente) {
          return reply.status(404).send({ error: "Sala não encontrada" });
        }

        // Se o tipo mudou de/para AULA, atualizar contagem
        if (data.tipo && data.tipo !== salaExistente.tipo) {
          if (salaExistente.tipo === "AULA" && data.tipo !== "AULA") {
            // Era sala de aula, não é mais
            await prisma.escola.update({
              where: { id: salaExistente.escolaId },
              data: { quantidadeSalas: { decrement: 1 } },
            });
          } else if (salaExistente.tipo !== "AULA" && data.tipo === "AULA") {
            // Não era sala de aula, agora é
            await prisma.escola.update({
              where: { id: salaExistente.escolaId },
              data: { quantidadeSalas: { increment: 1 } },
            });
          }
        }

        const sala = await prisma.sala.update({
          where: { id },
          data,
        });

        return reply.send(sala);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.errors });
        }
        console.error("Erro ao atualizar sala:", error);
        return reply.status(500).send({ error: "Erro ao atualizar sala" });
      }
    }
  );

  // Deletar sala
  app.delete(
    "/api/salas/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;

        const sala = await prisma.sala.findUnique({
          where: { id },
        });

        if (!sala) {
          return reply.status(404).send({ error: "Sala não encontrada" });
        }

        await prisma.sala.delete({
          where: { id },
        });

        // Atualizar quantidade de salas se era sala de aula
        if (sala.tipo === "AULA") {
          await prisma.escola.update({
            where: { id: sala.escolaId },
            data: { quantidadeSalas: { decrement: 1 } },
          });
        }

        return reply.status(204).send();
      } catch (error) {
        console.error("Erro ao deletar sala:", error);
        return reply.status(500).send({ error: "Erro ao deletar sala" });
      }
    }
  );

  // Estatísticas das salas de uma escola
  app.get(
    "/api/escolas/:escolaId/salas/estatisticas",
    async (
      request: FastifyRequest<{ Params: { escolaId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { escolaId } = request.params;

        const salas = await prisma.sala.findMany({
          where: { escolaId, ativo: true },
        });

        const estatisticas = {
          totalSalas: salas.length,
          salasAula: salas.filter((s) => s.tipo === "AULA").length,
          salasInformatica: salas.filter((s) => s.tipo === "INFORMATICA")
            .length,
          salasLeitura: salas.filter((s) => s.tipo === "LEITURA").length,
          laboratorios: salas.filter((s) => s.tipo === "LABORATORIO").length,
          salasMultiuso: salas.filter((s) => s.tipo === "MULTIUSO").length,
          salasAEE: salas.filter((s) => s.tipo === "AEE").length,
          capacidadeTotal: salas.reduce((acc, s) => acc + s.capacidade, 0),
          salasComArCondicionado: salas.filter((s) => s.possuiArCondicionado)
            .length,
          salasComProjetor: salas.filter((s) => s.possuiProjetor).length,
          salasAcessiveis: salas.filter((s) => s.acessivel).length,
        };

        return reply.send(estatisticas);
      } catch (error) {
        console.error("Erro ao calcular estatísticas:", error);
        return reply
          .status(500)
          .send({ error: "Erro ao calcular estatísticas" });
      }
    }
  );
}
