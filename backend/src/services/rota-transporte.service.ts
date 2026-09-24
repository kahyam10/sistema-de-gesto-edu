import { RotaTransporte } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { NotFoundError, BusinessError } from "../errors/index.js";
import {
  CreateRotaTransporteInput,
  UpdateRotaTransporteInput,
  VincularAlunoRotaInput,
} from "../schemas/transporte.schemas.js";

const INCLUDE_LISTA = {
  veiculo: true,
  motorista: true,
  escolas: { include: { escola: { select: { id: true, nome: true } } } },
  _count: { select: { alunos: true } },
} as const;

export class RotaTransporteService {
  // Lista rotas com filtros
  async findAll(filters?: {
    turno?: string;
    tipo?: string;
    escolaId?: string;
    ativo?: boolean;
  }) {
    const where: any = {};
    if (filters?.turno) where.turno = filters.turno;
    if (filters?.tipo) where.tipo = filters.tipo;
    if (filters?.ativo !== undefined) where.ativo = filters.ativo;
    if (filters?.escolaId)
      where.escolas = { some: { escolaId: filters.escolaId } };

    return prisma.rotaTransporte.findMany({
      where,
      include: INCLUDE_LISTA,
      orderBy: { codigo: "asc" },
    });
  }

  // Busca rota por ID com escolas e alunos vinculados
  async findById(id: string) {
    const rota = await prisma.rotaTransporte.findUnique({
      where: { id },
      include: {
        ...INCLUDE_LISTA,
        alunos: {
          include: {
            matricula: {
              select: {
                id: true,
                nomeAluno: true,
                numeroMatricula: true,
                escolaId: true,
              },
            },
          },
        },
      },
    });

    if (!rota) {
      throw new NotFoundError("NF_038");
    }

    return rota;
  }

  // Cria rota validando veículo e motorista (CNH vencida bloqueia o vínculo)
  async create(data: CreateRotaTransporteInput): Promise<RotaTransporte> {
    await this.validarVinculos(data.veiculoId, data.motoristaId);
    return prisma.rotaTransporte.create({ data });
  }

  // Atualiza rota (mesmas validações condicionais de veículo/motorista)
  async update(
    id: string,
    data: UpdateRotaTransporteInput
  ): Promise<RotaTransporte> {
    const rota = await prisma.rotaTransporte.findUnique({ where: { id } });
    if (!rota) {
      throw new NotFoundError("NF_038");
    }

    await this.validarVinculos(data.veiculoId, data.motoristaId);
    return prisma.rotaTransporte.update({ where: { id }, data });
  }

  // Remove rota (cascade remove vínculos de escolas e alunos)
  async delete(id: string): Promise<void> {
    const rota = await prisma.rotaTransporte.findUnique({ where: { id } });
    if (!rota) {
      throw new NotFoundError("NF_038");
    }

    await prisma.rotaTransporte.delete({ where: { id } });
  }

  // Vincula escola à rota (duplicado = P2002 do @@unique, sobe para o handler)
  async vincularEscola(rotaId: string, escolaId: string) {
    const rota = await prisma.rotaTransporte.findUnique({
      where: { id: rotaId },
    });
    if (!rota) {
      throw new NotFoundError("NF_038");
    }

    const escola = await prisma.escola.findUnique({ where: { id: escolaId } });
    if (!escola) {
      throw new NotFoundError("NF_003");
    }

    return prisma.rotaEscola.create({
      data: { rotaId, escolaId },
      include: { escola: { select: { id: true, nome: true } } },
    });
  }

  // Desvincula escola da rota
  async desvincularEscola(rotaId: string, escolaId: string): Promise<void> {
    const { count } = await prisma.rotaEscola.deleteMany({
      where: { rotaId, escolaId },
    });

    if (count === 0) {
      throw new NotFoundError("NF_001");
    }
  }

  // Vincula aluno à rota validando duplicidade (BIZ_027) e capacidade
  // do veículo (BIZ_028) dentro de uma transação
  async vincularAluno(rotaId: string, data: VincularAlunoRotaInput) {
    return prisma.$transaction(async (tx) => {
      const rota = await tx.rotaTransporte.findUnique({
        where: { id: rotaId },
        include: { veiculo: true },
      });
      if (!rota) {
        throw new NotFoundError("NF_038");
      }

      const matricula = await tx.matricula.findUnique({
        where: { id: data.matriculaId },
      });
      if (!matricula) {
        throw new NotFoundError("NF_004");
      }

      const jaVinculado = await tx.rotaAluno.findFirst({
        where: { rotaId, matriculaId: data.matriculaId },
      });
      if (jaVinculado) {
        throw new BusinessError("BIZ_027");
      }

      if (rota.veiculo) {
        const ocupacao = await tx.rotaAluno.count({ where: { rotaId } });
        if (ocupacao >= rota.veiculo.capacidade) {
          throw new BusinessError("BIZ_028");
        }
      }

      return tx.rotaAluno.create({
        data: {
          rotaId,
          matriculaId: data.matriculaId,
          pontoEmbarque: data.pontoEmbarque,
        },
        include: {
          matricula: {
            select: { id: true, nomeAluno: true, numeroMatricula: true },
          },
        },
      });
    });
  }

  // Desvincula aluno da rota
  async desvincularAluno(rotaId: string, matriculaId: string): Promise<void> {
    const { count } = await prisma.rotaAluno.deleteMany({
      where: { rotaId, matriculaId },
    });

    if (count === 0) {
      throw new NotFoundError("NF_001");
    }
  }

  // Valida veículo (NF_036) e motorista (NF_037 + CNH vencida = BIZ_029)
  private async validarVinculos(
    veiculoId?: string,
    motoristaId?: string
  ): Promise<void> {
    if (veiculoId) {
      const veiculo = await prisma.veiculo.findUnique({
        where: { id: veiculoId },
      });
      if (!veiculo) {
        throw new NotFoundError("NF_036");
      }
    }

    if (motoristaId) {
      const motorista = await prisma.motorista.findUnique({
        where: { id: motoristaId },
      });
      if (!motorista) {
        throw new NotFoundError("NF_037");
      }
      if (motorista.cnhValidade < new Date()) {
        throw new BusinessError("BIZ_029");
      }
    }
  }
}

export const rotaTransporteService = new RotaTransporteService();
