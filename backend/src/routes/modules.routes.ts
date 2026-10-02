import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { moduleService } from "../services/module.service.js";
import { z } from "zod";
import { responderErroRota } from "../lib/erro-rota.js";

const createModuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().optional(),
  phase: z.number().int().positive().optional(),
  status: z
    .enum(["planning", "in-progress", "completed", "blocked"])
    .optional(),
  progress: z.number().int().min(0).max(100).optional(),
  ordem: z.number().int().optional(),
});

const updateModuleSchema = createModuleSchema.partial();

const createSubModuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  status: z
    .enum(["planning", "in-progress", "completed", "blocked"])
    .optional(),
  ordem: z.number().int().optional(),
  observacao: z.string().optional(),
  moduleId: z.string().min(1),
});

const updateSubModuleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z
    .enum(["planning", "in-progress", "completed", "blocked"])
    .optional(),
  ordem: z.number().int().optional(),
  observacao: z.string().optional(),
});

export async function modulesRoutes(app: FastifyInstance) {
  // ==================== MODULES ====================

  // Listar todos os módulos
  app.get("/", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const modules = await moduleService.findAll();
      return reply.send(modules);
    } catch (error: unknown) {
      return responderErroRota(error, reply, 500);
    }
  });

  // Buscar módulo por ID
  app.get(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const module = await moduleService.findById(id);

        if (!module) {
          return reply.status(404).send({ error: "Módulo não encontrado" });
        }

        return reply.send(module);
      } catch (error: unknown) {
        return responderErroRota(error, reply, 500);
      }
    }
  );

  // Criar módulo
  app.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createModuleSchema.parse(request.body);
      const module = await moduleService.create(data);
      return reply.status(201).send(module);
    } catch (error: unknown) {
      return responderErroRota(error, reply);
    }
  });

  // Atualizar módulo
  app.put(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = updateModuleSchema.parse(request.body);
        const module = await moduleService.update(id, data);
        return reply.send(module);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Deletar módulo
  app.delete(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await moduleService.delete(id);
        return reply.status(204).send();
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // ==================== SUB-MODULES ====================

  // Criar sub-módulo
  app.post(
    "/:moduleId/submodules",
    async (
      request: FastifyRequest<{ Params: { moduleId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { moduleId } = request.params;
        const bodyData = createSubModuleSchema
          .omit({ moduleId: true })
          .parse(request.body);
        const subModule = await moduleService.createSubModule({
          ...bodyData,
          moduleId,
        });
        return reply.status(201).send(subModule);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Atualizar sub-módulo
  app.put(
    "/submodules/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const data = updateSubModuleSchema.parse(request.body);
        const subModule = await moduleService.updateSubModule(id, data);
        return reply.send(subModule);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Deletar sub-módulo
  app.delete(
    "/submodules/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        await moduleService.deleteSubModule(id);
        return reply.status(204).send();
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // Toggle status do sub-módulo
  app.patch(
    "/submodules/:id/toggle",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const subModule = await moduleService.toggleSubModuleStatus(id);

        if (!subModule) {
          return reply.status(404).send({ error: "Sub-módulo não encontrado" });
        }

        return reply.send(subModule);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );
}
