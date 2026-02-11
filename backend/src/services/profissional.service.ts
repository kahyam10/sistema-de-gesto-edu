import { prisma } from "../lib/prisma.js";
import {
  CreateProfissionalInput,
  UpdateProfissionalInput,
} from "../schemas/index.js";

export class ProfissionalService {
  async findAll(filters?: { tipo?: string; ativo?: boolean }) {
    return prisma.profissionalEducacao.findMany({
      where: filters,
      include: {
        escolas: {
          include: { escola: true },
        },
        turmas: {
          include: { turma: { include: { escola: true, serie: true } } },
        },
        formacoes: {
          orderBy: { anoConclusao: "desc" },
        },
      },
      orderBy: { nome: "asc" },
    });
  }

  async findAllPaginated(
    filters: { tipo?: string; ativo?: boolean },
    pagination: { page: number; limit: number }
  ) {
    const skip = (pagination.page - 1) * pagination.limit;
    const include = {
      escolas: { include: { escola: true } },
      turmas: {
        include: { turma: { include: { escola: true, serie: true } } },
      },
      formacoes: { orderBy: { anoConclusao: "desc" as const } },
    };

    const [data, total] = await Promise.all([
      prisma.profissionalEducacao.findMany({
        where: filters,
        include,
        orderBy: { nome: "asc" },
        skip,
        take: pagination.limit,
      }),
      prisma.profissionalEducacao.count({ where: filters }),
    ]);

    return {
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async findById(id: string) {
    return prisma.profissionalEducacao.findUnique({
      where: { id },
      include: {
        escolas: {
          include: { escola: true },
        },
        turmas: {
          include: { turma: { include: { escola: true, serie: true } } },
        },
        formacoes: {
          orderBy: { anoConclusao: "desc" },
        },
      },
    });
  }

  async findByCpf(cpf: string) {
    return prisma.profissionalEducacao.findUnique({
      where: { cpf },
    });
  }

  async findByEscola(escolaId: string) {
    return prisma.profissionalEducacao.findMany({
      where: {
        escolas: {
          some: { escolaId },
        },
      },
      include: {
        escolas: { include: { escola: true } },
      },
      orderBy: { nome: "asc" },
    });
  }

  async create(data: CreateProfissionalInput) {
    // Verifica se CPF já existe
    const existing = await this.findByCpf(data.cpf);
    if (existing) {
      throw new Error("Já existe um profissional cadastrado com este CPF");
    }

    // Verifica matrícula única (se fornecida)
    if (data.matricula) {
      const existingMatricula = await prisma.profissionalEducacao.findUnique({
        where: { matricula: data.matricula },
      });
      if (existingMatricula) {
        throw new Error(
          "Já existe um profissional cadastrado com esta matrícula"
        );
      }
    }

    const { escolasIds, ...profissionalData } = data;

    return prisma.profissionalEducacao.create({
      data: {
        ...profissionalData,
        email: profissionalData.email || null,
        escolas: escolasIds
          ? {
              create: escolasIds.map((escolaId: string) => ({ escolaId })),
            }
          : undefined,
      },
      include: {
        escolas: { include: { escola: true } },
      },
    });
  }

  async update(id: string, data: UpdateProfissionalInput) {
    const { escolasIds, ...profissionalData } = data;

    // Se escolasIds foi fornecido, atualiza as escolas
    if (escolasIds !== undefined) {
      // Remove escolas antigas
      await prisma.escolaProfissional.deleteMany({
        where: { profissionalId: id },
      });

      // Adiciona novas escolas
      if (escolasIds.length > 0) {
        await prisma.escolaProfissional.createMany({
          data: escolasIds.map((escolaId: string) => ({
            profissionalId: id,
            escolaId,
          })),
        });
      }
    }

    return prisma.profissionalEducacao.update({
      where: { id },
      data: {
        ...profissionalData,
        email: profissionalData.email || null,
      },
      include: {
        escolas: { include: { escola: true } },
      },
    });
  }

  async delete(id: string) {
    return prisma.profissionalEducacao.delete({
      where: { id },
    });
  }

  async vincularEscola(
    profissionalId: string,
    escolaId: string,
    funcao?: string,
    cargaHoraria?: number
  ) {
    return prisma.escolaProfissional.create({
      data: {
        profissionalId,
        escolaId,
        funcao,
        cargaHoraria,
      },
    });
  }

  async desvincularEscola(profissionalId: string, escolaId: string) {
    return prisma.escolaProfissional.delete({
      where: {
        escolaId_profissionalId: {
          escolaId,
          profissionalId,
        },
      },
    });
  }

  async getLotacaoResumo(escolaId?: string) {
    const escolas = await prisma.escola.findMany({
      where: escolaId ? { id: escolaId } : undefined,
      include: {
        profissionais: {
          include: { profissional: true },
        },
      },
      orderBy: { nome: "asc" },
    });

    return escolas.map((escola) => {
      const total = escola.profissionais.length;
      const porTipo = escola.profissionais.reduce(
        (acc: Record<string, number>, vinculo) => {
          const tipo = vinculo.profissional.tipo;
          acc[tipo] = (acc[tipo] || 0) + 1;
          return acc;
        },
        {}
      );

      return {
        escolaId: escola.id,
        escolaNome: escola.nome,
        total,
        porTipo,
      };
    });
  }

  // ==================== FORMAÇÕES ====================

  async getFormacoes(profissionalId: string) {
    return prisma.formacaoProfissional.findMany({
      where: { profissionalId },
      orderBy: { anoConclusao: "desc" },
    });
  }

  async addFormacao(
    profissionalId: string,
    data: {
      tipo: string;
      nome: string;
      instituicao?: string;
      anoConclusao?: number;
      cargaHoraria?: number;
      emAndamento?: boolean;
    }
  ) {
    return prisma.formacaoProfissional.create({
      data: {
        profissionalId,
        ...data,
      },
    });
  }

  async updateFormacao(
    formacaoId: string,
    data: {
      tipo?: string;
      nome?: string;
      instituicao?: string;
      anoConclusao?: number;
      cargaHoraria?: number;
      emAndamento?: boolean;
    }
  ) {
    return prisma.formacaoProfissional.update({
      where: { id: formacaoId },
      data,
    });
  }

  async deleteFormacao(formacaoId: string) {
    return prisma.formacaoProfissional.delete({
      where: { id: formacaoId },
    });
  }

  // ==================== CERTIFICAÇÕES ====================

  async getCertificacoes(profissionalId: string) {
    return prisma.certificacaoProfissional.findMany({
      where: { profissionalId },
      orderBy: { dataEmissao: "desc" },
    });
  }

  async addCertificacao(
    profissionalId: string,
    data: {
      nome: string;
      instituicao?: string;
      dataEmissao?: Date;
      dataValidade?: Date;
      cargaHoraria?: number;
      urlCertificado?: string;
      observacoes?: string;
    }
  ) {
    return prisma.certificacaoProfissional.create({
      data: {
        profissionalId,
        ...data,
      },
    });
  }

  async updateCertificacao(
    certificacaoId: string,
    data: {
      nome?: string;
      instituicao?: string;
      dataEmissao?: Date;
      dataValidade?: Date;
      cargaHoraria?: number;
      urlCertificado?: string;
      observacoes?: string;
    }
  ) {
    return prisma.certificacaoProfissional.update({
      where: { id: certificacaoId },
      data,
    });
  }

  async deleteCertificacao(certificacaoId: string) {
    return prisma.certificacaoProfissional.delete({
      where: { id: certificacaoId },
    });
  }

  // ==================== HISTÓRICO DE CONTRATAÇÕES ====================

  async getHistoricoContratacoes(profissionalId: string) {
    return prisma.historicoContratacao.findMany({
      where: { profissionalId },
      orderBy: { dataEvento: "desc" },
    });
  }

  async addHistoricoContratacao(
    profissionalId: string,
    data: {
      tipo: string; // ADMISSAO, TRANSFERENCIA, PROMOCAO, REMANEJAMENTO, RESCISAO
      descricao: string;
      dataEvento: Date;
      cargo?: string;
      observacoes?: string;
    }
  ) {
    return prisma.historicoContratacao.create({
      data: {
        profissionalId,
        ...data,
      },
    });
  }

  async updateHistoricoContratacao(
    historicoId: string,
    data: {
      tipo?: string;
      descricao?: string;
      dataEvento?: Date;
      cargo?: string;
      observacoes?: string;
    }
  ) {
    return prisma.historicoContratacao.update({
      where: { id: historicoId },
      data,
    });
  }

  async deleteHistoricoContratacao(historicoId: string) {
    return prisma.historicoContratacao.delete({
      where: { id: historicoId },
    });
  }

  // ==================== AFASTAMENTOS ====================

  async getAfastamentos(profissionalId: string, apenasAtivos?: boolean) {
    return prisma.afastamento.findMany({
      where: {
        profissionalId,
        ...(apenasAtivos !== undefined ? { ativo: apenasAtivos } : {}),
      },
      orderBy: { dataInicio: "desc" },
    });
  }

  async addAfastamento(
    profissionalId: string,
    data: {
      tipo: string; // ATESTADO_MEDICO, LICENCA_SAUDE, LICENCA_MATERNIDADE, FERIAS, OUTROS
      dataInicio: Date;
      dataFim?: Date;
      motivo?: string;
      observacoes?: string;
      documentoPath?: string;
      ativo?: boolean;
    }
  ) {
    return prisma.afastamento.create({
      data: {
        profissionalId,
        ...data,
      },
    });
  }

  async updateAfastamento(
    afastamentoId: string,
    data: {
      tipo?: string;
      dataInicio?: Date;
      dataFim?: Date;
      motivo?: string;
      observacoes?: string;
      documentoPath?: string;
      ativo?: boolean;
    }
  ) {
    return prisma.afastamento.update({
      where: { id: afastamentoId },
      data,
    });
  }

  async deleteAfastamento(afastamentoId: string) {
    return prisma.afastamento.delete({
      where: { id: afastamentoId },
    });
  }

  async getAfastamentosAtivos(dataReferencia: Date = new Date()) {
    return prisma.afastamento.findMany({
      where: {
        ativo: true,
        dataInicio: { lte: dataReferencia },
        OR: [
          { dataFim: null },
          { dataFim: { gte: dataReferencia } },
        ],
      },
      include: {
        profissional: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            tipo: true,
          },
        },
      },
      orderBy: { dataInicio: "desc" },
    });
  }

  // ==================== RELATÓRIOS ====================

  async getCargaHorariaSemanal(escolaId?: string) {
    const profissionais = await prisma.profissionalEducacao.findMany({
      where: escolaId
        ? {
            escolas: {
              some: { escolaId, ativo: true },
            },
          }
        : { ativo: true },
      include: {
        escolas: {
          where: escolaId ? { escolaId } : undefined,
          include: { escola: true },
        },
        horarios: {
          include: {
            turma: {
              select: { nome: true, serie: { select: { nome: true } } },
            },
          },
        },
      },
      orderBy: { nome: "asc" },
    });

    return profissionais.map((prof) => {
      // Calcula carga horária baseada na grade horária
      const cargaHorariaGrade = prof.horarios.reduce((total, horario) => {
        const [horaIni, minIni] = horario.horaInicio.split(":").map(Number);
        const [horaFim, minFim] = horario.horaFim.split(":").map(Number);
        const minutos = (horaFim * 60 + minFim) - (horaIni * 60 + minIni);
        return total + (minutos / 60);
      }, 0);

      // Usa carga horária informada na lotação ou calcula pela grade
      const cargaHorariaLotacao = prof.escolas.reduce(
        (total, vinculo) => total + (vinculo.cargaHoraria || 0),
        0
      );

      return {
        profissionalId: prof.id,
        nome: prof.nome,
        tipo: prof.tipo,
        cargaHorariaLotacao,
        cargaHorariaGrade,
        totalAulas: prof.horarios.length,
        escolas: prof.escolas.map((e) => ({
          escolaNome: e.escola.nome,
          funcao: e.funcao,
          cargaHoraria: e.cargaHoraria,
        })),
      };
    });
  }

  async getDashboardAlocacao(escolaId?: string) {
    const totalProfissionais = await prisma.profissionalEducacao.count({
      where: { ativo: true },
    });

    const profissionaisPorTipo = await prisma.profissionalEducacao.groupBy({
      by: ["tipo"],
      where: { ativo: true },
      _count: true,
    });

    const lotacaoResumo = await this.getLotacaoResumo(escolaId);

    const afastamentosAtivos = await this.getAfastamentosAtivos();

    return {
      totalProfissionais,
      profissionaisPorTipo: profissionaisPorTipo.map((p) => ({
        tipo: p.tipo,
        quantidade: p._count,
      })),
      lotacaoResumo,
      afastamentosAtivos: afastamentosAtivos.length,
      afastamentos: afastamentosAtivos,
    };
  }
}

export const profissionalService = new ProfissionalService();
