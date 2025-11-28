import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { moduleService } from "../services/module.service.js";
import { z } from "zod";

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
  moduleId: z.string().min(1),
});

const updateSubModuleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z
    .enum(["planning", "in-progress", "completed", "blocked"])
    .optional(),
  ordem: z.number().int().optional(),
});

export async function modulesRoutes(app: FastifyInstance) {
  // ==================== MODULES ====================

  // Listar todos os módulos
  app.get("/", async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const modules = await moduleService.findAll();
      return reply.send(modules);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao listar módulos";
      return reply.status(500).send({ error: message });
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
        const message =
          error instanceof Error ? error.message : "Erro ao buscar módulo";
        return reply.status(500).send({ error: message });
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
      const message =
        error instanceof Error ? error.message : "Erro ao criar módulo";
      return reply.status(400).send({ error: message });
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
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar módulo";
        return reply.status(400).send({ error: message });
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
        const message =
          error instanceof Error ? error.message : "Erro ao deletar módulo";
        return reply.status(400).send({ error: message });
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
        const message =
          error instanceof Error ? error.message : "Erro ao criar sub-módulo";
        return reply.status(400).send({ error: message });
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
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar sub-módulo";
        return reply.status(400).send({ error: message });
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
        const message =
          error instanceof Error ? error.message : "Erro ao deletar sub-módulo";
        return reply.status(400).send({ error: message });
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
        const message =
          error instanceof Error ? error.message : "Erro ao alternar status";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
