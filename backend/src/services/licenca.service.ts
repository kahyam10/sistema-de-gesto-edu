import { PrismaClient, Licenca } from "@prisma/client";
import {
  CreateLicencaInput,
  UpdateLicencaInput,
  AprovarLicencaInput,
} from "../schemas/index.js";

const prisma = new PrismaClient();

export class LicencaService {
  // Cria uma solicitação de licença
  async create(data: CreateLicencaInput): Promise<Licenca> {
    // Calcula dias corridos e úteis
    const diasCorridos = this.calcularDiasCorridos(
      data.dataInicio,
      data.dataFim
    );
    const diasUteis = this.calcularDiasUteis(data.dataInicio, data.dataFim);

    return await prisma.licenca.create({
      data: {
        ...data,
        diasCorridos,
        diasUteis,
        status: "PENDENTE",
      },
    });
  }

  // Busca todas as licenças com filtros
  async findAll(filters?: {
    profissionalId?: string;
    status?: string;
    tipo?: string;
    dataInicio?: Date;
    dataFim?: Date;
  }): Promise<Licenca[]> {
    const where: any = {};

    if (filters?.profissionalId) where.profissionalId = filters.profissionalId;
    if (filters?.status) where.status = filters.status;
    if (filters?.tipo) where.tipo = filters.tipo;

    if (filters?.dataInicio || filters?.dataFim) {
      where.dataInicio = {};
      if (filters.dataInicio) where.dataInicio.gte = filters.dataInicio;
      if (filters.dataFim) where.dataInicio.lte = filters.dataFim;
    }

    return await prisma.licenca.findMany({
      where,
      include: {
        profissional: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            tipo: true,
            matricula: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Busca todas as licenças com paginação
  async findAllPaginated(
    filters: {
      profissionalId?: string;
      status?: string;
      tipo?: string;
      dataInicio?: Date;
      dataFim?: Date;
    },
    pagination: { page: number; limit: number }
  ) {
    const skip = (pagination.page - 1) * pagination.limit;
    const where: any = {};

    if (filters?.profissionalId) where.profissionalId = filters.profissionalId;
    if (filters?.status) where.status = filters.status;
    if (filters?.tipo) where.tipo = filters.tipo;

    if (filters?.dataInicio || filters?.dataFim) {
      where.dataInicio = {};
      if (filters.dataInicio) where.dataInicio.gte = filters.dataInicio;
      if (filters.dataFim) where.dataInicio.lte = filters.dataFim;
    }

    const include = {
      profissional: {
        select: {
          id: true,
          nome: true,
          cpf: true,
          tipo: true,
          matricula: true,
        },
      },
    };

    const [data, total] = await Promise.all([
      prisma.licenca.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
        skip,
        take: pagination.limit,
      }),
      prisma.licenca.count({ where }),
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

  // Busca licença por ID
  async findById(id: string): Promise<Licenca | null> {
    return await prisma.licenca.findUnique({
      where: { id },
      include: {
        profissional: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            tipo: true,
            matricula: true,
            email: true,
            telefone: true,
          },
        },
      },
    });
  }

  // Atualiza licença (apenas se pendente)
  async update(id: string, data: UpdateLicencaInput): Promise<Licenca> {
    const licenca = await prisma.licenca.findUnique({ where: { id } });

    if (licenca && licenca.status !== "PENDENTE") {
      throw new Error(
        "Não é possível alterar uma licença que já foi aprovada ou rejeitada"
      );
    }

    // Recalcula dias se datas foram alteradas
    const updateData: any = { ...data };
    if (data.dataInicio || data.dataFim) {
      const dataInicio = data.dataInicio || licenca?.dataInicio;
      const dataFim = data.dataFim || licenca?.dataFim;

      if (dataInicio && dataFim) {
        updateData.diasCorridos = this.calcularDiasCorridos(
          dataInicio,
          dataFim
        );
        updateData.diasUteis = this.calcularDiasUteis(dataInicio, dataFim);
      }
    }

    return await prisma.licenca.update({
      where: { id },
      data: updateData,
    });
  }

  // Aprova ou rejeita uma licença
  async aprovar(id: string, data: AprovarLicencaInput): Promise<Licenca> {
    const licenca = await prisma.licenca.findUnique({ where: { id } });

    if (!licenca) {
      throw new Error("Licença não encontrada");
    }

    if (licenca.status !== "PENDENTE") {
      throw new Error("Esta licença já foi processada");
    }

    return await prisma.licenca.update({
      where: { id },
      data: {
        status: data.status,
        aprovadaPor: data.aprovadaPor,
        dataAprovacao: new Date(),
        justificativaRejeicao: data.justificativaRejeicao,
      },
    });
  }

  // Cancela uma licença
  async cancelar(id: string): Promise<Licenca> {
    const licenca = await prisma.licenca.findUnique({ where: { id } });

    if (!licenca) {
      throw new Error("Licença não encontrada");
    }

    if (licenca.status === "CANCELADA") {
      throw new Error("Esta licença já foi cancelada");
    }

    return await prisma.licenca.update({
      where: { id },
      data: { status: "CANCELADA" },
    });
  }

  // Remove licença (apenas se pendente ou cancelada)
  async delete(id: string): Promise<void> {
    const licenca = await prisma.licenca.findUnique({ where: { id } });

    if (licenca && !["PENDENTE", "CANCELADA"].includes(licenca.status)) {
      throw new Error(
        "Não é possível excluir uma licença aprovada ou rejeitada"
      );
    }

    await prisma.licenca.delete({ where: { id } });
  }

  // Busca licenças ativas (aprovadas e dentro do período)
  async findLicencasAtivas(): Promise<Licenca[]> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return await prisma.licenca.findMany({
      where: {
        status: "APROVADA",
        dataInicio: { lte: hoje },
        dataFim: { gte: hoje },
      },
      include: {
        profissional: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },
      },
    });
  }

  // Relatório de licenças por profissional
  async relatorioPorProfissional(
    profissionalId: string,
    anoInicio?: number,
    anoFim?: number
  ): Promise<{
    licencas: Licenca[];
    totalDias: number;
    porTipo: Record<string, number>;
  }> {
    const where: any = { profissionalId };

    if (anoInicio || anoFim) {
      where.dataInicio = {};
      if (anoInicio)
        where.dataInicio.gte = new Date(`${anoInicio}-01-01`);
      if (anoFim)
        where.dataInicio.lte = new Date(`${anoFim}-12-31`);
    }

    const licencas = await prisma.licenca.findMany({
      where,
      orderBy: { dataInicio: "desc" },
    });

    const totalDias = licencas.reduce(
      (acc, l) => acc + (l.diasCorridos || 0),
      0
    );

    const porTipo: Record<string, number> = {};
    licencas.forEach((l) => {
      if (!porTipo[l.tipo]) porTipo[l.tipo] = 0;
      porTipo[l.tipo] += l.diasCorridos;
    });

    return { licencas, totalDias, porTipo };
  }

  // Calcula dias corridos entre duas datas
  private calcularDiasCorridos(inicio: Date, fim: Date): number {
    const diffTime = Math.abs(fim.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Inclui o dia final
  }

  // Calcula dias úteis entre duas datas (ignora sábados e domingos)
  private calcularDiasUteis(inicio: Date, fim: Date): number {
    let count = 0;
    const current = new Date(inicio);

    while (current <= fim) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // 0 = Domingo, 6 = Sábado
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }
}

export const licencaService = new LicencaService();
