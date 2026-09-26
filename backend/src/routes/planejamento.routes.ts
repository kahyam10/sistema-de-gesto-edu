import { FastifyInstance, FastifyRequest } from "fastify";
import { authMiddleware } from "../middleware/auth.js";
import { planejamentoService as svc, type Usuario } from "../services/planejamento.service.js";
import {
  coberturaQuerySchema, createAtividadeSchema, createConteudoSchema, createPlanoSchema,
  listarAtividadesQuerySchema, listarConteudosQuerySchema, listarPlanosQuerySchema,
  revisarPlanoSchema, updateAtividadeSchema, updateConteudoSchema, updatePlanoSchema,
} from "../schemas/planejamento.schemas.js";

const tag = { tags: ["Pedagógico — Planejamento"], security: [{ bearerAuth: [] }] };
const idDe = (r: FastifyRequest) => (r.params as { id: string }).id;
const quem = (r: FastifyRequest): Usuario => ({ id: r.user.id, role: r.user.role });

/**
 * Módulo 2 — /api/planejamento.
 * RBAC: conteúdos e revisão = direção/coordenação/gestão; planos e banco de
 * atividades = também professor. O escopo limita cada um à própria escola ou
 * às próprias turmas; autoria e situação do plano são checadas no service.
 */
export async function planejamentoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // ---------- Conteúdo programático ----------
  app.get("/conteudos", { schema: { ...tag, summary: "Listar conteúdos programáticos" } }, async (r) =>
    svc.listarConteudos(listarConteudosQuerySchema.parse(r.query))
  );
  app.post("/conteudos", { schema: { ...tag, summary: "Criar conteúdo programático" } }, async (r, reply) =>
    reply.status(201).send(await svc.criarConteudo(createConteudoSchema.parse(r.body)))
  );
  app.put("/conteudos/:id", { schema: { ...tag, summary: "Atualizar conteúdo programático" } }, async (r) =>
    svc.atualizarConteudo(idDe(r), updateConteudoSchema.parse(r.body))
  );
  app.delete("/conteudos/:id", { schema: { ...tag, summary: "Excluir conteúdo programático" } }, async (r) =>
    svc.removerConteudo(idDe(r))
  );

  // ---------- Banco de atividades ----------
  app.get("/atividades", { schema: { ...tag, summary: "Listar atividades do banco" } }, async (r) =>
    svc.listarAtividades(listarAtividadesQuerySchema.parse(r.query), quem(r))
  );
  app.get("/atividades/:id", { schema: { ...tag, summary: "Detalhar atividade" } }, async (r) =>
    svc.buscarAtividade(idDe(r))
  );
  app.post("/atividades", { schema: { ...tag, summary: "Cadastrar atividade" } }, async (r, reply) =>
    reply.status(201).send(await svc.criarAtividade(createAtividadeSchema.parse(r.body), quem(r)))
  );
  app.put("/atividades/:id", { schema: { ...tag, summary: "Atualizar atividade" } }, async (r) =>
    svc.atualizarAtividade(idDe(r), updateAtividadeSchema.parse(r.body), quem(r))
  );
  app.delete("/atividades/:id", { schema: { ...tag, summary: "Excluir atividade" } }, async (r) =>
    svc.removerAtividade(idDe(r), quem(r))
  );

  // ---------- Planos de aula ----------
  app.get("/planos", { schema: { ...tag, summary: "Listar planos de aula" } }, async (r) =>
    svc.listarPlanos(listarPlanosQuerySchema.parse(r.query), quem(r))
  );
  app.get("/planos/:id", { schema: { ...tag, summary: "Detalhar plano de aula" } }, async (r) =>
    svc.buscarPlano(idDe(r), quem(r))
  );
  app.post("/planos", { schema: { ...tag, summary: "Criar plano de aula (rascunho)" } }, async (r, reply) =>
    reply.status(201).send(await svc.criarPlano(createPlanoSchema.parse(r.body), quem(r)))
  );
  app.put("/planos/:id", { schema: { ...tag, summary: "Atualizar plano (rascunho ou devolvido)" } }, async (r) =>
    svc.atualizarPlano(idDe(r), updatePlanoSchema.parse(r.body), quem(r))
  );
  app.delete("/planos/:id", { schema: { ...tag, summary: "Excluir plano de aula" } }, async (r) =>
    svc.removerPlano(idDe(r), quem(r))
  );
  app.post("/planos/:id/enviar", { schema: { ...tag, summary: "Enviar plano para a coordenação" } }, async (r) =>
    svc.enviarPlano(idDe(r), quem(r))
  );
  app.post("/planos/:id/revisar", { schema: { ...tag, summary: "Aprovar ou devolver plano" } }, async (r) =>
    svc.revisarPlano(idDe(r), revisarPlanoSchema.parse(r.body), quem(r))
  );

  // ---------- Cobertura ----------
  app.get("/cobertura", { schema: { ...tag, summary: "Cobertura do conteúdo programático na turma" } }, async (r) =>
    svc.cobertura(coberturaQuerySchema.parse(r.query), quem(r))
  );
}
