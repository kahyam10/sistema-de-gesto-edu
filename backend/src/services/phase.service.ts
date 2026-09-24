import { prisma } from "../lib/prisma.js";
import type {
  CreatePhaseInput as CreatePhaseData,
  UpdatePhaseInput as UpdatePhaseData,
} from "../schemas/index.js";

// moduleIds é Json nativo (jsonb) — normaliza para string[] na saída
function comModuleIds<T extends { moduleIds: unknown }>(phase: T) {
  return {
    ...phase,
    moduleIds: (phase.moduleIds as string[] | null) ?? [],
  };
}

export const phaseService = {
  async findAll() {
    const phases = await prisma.phase.findMany({
      orderBy: { ordem: "asc" },
    });

    return phases.map(comModuleIds);
  },

  async findById(id: string) {
    const phase = await prisma.phase.findUnique({
      where: { id },
    });

    if (!phase) return null;

    return comModuleIds(phase);
  },

  async create(data: CreatePhaseData) {
    const { moduleIds, ...rest } = data;

    const phase = await prisma.phase.create({
      data: {
        ...rest,
        moduleIds: moduleIds ?? [],
      },
    });

    return comModuleIds(phase);
  },

  async update(id: string, data: UpdatePhaseData) {
    const { moduleIds, ...rest } = data;

    const updateData: Record<string, unknown> = { ...rest };
    if (moduleIds !== undefined) {
      updateData.moduleIds = moduleIds;
    }

    const phase = await prisma.phase.update({
      where: { id },
      data: updateData,
    });

    return comModuleIds(phase);
  },

  async delete(id: string) {
    await prisma.phase.delete({
      where: { id },
    });
  },
};
