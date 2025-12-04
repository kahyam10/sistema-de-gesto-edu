import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod";

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
  // Listar todas as salas de uma escola
  app.get(
    "/api/escolas/:escolaId/salas",
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
