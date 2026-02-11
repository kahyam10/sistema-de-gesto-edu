import { prisma } from "../lib/prisma.js";
import {
  CreateGradeHorarioInput,
  UpdateGradeHorarioInput,
} from "../schemas/index.js";

export class GradeHorariaService {
  async findAll(filters?: { turmaId?: string; profissionalId?: string }) {
    return prisma.gradeHoraria.findMany({
      where: filters,
      include: {
        turma: { include: { escola: true } },
        profissional: true,
      },
      orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
    });
  }

  async findById(id: string) {
    return prisma.gradeHoraria.findUnique({
      where: { id },
      include: {
        turma: { include: { escola: true } },
        profissional: true,
      },
    });
  }

  async create(data: CreateGradeHorarioInput) {
    return prisma.gradeHoraria.create({
      data: {
        ...data,
        profissionalId: data.profissionalId || null,
      },
      include: {
        turma: { include: { escola: true } },
        profissional: true,
      },
    });
  }

  async update(id: string, data: UpdateGradeHorarioInput) {
    return prisma.gradeHoraria.update({
      where: { id },
      data: {
        ...data,
        profissionalId: data.profissionalId || null,
      },
      include: {
        turma: { include: { escola: true } },
        profissional: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.gradeHoraria.delete({
      where: { id },
    });
  }

  async getCargaResumo(profissionalId?: string) {
    const horarios = await prisma.gradeHoraria.findMany({
      where: profissionalId
        ? { profissionalId }
        : { profissionalId: { not: null } },
      include: { profissional: true },
    });

    const resumo = new Map<
      string,
      {
        profissionalId: string;
        profissionalNome: string;
        totalAulas: number;
        totalMinutos: number;
      }
    >();

    horarios.forEach((item) => {
      if (!item.profissionalId || !item.profissional) return;
      const [h1, m1] = item.horaInicio.split(":").map(Number);
      const [h2, m2] = item.horaFim.split(":").map(Number);
      const minutos = Math.max(h2 * 60 + m2 - (h1 * 60 + m1), 0);

      const current = resumo.get(item.profissionalId) || {
        profissionalId: item.profissionalId,
        profissionalNome: item.profissional.nome,
        totalAulas: 0,
        totalMinutos: 0,
      };

      resumo.set(item.profissionalId, {
        ...current,
        totalAulas: current.totalAulas + 1,
        totalMinutos: current.totalMinutos + minutos,
      });
    });

    return Array.from(resumo.values()).sort((a, b) =>
      a.profissionalNome.localeCompare(b.profissionalNome)
    );
  }

  async getCargaResumoPorEscola() {
    const horarios = await prisma.gradeHoraria.findMany({
      include: {
        turma: { include: { escola: true } },
      },
    });

    const resumo = new Map<
      string,
      {
        escolaId: string;
        escolaNome: string;
        totalAulas: number;
        totalMinutos: number;
      }
    >();

    horarios.forEach((item) => {
      if (!item.turma?.escola) return;
      const [h1, m1] = item.horaInicio.split(":").map(Number);
      const [h2, m2] = item.horaFim.split(":").map(Number);
      const minutos = Math.max(h2 * 60 + m2 - (h1 * 60 + m1), 0);

      const current = resumo.get(item.turma.escola.id) || {
        escolaId: item.turma.escola.id,
        escolaNome: item.turma.escola.nome,
        totalAulas: 0,
        totalMinutos: 0,
      };

      resumo.set(item.turma.escola.id, {
        ...current,
        totalAulas: current.totalAulas + 1,
        totalMinutos: current.totalMinutos + minutos,
      });
    });

    return Array.from(resumo.values()).sort((a, b) =>
      a.escolaNome.localeCompare(b.escolaNome)
    );
  }

  async getCargaResumoPorTurma() {
    const horarios = await prisma.gradeHoraria.findMany({
      include: {
        turma: { include: { escola: true, serie: true } },
      },
    });

    const resumo = new Map<
      string,
      {
        turmaId: string;
        turmaNome: string;
        escolaNome: string;
        totalAulas: number;
        totalMinutos: number;
      }
    >();

    horarios.forEach((item) => {
      if (!item.turma) return;
      const [h1, m1] = item.horaInicio.split(":").map(Number);
      const [h2, m2] = item.horaFim.split(":").map(Number);
      const minutos = Math.max(h2 * 60 + m2 - (h1 * 60 + m1), 0);

      const current = resumo.get(item.turma.id) || {
        turmaId: item.turma.id,
        turmaNome: item.turma.nome,
        escolaNome: item.turma.escola?.nome || "N/A",
        totalAulas: 0,
        totalMinutos: 0,
      };

      resumo.set(item.turma.id, {
        ...current,
        totalAulas: current.totalAulas + 1,
        totalMinutos: current.totalMinutos + minutos,
      });
    });

    return Array.from(resumo.values()).sort((a, b) =>
      a.turmaNome.localeCompare(b.turmaNome)
    );
  }
}

export const gradeHorariaService = new GradeHorariaService();
