import { ManutencaoVeiculo } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../errors/index.js";
import {
  CreateManutencaoInput,
  UpdateManutencaoInput,
} from "../schemas/transporte.schemas.js";

interface ManutencaoFilters {
  veiculoId?: string;
  status?: string;
  tipo?: string;
  dataInicio?: Date;
  dataFim?: Date;
}

const INCLUDE_VEICULO = {
  veiculo: { select: { id: true, placa: true, tipo: true, modelo: true } },
} as const;

function montarWhere(filters?: ManutencaoFilters) {
  const where: any = {};
  if (filters?.veiculoId) where.veiculoId = filters.veiculoId;
  if (filters?.status) where.status = filters.status;
  if (filters?.tipo) where.tipo = filters.tipo;

  if (filters?.dataInicio || filters?.dataFim) {
    where.dataAgendada = {};
    if (filters.dataInicio) where.dataAgendada.gte = filters.dataInicio;
    if (filters.dataFim) where.dataAgendada.lte = filters.dataFim;
  }

  return where;
}

export class ManutencaoService {
  // Lista manutenções com filtros
  async findAll(filters?: ManutencaoFilters) {
    return prisma.manutencaoVeiculo.findMany({
      where: montarWhere(filters),
      include: INCLUDE_VEICULO,
      orderBy: { dataAgendada: "desc" },
    });
  }

  // Lista manutenções paginadas
  async findAllPaginated(
    filters: ManutencaoFilters,
    pagination: { page: number; limit: number }
  ) {
    const where = montarWhere(filters);
    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      prisma.manutencaoVeiculo.findMany({
        where,
        include: INCLUDE_VEICULO,
        orderBy: { dataAgendada: "desc" },
        skip,
        take: pagination.limit,
      }),
      prisma.manutencaoVeiculo.count({ where }),
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

  // Busca manutenção por ID
  async findById(id: string) {
    const manutencao = await prisma.manutencaoVeiculo.findUnique({
      where: { id },
      include: INCLUDE_VEICULO,
    });

    if (!manutencao) {
      throw new NotFoundError("NF_039");
    }

    return manutencao;
  }

  // Agenda manutenção validando o veículo
  async create(data: CreateManutencaoInput): Promise<ManutencaoVeiculo> {
    const veiculo = await prisma.veiculo.findUnique({
      where: { id: data.veiculoId },
    });
    if (!veiculo) {
      throw new NotFoundError("NF_036");
    }

    return prisma.manutencaoVeiculo.create({ data });
  }

  // Atualiza manutenção
  async update(
    id: string,
    data: UpdateManutencaoInput
  ): Promise<ManutencaoVeiculo> {
    const manutencao = await prisma.manutencaoVeiculo.findUnique({
      where: { id },
    });
    if (!manutencao) {
      throw new NotFoundError("NF_039");
    }

    return prisma.manutencaoVeiculo.update({ where: { id }, data });
  }

  // Remove manutenção
  async delete(id: string): Promise<void> {
    const manutencao = await prisma.manutencaoVeiculo.findUnique({
      where: { id },
    });
    if (!manutencao) {
      throw new NotFoundError("NF_039");
    }

    await prisma.manutencaoVeiculo.delete({ where: { id } });
  }

  // Custo total de manutenções concluídas por veículo (join em memória com placas)
  async custoTotalPorVeiculo(filters?: { dataInicio?: Date; dataFim?: Date }) {
    const where: any = { status: "CONCLUIDA" };
    if (filters?.dataInicio || filters?.dataFim) {
      where.dataAgendada = {};
      if (filters.dataInicio) where.dataAgendada.gte = filters.dataInicio;
      if (filters.dataFim) where.dataAgendada.lte = filters.dataFim;
    }

    const grupos = await prisma.manutencaoVeiculo.groupBy({
      by: ["veiculoId"],
      _sum: { custo: true },
      _count: { _all: true },
      where,
    });

    const veiculos = await prisma.veiculo.findMany({
      where: { id: { in: grupos.map((g) => g.veiculoId) } },
      select: { id: true, placa: true, tipo: true, modelo: true },
    });
    const porId = new Map(veiculos.map((v) => [v.id, v]));

    return grupos.map((grupo) => ({
      veiculoId: grupo.veiculoId,
      veiculo: porId.get(grupo.veiculoId) ?? null,
      totalManutencoes: grupo._count._all,
      custoTotal: grupo._sum.custo ?? 0,
    }));
  }
}

export const manutencaoService = new ManutencaoService();
