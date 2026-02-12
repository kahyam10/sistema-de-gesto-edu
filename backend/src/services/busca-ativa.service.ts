import { prisma } from "../lib/prisma.js";
import { NotFoundError, BusinessError } from "../errors/index.js";

export interface CreateBuscaAtivaInput {
  matriculaId: string;
  motivo: string; // INFREQUENCIA, EVASAO, ABANDONO, RISCO_SOCIAL
  descricao?: string;
  prioridade?: string; // BAIXA, MEDIA, ALTA, URGENTE
  responsavelId?: string;
  escolaId?: string;
}

export interface UpdateBuscaAtivaInput {
  status?: string;
  prioridade?: string;
  responsavelId?: string;
  resultado?: string;
  dataResolucao?: Date;
}

export interface CreateVisitaInput {
  buscaAtivaId: string;
  data: Date;
  horario?: string;
  responsavel: string;
  situacao: string; // REALIZADA, NAO_ATENDEU, RECUSOU, MUDOU_ENDERECO
  relato?: string;
  observacoes?: string;
  proximaVisita?: Date;
}

export interface CreateEncaminhamentoInput {
  buscaAtivaId: string;
  orgao: string; // CONSELHO_TUTELAR, ASSISTENCIA_SOCIAL, SAUDE, CREAS, CRAS, MINISTERIO_PUBLICO
  motivo: string;
  dataEnvio: Date;
  protocolo?: string;
}

export interface UpdateEncaminhamentoInput {
  status?: string;
  retorno?: string;
  dataRetorno?: Date;
  observacoes?: string;
}

export class BuscaAtivaService {
  // ==================== BUSCA ATIVA ====================

  async create(data: CreateBuscaAtivaInput) {
    // Verifica se matrícula existe
    const matricula = await prisma.matricula.findUnique({
      where: { id: data.matriculaId },
    });

    if (!matricula) {
      throw new NotFoundError("NF_004"); // Matrícula não encontrada
    }

    // Verifica se já existe busca ativa para essa matrícula
    const existente = await prisma.buscaAtiva.findFirst({
      where: {
        matriculaId: data.matriculaId,
        status: {
          in: ["ATIVA", "EM_ACOMPANHAMENTO"],
        },
      },
    });

    if (existente) {
      throw new BusinessError("BIZ_013", {
        matriculaId: data.matriculaId,
        buscaAtivaId: existente.id,
      }); // Já existe busca ativa para esta matrícula
    }

    return await prisma.buscaAtiva.create({
      data: {
        ...data,
        prioridade: data.prioridade || "MEDIA",
      },
      include: {
        matricula: true,
        responsavel: true,
        escola: true,
      },
    });
  }

  async findAll(filters?: {
    escolaId?: string;
    status?: string;
    prioridade?: string;
    motivo?: string;
  }) {
    const where: any = {};

    if (filters?.escolaId) where.escolaId = filters.escolaId;
    if (filters?.status) where.status = filters.status;
    if (filters?.prioridade) where.prioridade = filters.prioridade;
    if (filters?.motivo) where.motivo = filters.motivo;

    return await prisma.buscaAtiva.findMany({
      where,
      include: {
        matricula: {
          select: {
            nomeAluno: true,
            numeroMatricula: true,
            turma: {
              select: {
                nome: true,
                serie: {
                  select: {
                    nome: true,
                  },
                },
              },
            },
          },
        },
        responsavel: {
          select: {
            nome: true,
          },
        },
        escola: {
          select: {
            nome: true,
          },
        },
        visitas: {
          orderBy: { data: "desc" },
          take: 1, // Última visita
        },
        _count: {
          select: {
            visitas: true,
            encaminhamentos: true,
          },
        },
      },
      orderBy: [
        { prioridade: "desc" }, // URGENTE primeiro
        { createdAt: "desc" },
      ],
    });
  }

  async findById(id: string) {
    const buscaAtiva = await prisma.buscaAtiva.findUnique({
      where: { id },
      include: {
        matricula: true,
        responsavel: true,
        escola: true,
        visitas: {
          orderBy: { data: "desc" },
        },
        encaminhamentos: {
          orderBy: { dataEnvio: "desc" },
        },
      },
    });

    if (!buscaAtiva) {
      throw new NotFoundError("NF_017", { buscaAtivaId: id }); // Busca ativa não encontrada
    }

    return buscaAtiva;
  }

  async update(id: string, data: UpdateBuscaAtivaInput) {
    const buscaAtiva = await prisma.buscaAtiva.findUnique({
      where: { id },
    });

    if (!buscaAtiva) {
      throw new NotFoundError("NF_017", { buscaAtivaId: id });
    }

    return await prisma.buscaAtiva.update({
      where: { id },
      data,
      include: {
        matricula: true,
        responsavel: true,
        visitas: {
          orderBy: { data: "desc" },
        },
        encaminhamentos: {
          orderBy: { dataEnvio: "desc" },
        },
      },
    });
  }

  async delete(id: string) {
    const buscaAtiva = await prisma.buscaAtiva.findUnique({
      where: { id },
    });

    if (!buscaAtiva) {
      throw new NotFoundError("NF_017", { buscaAtivaId: id });
    }

    return await prisma.buscaAtiva.delete({
      where: { id },
    });
  }

  // ==================== VISITAS DOMICILIARES ====================

  async createVisita(data: CreateVisitaInput) {
    // Verifica se busca ativa existe
    const buscaAtiva = await prisma.buscaAtiva.findUnique({
      where: { id: data.buscaAtivaId },
    });

    if (!buscaAtiva) {
      throw new NotFoundError("NF_017", { buscaAtivaId: data.buscaAtivaId });
    }

    return await prisma.visitaDomiciliar.create({
      data,
    });
  }

  async findVisitasByBuscaAtiva(buscaAtivaId: string) {
    return await prisma.visitaDomiciliar.findMany({
      where: { buscaAtivaId },
      orderBy: { data: "desc" },
    });
  }

  async updateVisita(id: string, data: Partial<CreateVisitaInput>) {
    const visita = await prisma.visitaDomiciliar.findUnique({
      where: { id },
    });

    if (!visita) {
      throw new NotFoundError("NF_018", { visitaId: id }); // Visita não encontrada
    }

    return await prisma.visitaDomiciliar.update({
      where: { id },
      data,
    });
  }

  async deleteVisita(id: string) {
    const visita = await prisma.visitaDomiciliar.findUnique({
      where: { id },
    });

    if (!visita) {
      throw new NotFoundError("NF_018", { visitaId: id });
    }

    return await prisma.visitaDomiciliar.delete({
      where: { id },
    });
  }

  // ==================== ENCAMINHAMENTOS EXTERNOS ====================

  async createEncaminhamento(data: CreateEncaminhamentoInput) {
    // Verifica se busca ativa existe
    const buscaAtiva = await prisma.buscaAtiva.findUnique({
      where: { id: data.buscaAtivaId },
    });

    if (!buscaAtiva) {
      throw new NotFoundError("NF_017", { buscaAtivaId: data.buscaAtivaId });
    }

    return await prisma.encaminhamentoExterno.create({
      data: {
        ...data,
        status: "ENVIADO",
      },
    });
  }

  async findEncaminhamentosByBuscaAtiva(buscaAtivaId: string) {
    return await prisma.encaminhamentoExterno.findMany({
      where: { buscaAtivaId },
      orderBy: { dataEnvio: "desc" },
    });
  }

  async updateEncaminhamento(id: string, data: UpdateEncaminhamentoInput) {
    const encaminhamento = await prisma.encaminhamentoExterno.findUnique({
      where: { id },
    });

    if (!encaminhamento) {
      throw new NotFoundError("NF_019", { encaminhamentoId: id }); // Encaminhamento não encontrado
    }

    return await prisma.encaminhamentoExterno.update({
      where: { id },
      data,
    });
  }

  async deleteEncaminhamento(id: string) {
    const encaminhamento = await prisma.encaminhamentoExterno.findUnique({
      where: { id },
    });

    if (!encaminhamento) {
      throw new NotFoundError("NF_019", { encaminhamentoId: id });
    }

    return await prisma.encaminhamentoExterno.delete({
      where: { id },
    });
  }

  // ==================== RELATÓRIOS E ESTATÍSTICAS ====================

  async getEstatisticas(escolaId?: string) {
    const where: any = {};
    if (escolaId) where.escolaId = escolaId;

    const total = await prisma.buscaAtiva.count({ where });

    const porStatus = await prisma.buscaAtiva.groupBy({
      by: ["status"],
      where,
      _count: true,
    });

    const porPrioridade = await prisma.buscaAtiva.groupBy({
      by: ["prioridade"],
      where,
      _count: true,
    });

    const porMotivo = await prisma.buscaAtiva.groupBy({
      by: ["motivo"],
      where,
      _count: true,
    });

    return {
      total,
      porStatus: porStatus.reduce(
        (acc, item) => ({
          ...acc,
          [item.status]: item._count,
        }),
        {} as Record<string, number>
      ),
      porPrioridade: porPrioridade.reduce(
        (acc, item) => ({
          ...acc,
          [item.prioridade]: item._count,
        }),
        {} as Record<string, number>
      ),
      porMotivo: porMotivo.reduce(
        (acc, item) => ({
          ...acc,
          [item.motivo]: item._count,
        }),
        {} as Record<string, number>
      ),
    };
  }
}
