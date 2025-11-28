import { prisma } from '../lib/prisma';

export interface CreatePhaseData {
  name: string;
  description: string;
  monthRange: string;
  duration: string;
  ordem?: number;
  status?: string;
  moduleIds?: string[];
}

export interface UpdatePhaseData {
  name?: string;
  description?: string;
  monthRange?: string;
  duration?: string;
  ordem?: number;
  status?: string;
  moduleIds?: string[];
}

export const phaseService = {
  async findAll() {
    const phases = await prisma.phase.findMany({
      orderBy: { ordem: 'asc' },
    });
    
    // Parse moduleIds de JSON string para array
    return phases.map(phase => ({
      ...phase,
      moduleIds: JSON.parse(phase.moduleIds || '[]'),
    }));
  },

  async findById(id: string) {
    const phase = await prisma.phase.findUnique({
      where: { id },
    });
    
    if (!phase) return null;
    
    return {
      ...phase,
      moduleIds: JSON.parse(phase.moduleIds || '[]'),
    };
  },

  async create(data: CreatePhaseData) {
    const { moduleIds, ...rest } = data;
    
    const phase = await prisma.phase.create({
      data: {
        ...rest,
        moduleIds: JSON.stringify(moduleIds || []),
      },
    });
    
    return {
      ...phase,
      moduleIds: JSON.parse(phase.moduleIds || '[]'),
    };
  },

  async update(id: string, data: UpdatePhaseData) {
    const { moduleIds, ...rest } = data;
    
    const updateData: Record<string, unknown> = { ...rest };
    if (moduleIds !== undefined) {
      updateData.moduleIds = JSON.stringify(moduleIds);
    }
    
    const phase = await prisma.phase.update({
      where: { id },
      data: updateData,
    });
    
    return {
      ...phase,
      moduleIds: JSON.parse(phase.moduleIds || '[]'),
    };
  },

  async delete(id: string) {
    await prisma.phase.delete({
      where: { id },
    });
  },
};
