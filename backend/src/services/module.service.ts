import { prisma } from "../lib/prisma.js";

export const moduleService = {
  async findAll() {
    return prisma.module.findMany({
      include: {
        subModules: {
          orderBy: { ordem: "asc" },
        },
      },
      orderBy: [{ phase: "asc" }, { ordem: "asc" }],
    });
  },

  async findById(id: string) {
    return prisma.module.findUnique({
      where: { id },
      include: {
        subModules: {
          orderBy: { ordem: "asc" },
        },
      },
    });
  },

  async create(data: {
    name: string;
    description: string;
    icon?: string;
    phase?: number;
    status?: string;
    progress?: number;
    ordem?: number;
  }) {
    return prisma.module.create({
      data,
      include: {
        subModules: true,
      },
    });
  },

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      icon: string;
      phase: number;
      status: string;
      progress: number;
      ordem: number;
    }>
  ) {
    return prisma.module.update({
      where: { id },
      data,
      include: {
        subModules: true,
      },
    });
  },

  async delete(id: string) {
    return prisma.module.delete({
      where: { id },
    });
  },

  async updateProgress(id: string) {
    const module = await prisma.module.findUnique({
      where: { id },
      include: { subModules: true },
    });

    if (!module || module.subModules.length === 0) return module;

    const completedCount = module.subModules.filter(
      (sm) => sm.status === "completed"
    ).length;
    const progress = Math.round(
      (completedCount / module.subModules.length) * 100
    );

    let status = module.status;
    if (progress === 100) {
      status = "completed";
    } else if (progress > 0) {
      status = "in-progress";
    }

    return prisma.module.update({
      where: { id },
      data: { progress, status },
      include: { subModules: true },
    });
  },

  // SubModule operations
  async createSubModule(data: {
    name: string;
    description: string;
    status?: string;
    ordem?: number;
    moduleId: string;
  }) {
    const subModule = await prisma.subModule.create({
      data,
    });

    // Atualiza o progresso do módulo pai
    await this.updateProgress(data.moduleId);

    return subModule;
  },

  async updateSubModule(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      status: string;
      ordem: number;
    }>
  ) {
    const subModule = await prisma.subModule.update({
      where: { id },
      data,
    });

    // Atualiza o progresso do módulo pai
    await this.updateProgress(subModule.moduleId);

    return subModule;
  },

  async deleteSubModule(id: string) {
    const subModule = await prisma.subModule.findUnique({
      where: { id },
    });

    if (!subModule) return null;

    await prisma.subModule.delete({
      where: { id },
    });

    // Atualiza o progresso do módulo pai
    await this.updateProgress(subModule.moduleId);

    return subModule;
  },

  async toggleSubModuleStatus(id: string) {
    const subModule = await prisma.subModule.findUnique({
      where: { id },
    });

    if (!subModule) return null;

    const newStatus =
      subModule.status === "completed" ? "planning" : "completed";

    const updated = await prisma.subModule.update({
      where: { id },
      data: { status: newStatus },
    });

    // Atualiza o progresso do módulo pai
    await this.updateProgress(subModule.moduleId);

    return updated;
  },
};
