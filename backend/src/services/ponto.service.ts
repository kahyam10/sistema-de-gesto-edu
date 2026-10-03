import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import {
  CreatePontoInput,
  UpdatePontoInput,
  RegistrarPontoInput,
} from "../schemas/index.js";
import { hojeNaRede } from "../lib/datas.js";
import { contextoAtual } from "../lib/contexto.js";
import { escolasDoEscopo, EscopoNegadoError } from "../lib/escopo.js";

/**
 * Ponto.escolaId ("escola onde registrou") não tem relação no schema, então a
 * extensão de escopo só confere o profissional. Quem tem escopo de escola
 * (coordenação) não registra ponto em OUTRA escola, mesmo de um profissional
 * que também está lotado na sua. Escopo vem da sessão (contexto), nunca do corpo.
 */
function conferirEscolaDoPonto(escolaId: string | null | undefined): void {
  const escopo = contextoAtual()?.escopo;
  if (!escopo || escolaId === undefined || escolaId === null) return;
  if (!escolasDoEscopo(escopo).includes(escolaId)) {
    throw new EscopoNegadoError("Ponto.escolaId");
  }
}


/**
 * O que sai nas respostas de ponto (a rota não tem schema de resposta: a
 * saída é curada aqui). latitude/longitude — geolocalização do servidor —
 * NUNCA saem: são gravadas para controle, mas nenhuma tela as usa.
 * Coluna nova no modelo só aparece na API se for incluída aqui.
 */
const PONTO_SELECT = {
  id: true,
  profissionalId: true,
  escolaId: true,
  data: true,
  entrada: true,
  saida: true,
  entrada2: true,
  saida2: true,
  horasTrabalhadas: true,
  tipoRegistro: true,
  observacoes: true,
  justificativa: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PontoSelect;

/** Profissional no ponto: só identificação (nada de CPF, contato ou dados bancários). */
const PONTO_COM_PROFISSIONAL = {
  ...PONTO_SELECT,
  profissional: { select: { id: true, nome: true, tipo: true } },
} satisfies Prisma.PontoSelect;

export type PontoResposta = Prisma.PontoGetPayload<{ select: typeof PONTO_SELECT }>;
export type PontoComProfissional = Prisma.PontoGetPayload<{ select: typeof PONTO_COM_PROFISSIONAL }>;

export class PontoService {
  // Cria um registro de ponto manual (admin)
  async create(data: CreatePontoInput): Promise<PontoResposta> {
    conferirEscolaDoPonto(data.escolaId);
    // Calcula horas trabalhadas se tiver entrada e saída
    const horasTrabalhadas = this.calcularHoras(data);

    return await prisma.ponto.create({
      data: {
        ...data,
        horasTrabalhadas,
      },
      select: PONTO_SELECT,
    });
  }

  // Registra ponto (entrada/saída) - usado pelo profissional
  // Atômico: find + update/create em transação, com backstop no
  // @@unique([profissionalId, data]) contra registros duplicados no dia.
  async registrarPonto(data: RegistrarPontoInput): Promise<PontoResposta> {
    conferirEscolaDoPonto(data.escolaId);
    const hoje = hojeNaRede();

    return prisma.$transaction(async (tx) => {
    // Busca se já existe registro para hoje
    const ponto = await tx.ponto.findFirst({
      where: {
        profissionalId: data.profissionalId,
        data: hoje,
      },
    });

    if (ponto) {
      // Atualiza registro existente
      const updateData: Prisma.PontoUncheckedUpdateInput & Partial<Record<"entrada" | "saida" | "entrada2" | "saida2", string>> = {};

      if (data.tipo === "ENTRADA") updateData.entrada = data.horario;
      if (data.tipo === "SAIDA") updateData.saida = data.horario;
      if (data.tipo === "ENTRADA2") updateData.entrada2 = data.horario;
      if (data.tipo === "SAIDA2") updateData.saida2 = data.horario;

      if (data.latitude) updateData.latitude = data.latitude;
      if (data.longitude) updateData.longitude = data.longitude;

      // Recalcula horas trabalhadas
      const pontoAtualizado = { ...ponto, ...updateData };
      updateData.horasTrabalhadas = this.calcularHoras(pontoAtualizado);

      return tx.ponto.update({
        where: { id: ponto.id },
        data: updateData,
        select: PONTO_SELECT,
      });
    } else {
      // Cria novo registro
      const createData: Prisma.PontoUncheckedCreateInput = {
        profissionalId: data.profissionalId,
        escolaId: data.escolaId,
        data: hoje,
        latitude: data.latitude,
        longitude: data.longitude,
      };

      if (data.tipo === "ENTRADA") createData.entrada = data.horario;
      if (data.tipo === "SAIDA") createData.saida = data.horario;
      if (data.tipo === "ENTRADA2") createData.entrada2 = data.horario;
      if (data.tipo === "SAIDA2") createData.saida2 = data.horario;

      createData.horasTrabalhadas = this.calcularHoras(createData);

      return tx.ponto.create({
        data: createData,
        select: PONTO_SELECT,
      });
    }
    });
  }

  // Busca todos os pontos com filtros
  async findAll(filters?: {
    profissionalId?: string;
    escolaId?: string;
    dataInicio?: Date;
    dataFim?: Date;
    tipoRegistro?: string;
  }): Promise<PontoComProfissional[]> {
    const where: Prisma.PontoWhereInput = {};

    if (filters?.profissionalId) where.profissionalId = filters.profissionalId;
    if (filters?.escolaId) where.escolaId = filters.escolaId;
    if (filters?.tipoRegistro) where.tipoRegistro = filters.tipoRegistro;

    if (filters?.dataInicio || filters?.dataFim) {
      where.data = {};
      if (filters.dataInicio) where.data.gte = filters.dataInicio;
      if (filters.dataFim) where.data.lte = filters.dataFim;
    }

    return await prisma.ponto.findMany({
      where,
      select: PONTO_COM_PROFISSIONAL,
      orderBy: { data: "desc" },
    });
  }

  // Busca todos os pontos com paginação
  async findAllPaginated(
    filters: {
      profissionalId?: string;
      escolaId?: string;
      dataInicio?: Date;
      dataFim?: Date;
      tipoRegistro?: string;
    },
    pagination: { page: number; limit: number }
  ) {
    const skip = (pagination.page - 1) * pagination.limit;
    const where: Prisma.PontoWhereInput = {};

    if (filters?.profissionalId) where.profissionalId = filters.profissionalId;
    if (filters?.escolaId) where.escolaId = filters.escolaId;
    if (filters?.tipoRegistro) where.tipoRegistro = filters.tipoRegistro;

    if (filters?.dataInicio || filters?.dataFim) {
      where.data = {};
      if (filters.dataInicio) where.data.gte = filters.dataInicio;
      if (filters.dataFim) where.data.lte = filters.dataFim;
    }

    const [data, total] = await Promise.all([
      prisma.ponto.findMany({
        where,
        select: PONTO_COM_PROFISSIONAL,
        orderBy: { data: "desc" },
        skip,
        take: pagination.limit,
      }),
      prisma.ponto.count({ where }),
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

  // Busca ponto por ID
  async findById(id: string): Promise<PontoComProfissional | null> {
    return await prisma.ponto.findUnique({
      where: { id },
      select: PONTO_COM_PROFISSIONAL,
    });
  }

  // Atualiza ponto
  async update(id: string, data: UpdatePontoInput): Promise<PontoResposta> {
    conferirEscolaDoPonto(data.escolaId);
    // Recalcula horas se necessário
    if (data.entrada || data.saida || data.entrada2 || data.saida2) {
      const pontoAtual = await prisma.ponto.findUnique({ where: { id } });
      if (pontoAtual) {
        const pontoAtualizado = { ...pontoAtual, ...data };
        return await prisma.ponto.update({
          where: { id },
          data: { ...data, horasTrabalhadas: this.calcularHoras(pontoAtualizado) },
          select: PONTO_SELECT,
        });
      }
    }

    return await prisma.ponto.update({
      where: { id },
      data,
      select: PONTO_SELECT,
    });
  }

  // Remove ponto
  async delete(id: string): Promise<void> {
    await prisma.ponto.delete({ where: { id } });
  }

  // Relatório mensal de um profissional
  async relatorioMensal(
    profissionalId: string,
    mes: number,
    ano: number
  ): Promise<{
    pontos: PontoResposta[];
    totalHoras: number;
    diasTrabalhados: number;
    faltas: number;
    atrasos: number;
  }> {
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0);

    const pontos = await prisma.ponto.findMany({
      where: {
        profissionalId,
        data: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      select: PONTO_SELECT,
      orderBy: { data: "asc" },
    });

    const totalHoras = pontos.reduce(
      (acc, p) => acc + (p.horasTrabalhadas || 0),
      0
    );
    const diasTrabalhados = pontos.filter((p) => p.tipoRegistro === "NORMAL").length;
    const faltas = pontos.filter((p) =>
      ["FALTA", "FALTA_JUSTIFICADA"].includes(p.tipoRegistro)
    ).length;

    // Considera atraso se entrada > 08:00 (exemplo)
    const atrasos = pontos.filter((p) => {
      if (!p.entrada) return false;
      const [hora, minuto] = p.entrada.split(":").map(Number);
      return hora > 8 || (hora === 8 && minuto > 0);
    }).length;

    return {
      pontos,
      totalHoras,
      diasTrabalhados,
      faltas,
      atrasos,
    };
  }

  // Calcula horas trabalhadas no dia
  private calcularHoras(ponto: Partial<Record<"entrada" | "saida" | "entrada2" | "saida2", string | null>>): number {
    let total = 0;

    if (ponto.entrada && ponto.saida) {
      total += this.diferencaHoras(ponto.entrada, ponto.saida);
    }

    if (ponto.entrada2 && ponto.saida2) {
      total += this.diferencaHoras(ponto.entrada2, ponto.saida2);
    }

    return Math.round(total * 100) / 100; // 2 casas decimais
  }

  // Calcula diferença entre duas horas em formato HH:MM
  private diferencaHoras(inicio: string, fim: string): number {
    const [h1, m1] = inicio.split(":").map(Number);
    const [h2, m2] = fim.split(":").map(Number);

    const totalMinutosInicio = h1 * 60 + m1;
    const totalMinutosFim = h2 * 60 + m2;

    return (totalMinutosFim - totalMinutosInicio) / 60;
  }
}

export const pontoService = new PontoService();
