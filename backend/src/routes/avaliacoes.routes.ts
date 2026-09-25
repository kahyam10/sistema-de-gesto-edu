// Avaliações (provas, trabalhos...) de uma turma/disciplina.
// O dashboard (avaliacoesApi) e o app do professor usam estas rotas; antes
// elas não estavam registradas no servidor e o lançamento de notas falhava.
import { FastifyInstance } from "fastify";
import { z, ZodError } from "zod";
import { AppError, formatarErroZod } from "../errors/index.js";
import { avaliacaoService } from "../services/avaliacao.service.js";
import { createAvaliacaoSchema, updateAvaliacaoSchema } from "../schemas/index.js";

const filtroSchema = z.object({
  turmaId: z.string().max(40).optional(),
  disciplinaId: z.string().max(40).optional(),
  bimestre: z.coerce.number().int().min(1).max(4).optional(),
});

function tratarErro(error: unknown, reply: import("fastify").FastifyReply, padrao: string) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ error: error.message });
  }
  if (error instanceof ZodError) {
    return reply.status(400).send(formatarErroZod(error));
  }
  return reply.status(400).send({ error: error instanceof Error ? error.message : padrao });
}

export async function avaliacoesRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    try {
      const f = filtroSchema.parse(request.query);
      if (f.turmaId && f.disciplinaId) {
        return reply.send(
          await avaliacaoService.findByTurmaDisciplina(f.turmaId, f.disciplinaId, f.bimestre)
        );
      }
      return reply.send(await avaliacaoService.findAll(f));
    } catch (error) {
      return tratarErro(error, reply, "Erro ao listar avaliações");
    }
  });

  app.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const avaliacao = await avaliacaoService.findById(request.params.id);
    if (!avaliacao) return reply.status(404).send({ error: "Avaliação não encontrada" });
    return reply.send(avaliacao);
  });

  app.post("/", async (request, reply) => {
    try {
      const data = createAvaliacaoSchema.parse(request.body);
      return reply.status(201).send(await avaliacaoService.create(data));
    } catch (error) {
      return tratarErro(error, reply, "Erro ao criar avaliação");
    }
  });

  app.put<{ Params: { id: string } }>("/:id", async (request, reply) => {
    try {
      const data = updateAvaliacaoSchema.parse(request.body);
      return reply.send(await avaliacaoService.update(request.params.id, data));
    } catch (error) {
      return tratarErro(error, reply, "Erro ao atualizar avaliação");
    }
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    try {
      await avaliacaoService.delete(request.params.id);
      return reply.status(204).send();
    } catch (error) {
      return tratarErro(error, reply, "Erro ao excluir avaliação");
    }
  });
}
