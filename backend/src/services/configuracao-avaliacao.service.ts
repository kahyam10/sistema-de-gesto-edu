import { prisma } from "../lib/prisma.js";
import {
  CreateConfiguracaoAvaliacaoInput,
  UpdateConfiguracaoAvaliacaoInput,
} from "../schemas/index.js";

export class ConfiguracaoAvaliacaoService {
  async findAll(filters?: {
    anoLetivo?: number;
    escolaId?: string;
    etapaId?: string;
  }) {
    const where: any = {};
    if (filters?.anoLetivo) where.anoLetivo = filters.anoLetivo;
    if (filters?.escolaId) where.escolaId = filters.escolaId;
    if (filters?.etapaId) where.etapaId = filters.etapaId;

    return prisma.configuracaoAvaliacao.findMany({
      where,
      include: {
        escola: { select: { id: true, nome: true } },
        etapa: { select: { id: true, nome: true } },
      },
      orderBy: { anoLetivo: "desc" },
    });
  }

  async findById(id: string) {
    return prisma.configuracaoAvaliacao.findUnique({
      where: { id },
      include: {
        escola: { select: { id: true, nome: true } },
        etapa: { select: { id: true, nome: true } },
      },
    });
  }

  /**
   * Busca configuração mais específica para o contexto.
   * Fallback: escola+etapa > etapa > escola > global
   */
  async findByAnoLetivo(
    anoLetivo: number,
    escolaId?: string,
    etapaId?: string
  ) {
    // Tenta encontrar a configuração mais específica
    const configs = await prisma.configuracaoAvaliacao.findMany({
      where: { anoLetivo },
      include: {
        escola: { select: { id: true, nome: true } },
        etapa: { select: { id: true, nome: true } },
      },
    });

    // Prioridade: escola+etapa > etapa > escola > global
    if (escolaId && etapaId) {
      const specific = configs.find(
        (c) => c.escolaId === escolaId && c.etapaId === etapaId
      );
      if (specific) return specific;
    }

    if (etapaId) {
      const byEtapa = configs.find(
        (c) => c.etapaId === etapaId && !c.escolaId
      );
      if (byEtapa) return byEtapa;
    }

    if (escolaId) {
      const byEscola = configs.find(
        (c) => c.escolaId === escolaId && !c.etapaId
      );
      if (byEscola) return byEscola;
    }

    // Global (sem escola e sem etapa)
    const global = configs.find((c) => !c.escolaId && !c.etapaId);
    return global || null;
  }

  async create(data: CreateConfiguracaoAvaliacaoInput) {
    return prisma.configuracaoAvaliacao.create({
      data: {
        ...data,
        escolaId: data.escolaId || null,
        etapaId: data.etapaId || null,
      },
      include: {
        escola: { select: { id: true, nome: true } },
        etapa: { select: { id: true, nome: true } },
      },
    });
  }

  async update(id: string, data: UpdateConfiguracaoAvaliacaoInput) {
    const config = await prisma.configuracaoAvaliacao.findUnique({
      where: { id },
    });

    if (!config) {
      throw new Error("Configuração não encontrada");
    }

    return prisma.configuracaoAvaliacao.update({
      where: { id },
      data,
      include: {
        escola: { select: { id: true, nome: true } },
        etapa: { select: { id: true, nome: true } },
      },
    });
  }

  async delete(id: string) {
    const config = await prisma.configuracaoAvaliacao.findUnique({
      where: { id },
    });

    if (!config) {
      throw new Error("Configuração não encontrada");
    }

    return prisma.configuracaoAvaliacao.delete({ where: { id } });
  }
}

export const configuracaoAvaliacaoService =
  new ConfiguracaoAvaliacaoService();
