import type { Prisma } from "@prisma/client";
import { Veiculo } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../errors/index.js";
import {
  CreateVeiculoInput,
  UpdateVeiculoInput,
} from "../schemas/transporte.schemas.js";

// Documentos do veículo com vencimento monitorado
const DOCUMENTOS_VEICULO = [
  { campo: "vencimentoLicenciamento", documento: "Licenciamento" },
  { campo: "vencimentoSeguro", documento: "Seguro" },
  { campo: "vencimentoVistoria", documento: "Vistoria" },
] as const;

export interface AlertaVencimentoVeiculo {
  veiculo: Veiculo;
  documentosVencendo: Array<{
    documento: string;
    vencimento: Date;
    vencido: boolean;
  }>;
}

export class VeiculoService {
  // Lista veículos com filtros
  async findAll(filters?: {
    tipo?: string;
    ativo?: boolean;
    tipoPropriedade?: string;
  }): Promise<Veiculo[]> {
    const where: Prisma.VeiculoWhereInput = {};
    if (filters?.tipo) where.tipo = filters.tipo;
    if (filters?.ativo !== undefined) where.ativo = filters.ativo;
    if (filters?.tipoPropriedade)
      where.tipoPropriedade = filters.tipoPropriedade;

    return prisma.veiculo.findMany({
      where,
      orderBy: { placa: "asc" },
    });
  }

  // Busca veículo por ID com manutenções recentes e rotas
  async findById(id: string) {
    const veiculo = await prisma.veiculo.findUnique({
      where: { id },
      include: {
        manutencoes: { orderBy: { dataAgendada: "desc" }, take: 10 },
        rotas: true,
      },
    });

    if (!veiculo) {
      throw new NotFoundError("NF_036");
    }

    return veiculo;
  }

  // Cadastra veículo (placa duplicada = P2002, sobe para o handler)
  async create(data: CreateVeiculoInput): Promise<Veiculo> {
    return prisma.veiculo.create({ data });
  }

  // Atualiza veículo
  async update(id: string, data: UpdateVeiculoInput): Promise<Veiculo> {
    const veiculo = await prisma.veiculo.findUnique({ where: { id } });
    if (!veiculo) {
      throw new NotFoundError("NF_036");
    }

    return prisma.veiculo.update({ where: { id }, data });
  }

  // Remove veículo
  async delete(id: string): Promise<void> {
    const veiculo = await prisma.veiculo.findUnique({ where: { id } });
    if (!veiculo) {
      throw new NotFoundError("NF_036");
    }

    await prisma.veiculo.delete({ where: { id } });
  }

  // Alertas de vencimento da documentação (licenciamento/seguro/vistoria)
  // Retorna veículos ativos com qualquer documento vencendo em até `dias`
  async alertasVencimentos(dias = 30): Promise<AlertaVencimentoVeiculo[]> {
    const agora = new Date();
    const limite = new Date(Date.now() + dias * 86400000);

    const veiculos = await prisma.veiculo.findMany({
      where: {
        ativo: true,
        OR: [
          { vencimentoLicenciamento: { lte: limite } },
          { vencimentoSeguro: { lte: limite } },
          { vencimentoVistoria: { lte: limite } },
        ],
      },
      orderBy: { placa: "asc" },
    });

    return veiculos.map((veiculo) => {
      const documentosVencendo = DOCUMENTOS_VEICULO.flatMap(
        ({ campo, documento }) => {
          const vencimento = veiculo[campo];
          if (!vencimento || vencimento > limite) return [];
          return [{ documento, vencimento, vencido: vencimento < agora }];
        }
      );

      return { veiculo, documentosVencendo };
    });
  }
}

export const veiculoService = new VeiculoService();
