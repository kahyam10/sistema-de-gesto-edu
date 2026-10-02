import { prisma } from "../lib/prisma.js";
import { CreateSerieInput, UpdateSerieInput } from "../schemas/index.js";
import { contextoAtual } from "../lib/contexto.js";
import { filtroLeitura } from "../lib/escopo.js";

/**
 * Includes não passam pela extensão de escopo do Prisma (ela filtra só o model
 * da consulta raiz): o filtro de leitura do model incluído vai aqui, a partir
 * do escopo da requisição. Sem contexto/escopo (gestão da rede, jobs) = {}.
 */
function ondeNoEscopo(model: string): { where?: Record<string, unknown> } {
  const escopo = contextoAtual()?.escopo;
  const filtro = escopo ? filtroLeitura(model, escopo) : null;
  return filtro ? { where: filtro } : {};
}

export class SerieService {
  async findAll() {
    return prisma.serie.findMany({
      include: {
        nivel: {
          include: {
            etapa: {
              include: { tipoEducacao: true },
            },
          },
        },
      },
      orderBy: [
        { nivel: { etapa: { ordem: "asc" } } },
        { nivel: { ordem: "asc" } },
        { ordem: "asc" },
      ],
    });
  }

  async findById(id: string) {
    return prisma.serie.findUnique({
      where: { id },
      include: {
        nivel: {
          include: {
            etapa: {
              include: { tipoEducacao: true },
            },
          },
        },
        // Turmas de outras escolas/professores ficam de fora para quem tem escopo
        turmas: { ...ondeNoEscopo("Turma") },
      },
    });
  }

  async findByNivel(nivelId: string) {
    return prisma.serie.findMany({
      where: { nivelId },
      include: { nivel: true },
      orderBy: { ordem: "asc" },
    });
  }

  async create(data: CreateSerieInput) {
    return prisma.serie.create({
      data: {
        nome: data.nome,
        ordem: data.ordem,
        nivelId: data.nivelId,
      },
      include: {
        nivel: {
          include: { etapa: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateSerieInput) {
    return prisma.serie.update({
      where: { id },
      data,
      include: {
        nivel: {
          include: { etapa: true },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.serie.delete({
      where: { id },
    });
  }
}

export const serieService = new SerieService();
