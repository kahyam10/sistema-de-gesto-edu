import { prisma } from "../lib/prisma.js";
import {
  CreateMatriculaInput,
  UpdateMatriculaInput,
} from "../schemas/index.js";

// Função para gerar número de matrícula único
function gerarNumeroMatricula(anoLetivo: number): string {
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `${anoLetivo}${random}`;
}

export class MatriculaService {
  async findAll(filters?: {
    escolaId?: string;
    etapaId?: string;
    turmaId?: string;
    anoLetivo?: number;
    status?: string;
  }) {
    return prisma.matricula.findMany({
      where: filters,
      include: {
        escola: true,
        etapa: true,
        turma: { include: { serie: true } },
      },
      orderBy: { nomeAluno: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.matricula.findUnique({
      where: { id },
      include: {
        escola: true,
        etapa: true,
        turma: { include: { serie: true } },
      },
    });
  }

  async findByNumero(numeroMatricula: string) {
    return prisma.matricula.findUnique({
      where: { numeroMatricula },
      include: {
        escola: true,
        etapa: true,
        turma: { include: { serie: true } },
      },
    });
  }

  async findSemTurma(escolaId?: string, anoLetivo?: number) {
    return prisma.matricula.findMany({
      where: {
        turmaId: null,
        status: "ATIVA",
        ...(escolaId && { escolaId }),
        ...(anoLetivo && { anoLetivo }),
      },
      include: {
        escola: true,
        etapa: true,
      },
      orderBy: { nomeAluno: "asc" },
    });
  }

  async create(data: CreateMatriculaInput) {
    // Verifica se CPF já existe (se fornecido)
    if (data.cpfAluno) {
      const existing = await prisma.matricula.findFirst({
        where: {
          cpfAluno: data.cpfAluno,
          anoLetivo: data.anoLetivo,
          status: "ATIVA",
        },
      });
      if (existing) {
        throw new Error(
          "Já existe uma matrícula ativa com este CPF para o ano letivo"
        );
      }
    }

    // Gera número de matrícula único
    let numeroMatricula = gerarNumeroMatricula(data.anoLetivo);
    let exists = await prisma.matricula.findUnique({
      where: { numeroMatricula },
    });
    while (exists) {
      numeroMatricula = gerarNumeroMatricula(data.anoLetivo);
      exists = await prisma.matricula.findUnique({
        where: { numeroMatricula },
      });
    }

    return prisma.matricula.create({
      data: {
        ...data,
        numeroMatricula,
        emailResponsavel: data.emailResponsavel || null,
      },
      include: {
        escola: true,
        etapa: true,
        turma: { include: { serie: true } },
      },
    });
  }

  async update(id: string, data: UpdateMatriculaInput) {
    return prisma.matricula.update({
      where: { id },
      data: {
        ...data,
        emailResponsavel: data.emailResponsavel || null,
      },
      include: {
        escola: true,
        etapa: true,
        turma: { include: { serie: true } },
      },
    });
  }

  async delete(id: string) {
    return prisma.matricula.delete({
      where: { id },
    });
  }

  async cancelar(id: string) {
    return prisma.matricula.update({
      where: { id },
      data: {
        status: "CANCELADA",
        turmaId: null,
      },
    });
  }

  async transferir(id: string, novaEscolaId: string, novaTurmaId?: string) {
    return prisma.matricula.update({
      where: { id },
      data: {
        escolaId: novaEscolaId,
        turmaId: novaTurmaId || null,
        status: "TRANSFERIDA",
      },
    });
  }

  async getEstatisticas(anoLetivo: number, escolaId?: string) {
    const where = {
      anoLetivo,
      ...(escolaId && { escolaId }),
    };

    const [total, ativas, pcd, semTurma] = await Promise.all([
      prisma.matricula.count({ where }),
      prisma.matricula.count({ where: { ...where, status: "ATIVA" } }),
      prisma.matricula.count({ where: { ...where, possuiDeficiencia: true } }),
      prisma.matricula.count({
        where: { ...where, turmaId: null, status: "ATIVA" },
      }),
    ]);

    return {
      total,
      ativas,
      pcd,
      semTurma,
      percentualPCD: total > 0 ? Math.round((pcd / total) * 100) : 0,
    };
  }
}

export const matriculaService = new MatriculaService();
