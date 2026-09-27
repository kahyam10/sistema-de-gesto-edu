import type { Prisma } from "@prisma/client";
import { Motorista } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../errors/index.js";
import {
  CreateMotoristaInput,
  UpdateMotoristaInput,
} from "../schemas/transporte.schemas.js";

export interface AlertaCnhMotorista {
  motorista: Motorista;
  documentosVencendo: Array<{
    documento: string;
    vencimento: Date;
    vencido: boolean;
  }>;
}

export class MotoristaService {
  // Lista motoristas com filtros
  async findAll(filters?: {
    ativo?: boolean;
    vinculo?: string;
  }): Promise<Motorista[]> {
    const where: Prisma.MotoristaWhereInput = {};
    if (filters?.ativo !== undefined) where.ativo = filters.ativo;
    if (filters?.vinculo) where.vinculo = filters.vinculo;

    return prisma.motorista.findMany({
      where,
      orderBy: { nome: "asc" },
    });
  }

  // Busca motorista por ID com rotas atendidas
  async findById(id: string) {
    const motorista = await prisma.motorista.findUnique({
      where: { id },
      include: { rotas: true },
    });

    if (!motorista) {
      throw new NotFoundError("NF_037");
    }

    return motorista;
  }

  // Cadastra motorista (CPF duplicado = P2002, sobe para o handler)
  async create(data: CreateMotoristaInput): Promise<Motorista> {
    return prisma.motorista.create({ data });
  }

  // Atualiza motorista
  async update(id: string, data: UpdateMotoristaInput): Promise<Motorista> {
    const motorista = await prisma.motorista.findUnique({ where: { id } });
    if (!motorista) {
      throw new NotFoundError("NF_037");
    }

    return prisma.motorista.update({ where: { id }, data });
  }

  // Remove motorista
  async delete(id: string): Promise<void> {
    const motorista = await prisma.motorista.findUnique({ where: { id } });
    if (!motorista) {
      throw new NotFoundError("NF_037");
    }

    await prisma.motorista.delete({ where: { id } });
  }

  // Alertas de CNH e curso de transporte escolar vencendo em até `dias`
  async alertasCnh(dias = 30): Promise<AlertaCnhMotorista[]> {
    const agora = new Date();
    const limite = new Date(Date.now() + dias * 86400000);

    const motoristas = await prisma.motorista.findMany({
      where: {
        ativo: true,
        OR: [
          { cnhValidade: { lte: limite } },
          { vencimentoCursoTransporte: { lte: limite } },
        ],
      },
      orderBy: { nome: "asc" },
    });

    return motoristas.map((motorista) => {
      const documentosVencendo: AlertaCnhMotorista["documentosVencendo"] = [];

      if (motorista.cnhValidade <= limite) {
        documentosVencendo.push({
          documento: "CNH",
          vencimento: motorista.cnhValidade,
          vencido: motorista.cnhValidade < agora,
        });
      }
      if (
        motorista.vencimentoCursoTransporte &&
        motorista.vencimentoCursoTransporte <= limite
      ) {
        documentosVencendo.push({
          documento: "Curso de Transporte Escolar",
          vencimento: motorista.vencimentoCursoTransporte,
          vencido: motorista.vencimentoCursoTransporte < agora,
        });
      }

      return { motorista, documentosVencendo };
    });
  }
}

export const motoristaService = new MotoristaService();
