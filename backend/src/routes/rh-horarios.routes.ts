import { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.js";
import { atividadeComplementarService as acs } from "../services/atividade-complementar.service.js";
import { lotacaoService } from "../services/lotacao.service.js";
import {
  createAcSchema, listarAcsQuerySchema, quadroLotacaoQuerySchema, updateAcSchema,
} from "../schemas/rh.schemas.js";

const tag = { tags: ["RH — Horários e lotação"], security: [{ bearerAuth: [] }] };

/** Módulo 4 — ACs por área (/api/atividades-complementares). Escrita: equipe da escola (RBAC). */
export async function atividadesComplementaresRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  app.get("/", { schema: { ...tag, summary: "Listar ACs" } }, async (request) =>
    acs.listar(listarAcsQuerySchema.parse(request.query))
  );
  app.get("/:id", { schema: { ...tag, summary: "Detalhar AC" } }, async (request) =>
    acs.buscar((request.params as { id: string }).id)
  );
  app.post("/", { schema: { ...tag, summary: "Criar AC" } }, async (request, reply) =>
    reply.status(201).send(await acs.criar(createAcSchema.parse(request.body)))
  );
  app.put("/:id", { schema: { ...tag, summary: "Atualizar AC" } }, async (request) =>
    acs.atualizar((request.params as { id: string }).id, updateAcSchema.parse(request.body))
  );
  app.delete("/:id", { schema: { ...tag, summary: "Remover AC" } }, async (request) =>
    acs.remover((request.params as { id: string }).id)
  );
}

/** Módulo 4 — quadro de lotação (/api/lotacao). Leitura restrita à equipe (RBAC). */
export async function lotacaoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  app.get("/quadro", { schema: { ...tag, summary: "Quadro de lotação da escola" } }, async (request) =>
    lotacaoService.quadro(quadroLotacaoQuerySchema.parse(request.query).escolaId)
  );
}
