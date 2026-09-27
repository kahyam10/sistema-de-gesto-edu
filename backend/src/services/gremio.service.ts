import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { NotFoundError, BusinessError } from "../errors/index.js";
import {
  CreateGremioInput,
  UpdateGremioInput,
  CreateChapaGremioInput,
  UpdateChapaGremioInput,
  ApurarEleicaoInput,
  CreateAtividadeGremioInput,
  UpdateAtividadeGremioInput,
} from "../schemas/democratica.schemas.js";

export class GremioService {
  // Lista grêmios com filtros
  async findAll(filters?: {
    escolaId?: string;
    anoLetivo?: number;
    status?: string;
  }) {
    const where: Prisma.GremioEstudantilWhereInput = {};

    if (filters?.escolaId) where.escolaId = filters.escolaId;
    if (filters?.anoLetivo) where.anoLetivo = filters.anoLetivo;
    if (filters?.status) where.status = filters.status;

    return await prisma.gremioEstudantil.findMany({
      where,
      include: {
        escola: { select: { id: true, nome: true } },
        _count: { select: { chapas: true, atividades: true } },
      },
      orderBy: [{ anoLetivo: "desc" }, { nome: "asc" }],
    });
  }

  // Busca grêmio por ID com chapas e atividades
  async findById(id: string) {
    const gremio = await prisma.gremioEstudantil.findUnique({
      where: { id },
      include: {
        escola: { select: { id: true, nome: true } },
        chapas: { orderBy: { numero: "asc" } },
        atividades: { orderBy: { dataInicio: "desc" } },
      },
    });

    if (!gremio) {
      throw new NotFoundError("NF_042");
    }

    return gremio;
  }

  // Cria grêmio (duplicidade escola+ano = P2002 do @@unique)
  async create(data: CreateGremioInput) {
    const escola = await prisma.escola.findUnique({
      where: { id: data.escolaId },
    });
    if (!escola) {
      throw new NotFoundError("NF_003");
    }

    return await prisma.gremioEstudantil.create({
      data,
      include: { escola: { select: { id: true, nome: true } } },
    });
  }

  // Atualiza grêmio
  async update(id: string, data: UpdateGremioInput) {
    const gremio = await prisma.gremioEstudantil.findUnique({ where: { id } });
    if (!gremio) {
      throw new NotFoundError("NF_042");
    }

    return await prisma.gremioEstudantil.update({
      where: { id },
      data,
      include: { escola: { select: { id: true, nome: true } } },
    });
  }

  // Remove grêmio (cascade remove chapas e atividades)
  async delete(id: string) {
    const gremio = await prisma.gremioEstudantil.findUnique({ where: { id } });
    if (!gremio) {
      throw new NotFoundError("NF_042");
    }

    await prisma.gremioEstudantil.delete({ where: { id } });
  }

  // Adiciona chapa ao grêmio (número duplicado = P2002 do @@unique([gremioId, numero]))
  async addChapa(gremioId: string, data: CreateChapaGremioInput) {
    const gremio = await prisma.gremioEstudantil.findUnique({
      where: { id: gremioId },
    });
    if (!gremio) {
      throw new NotFoundError("NF_042");
    }

    return await prisma.chapaGremio.create({
      data: {
        ...data,
        membros: data.membros as Prisma.InputJsonValue | undefined,
        gremioId,
      },
    });
  }

  // Atualiza chapa
  async updateChapa(chapaId: string, data: UpdateChapaGremioInput) {
    const chapa = await prisma.chapaGremio.findUnique({
      where: { id: chapaId },
    });
    if (!chapa) {
      throw new NotFoundError("NF_043");
    }

    return await prisma.chapaGremio.update({
      where: { id: chapaId },
      data: {
        ...data,
        membros: data.membros as Prisma.InputJsonValue | undefined,
      },
    });
  }

  // Remove chapa
  async deleteChapa(chapaId: string) {
    const chapa = await prisma.chapaGremio.findUnique({
      where: { id: chapaId },
    });
    if (!chapa) {
      throw new NotFoundError("NF_043");
    }

    await prisma.chapaGremio.delete({ where: { id: chapaId } });
  }

  // Apura a eleição do grêmio: grava votos por chapa, marca a vencedora
  // eleita=true e ativa o grêmio — tudo em transação
  async apurarEleicao(gremioId: string, { resultados }: ApurarEleicaoInput) {
    return await prisma.$transaction(async (tx) => {
      const gremio = await tx.gremioEstudantil.findUnique({
        where: { id: gremioId },
      });
      if (!gremio) {
        throw new NotFoundError("NF_042");
      }

      const jaEleita = await tx.chapaGremio.findFirst({
        where: { gremioId, eleita: true },
      });
      if (jaEleita) {
        throw new BusinessError("BIZ_032");
      }

      // Grava os votos de cada chapa (todas devem pertencer ao grêmio)
      for (const resultado of resultados) {
        const chapa = await tx.chapaGremio.findFirst({
          where: { id: resultado.chapaId, gremioId },
        });
        if (!chapa) {
          throw new NotFoundError("NF_043");
        }

        await tx.chapaGremio.update({
          where: { id: resultado.chapaId },
          data: { votosRecebidos: resultado.votosRecebidos },
        });
      }

      // Marca a chapa de maior votação como eleita
      const vencedora = resultados.reduce((maior, atual) =>
        atual.votosRecebidos > maior.votosRecebidos ? atual : maior
      );
      await tx.chapaGremio.update({
        where: { id: vencedora.chapaId },
        data: { eleita: true },
      });

      // Grêmio passa a ATIVO
      return await tx.gremioEstudantil.update({
        where: { id: gremioId },
        data: { status: "ATIVO" },
        include: {
          escola: { select: { id: true, nome: true } },
          chapas: { orderBy: { numero: "asc" } },
        },
      });
    });
  }

  // Adiciona atividade ao grêmio
  async addAtividade(gremioId: string, data: CreateAtividadeGremioInput) {
    const gremio = await prisma.gremioEstudantil.findUnique({
      where: { id: gremioId },
    });
    if (!gremio) {
      throw new NotFoundError("NF_042");
    }

    return await prisma.atividadeGremio.create({
      data: { ...data, gremioId },
    });
  }

  // Atualiza atividade
  async updateAtividade(id: string, data: UpdateAtividadeGremioInput) {
    const atividade = await prisma.atividadeGremio.findUnique({
      where: { id },
    });
    if (!atividade) {
      throw new NotFoundError("NF_044");
    }

    return await prisma.atividadeGremio.update({ where: { id }, data });
  }

  // Remove atividade
  async deleteAtividade(id: string) {
    const atividade = await prisma.atividadeGremio.findUnique({
      where: { id },
    });
    if (!atividade) {
      throw new NotFoundError("NF_044");
    }

    await prisma.atividadeGremio.delete({ where: { id } });
  }
}

export const gremioService = new GremioService();
