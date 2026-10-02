import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { BusinessError } from "../errors/index.js";
import { authMiddleware } from "../middleware/auth.js";
import { portalService } from "../services/portal.service.js";
import { periodoPortalSchema, resumoPortalQuerySchema } from "../schemas/index.js";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
import { responderErroRota } from "../lib/erro-rota.js";

// Data da chamada: AAAA-MM-DD (padrão: hoje, no fuso da Bahia)
const chamadaQuerySchema = z.object({
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Data inválida")
    .optional()
    .transform((v) =>
      new Date(
        v ??
          new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Bahia" }).format(new Date())
      )
    ),
});

const agendaQuerySchema = z.object({
  dias: z.coerce.number().int().min(1).max(120).default(60),
});
const cardapioQuerySchema = z.object({
  de: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Data inválida")
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
});

type TokenUser = { id: string; role: string };

/**
 * Módulo 3 — Portais por papel. Identidade SEMPRE derivada de request.user
 * (JWT); nunca de params/query. O escopo do responsável é garantido no
 * service (validarVinculo → PERM_005).
 */
export async function portalRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // GET /api/portal/professor/resumo — turmas, aulas de hoje e pendências do profissional logado
  app.get(
    "/professor/resumo",
    {
      schema: {
        tags: ["Portal"],
        summary: "Resumo do portal do professor",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as TokenUser;
        return reply.status(200).send(await portalService.resumoProfessor(user.id));
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // ---------- App do professor (propriedade da turma validada no service) ----------


  // GET /api/portal/professor/turmas/:turmaId/chamada?data=AAAA-MM-DD
  app.get(
    "/professor/turmas/:turmaId/chamada",
    async (
      request: FastifyRequest<{ Params: { turmaId: string }; Querystring: { data?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const q = chamadaQuerySchema.parse(request.query);
        const user = request.user as TokenUser;
        return reply.send(
          await portalService.chamadaDaTurma(user.id, request.params.turmaId, q.data)
        );
      } catch (error) {
        return responderErroRota(error, reply);
      }
    }
  );

  // GET /api/portal/professor/turmas/:turmaId/notas — disciplinas, avaliações e alunos
  app.get(
    "/professor/turmas/:turmaId/notas",
    async (request: FastifyRequest<{ Params: { turmaId: string } }>, reply: FastifyReply) => {
      try {
        const user = request.user as TokenUser;
        return reply.send(await portalService.notasDaTurma(user.id, request.params.turmaId));
      } catch (error) {
        return responderErroRota(error, reply);
      }
    }
  );

  // GET /api/portal/professor/turmas/:turmaId/alunos — alunos ativos com % de presença
  app.get(
    "/professor/turmas/:turmaId/alunos",
    async (request: FastifyRequest<{ Params: { turmaId: string } }>, reply: FastifyReply) => {
      try {
        const user = request.user as TokenUser;
        return reply.send(await portalService.alunosDaTurma(user.id, request.params.turmaId));
      } catch (error) {
        return responderErroRota(error, reply);
      }
    }
  );

  // ---------- Apps: agenda, cardápio, contatos e "meus dados" (sempre do usuário da sessão) ----------

  // GET /api/portal/meu/agenda?dias=60 — calendário, reuniões de pais e plantões
  app.get("/meu/agenda", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { dias } = agendaQuerySchema.parse(request.query);
      const user = request.user as TokenUser;
      return reply.send(await portalService.agenda(user.id, dias));
    } catch (error) {
      return responderErroRota(error, reply);
    }
  });

  // GET /api/portal/meu/cardapio?de=AAAA-MM-DD — cardápio da semana
  app.get("/meu/cardapio", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { de } = cardapioQuerySchema.parse(request.query);
      const user = request.user as TokenUser;
      return reply.send(await portalService.cardapio(user.id, de));
    } catch (error) {
      return responderErroRota(error, reply);
    }
  });

  // GET /api/portal/meu/escolas — contato institucional das escolas do usuário
  app.get("/meu/escolas", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as TokenUser;
      return reply.send(await portalService.escolasDoUsuario(user.id));
    } catch (error) {
      return responderErroRota(error, reply);
    }
  });

  // GET /api/portal/meu/dados — o que o sistema guarda sobre o usuário (LGPD)
  app.get("/meu/dados", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as TokenUser;
      return reply.send(await portalService.meusDados(user.id));
    } catch (error) {
      return responderErroRota(error, reply);
    }
  });

  // GET /api/portal/meu/comunicados — comunicados relevantes com status de leitura
  app.get("/meu/comunicados", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as TokenUser;
      return reply.send(await portalService.comunicadosDoUsuario(user.id));
    } catch (error) {
      return responderErroRota(error, reply);
    }
  });

  // GET /api/portal/meu/alunos — matrículas vinculadas ao usuário logado
  app.get(
    "/meu/alunos",
    {
      schema: {
        tags: ["Portal"],
        summary: "Matrículas (alunos) vinculadas ao usuário logado",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as TokenUser;
        return reply.status(200).send(await portalService.alunosDoUsuario(user.id));
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // GET /api/portal/meu/alunos/:matriculaId/boletim — boletim do aluno vinculado (PERM_005)
  app.get(
    "/meu/alunos/:matriculaId/boletim",
    {
      schema: {
        tags: ["Portal"],
        summary: "Boletim de um aluno vinculado ao usuário logado",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Params: { matriculaId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const user = request.user as TokenUser;
        return reply
          .status(200)
          .send(await portalService.boletimAluno(user.id, request.params.matriculaId));
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // GET /api/portal/meu/alunos/:matriculaId/frequencia?dataInicio&dataFim — frequência do aluno vinculado
  app.get(
    "/meu/alunos/:matriculaId/frequencia",
    {
      schema: {
        tags: ["Portal"],
        summary: "Frequência de um aluno vinculado ao usuário logado",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{
        Params: { matriculaId: string };
        Querystring: { dataInicio?: string; dataFim?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = request.user as TokenUser;
        const { dataInicio, dataFim } = periodoPortalSchema.parse(request.query);
        return reply
          .status(200)
          .send(
            await portalService.frequenciaAluno(
              user.id,
              request.params.matriculaId,
              dataInicio,
              dataFim
            )
          );
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // GET /api/portal/diretor/resumo?anoLetivo — sempre a escola do usuário (GESTAO pode passar ?escolaId)
  app.get(
    "/diretor/resumo",
    {
      schema: {
        tags: ["Portal"],
        summary: "Resumo do portal do diretor (indicadores da escola)",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Querystring: { anoLetivo?: string; escolaId?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const user = request.user as TokenUser;
        const query = resumoPortalQuerySchema.parse(request.query);
        const anoLetivo = query.anoLetivo ?? new Date().getFullYear();
        // GESTAO pode inspecionar qualquer escola; demais papéis usam a própria (lookup no banco, padrão F3)
        const escolaId =
          ["ADMIN", "SEMEC"].includes(user.role) && query.escolaId
            ? query.escolaId
            : (
                await prisma.user.findUnique({
                  where: { id: user.id },
                  select: { escolaId: true },
                })
              )?.escolaId;
        if (!escolaId) throw new BusinessError("BIZ_023");
        return reply.status(200).send(await portalService.resumoEscola(escolaId, anoLetivo));
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // GET /api/portal/coordenacao/resumo?anoLetivo&escolaId — mesmo resumoEscola do diretor
  // (a tela é que muda no frontend)
  app.get(
    "/coordenacao/resumo",
    {
      schema: {
        tags: ["Portal"],
        summary: "Resumo do portal da coordenação (indicadores da escola)",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Querystring: { anoLetivo?: string; escolaId?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const user = request.user as TokenUser;
        const query = resumoPortalQuerySchema.parse(request.query);
        const anoLetivo = query.anoLetivo ?? new Date().getFullYear();
        const escolaId =
          ["ADMIN", "SEMEC"].includes(user.role) && query.escolaId
            ? query.escolaId
            : (
                await prisma.user.findUnique({
                  where: { id: user.id },
                  select: { escolaId: true },
                })
              )?.escolaId;
        if (!escolaId) throw new BusinessError("BIZ_023");
        return reply.status(200).send(await portalService.resumoEscola(escolaId, anoLetivo));
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // GET /api/portal/semec/resumo?anoLetivo — consolidado municipal
  app.get(
    "/semec/resumo",
    {
      schema: {
        tags: ["Portal"],
        summary: "Resumo municipal do portal da SEMEC",
        security: [{ bearerAuth: [] }],
      },
    },
    async (
      request: FastifyRequest<{ Querystring: { anoLetivo?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { anoLetivo } = resumoPortalQuerySchema.parse(request.query);
        return reply
          .status(200)
          .send(await portalService.resumoSemec(anoLetivo ?? new Date().getFullYear()));
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );
}
