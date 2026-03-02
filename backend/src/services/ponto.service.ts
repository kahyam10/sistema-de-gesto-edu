import { PrismaClient, Ponto } from "@prisma/client";
import {
  CreatePontoInput,
  UpdatePontoInput,
  RegistrarPontoInput,
} from "../schemas/index.js";

const prisma = new PrismaClient();

export class PontoService {
  // Cria um registro de ponto manual (admin)
  async create(data: CreatePontoInput): Promise<Ponto> {
    // Calcula horas trabalhadas se tiver entrada e saída
    const horasTrabalhadas = this.calcularHoras(data);

    return await prisma.ponto.create({
      data: {
        ...data,
        horasTrabalhadas,
      },
    });
  }

  // Registra ponto (entrada/saída) - usado pelo profissional
  async registrarPonto(data: RegistrarPontoInput): Promise<Ponto> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Busca se já existe registro para hoje
    let ponto = await prisma.ponto.findFirst({
      where: {
        profissionalId: data.profissionalId,
        data: hoje,
      },
    });

    if (ponto) {
      // Atualiza registro existente
      const updateData: any = {};

      if (data.tipo === "ENTRADA") updateData.entrada = data.horario;
      if (data.tipo === "SAIDA") updateData.saida = data.horario;
      if (data.tipo === "ENTRADA2") updateData.entrada2 = data.horario;
      if (data.tipo === "SAIDA2") updateData.saida2 = data.horario;

      if (data.latitude) updateData.latitude = data.latitude;
      if (data.longitude) updateData.longitude = data.longitude;

      // Recalcula horas trabalhadas
      const pontoAtualizado = { ...ponto, ...updateData };
      updateData.horasTrabalhadas = this.calcularHoras(pontoAtualizado);

      ponto = await prisma.ponto.update({
        where: { id: ponto.id },
        data: updateData,
      });
    } else {
      // Cria novo registro
      const createData: any = {
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

      ponto = await prisma.ponto.create({
        data: createData,
      });
    }

    return ponto;
  }

  // Busca todos os pontos com filtros
  async findAll(filters?: {
    profissionalId?: string;
    escolaId?: string;
    dataInicio?: Date;
    dataFim?: Date;
    tipoRegistro?: string;
  }): Promise<Ponto[]> {
    const where: any = {};

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
      include: {
        profissional: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            tipo: true,
          },
        },
      },
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
    const where: any = {};

    if (filters?.profissionalId) where.profissionalId = filters.profissionalId;
    if (filters?.escolaId) where.escolaId = filters.escolaId;
    if (filters?.tipoRegistro) where.tipoRegistro = filters.tipoRegistro;

    if (filters?.dataInicio || filters?.dataFim) {
      where.data = {};
      if (filters.dataInicio) where.data.gte = filters.dataInicio;
      if (filters.dataFim) where.data.lte = filters.dataFim;
    }

    const include = {
      profissional: {
        select: {
          id: true,
          nome: true,
          cpf: true,
          tipo: true,
        },
      },
    };

    const [data, total] = await Promise.all([
      prisma.ponto.findMany({
        where,
        include,
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
  async findById(id: string): Promise<Ponto | null> {
    return await prisma.ponto.findUnique({
      where: { id },
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
    });
  }

  // Atualiza ponto
  async update(id: string, data: UpdatePontoInput): Promise<Ponto> {
    // Recalcula horas se necessário
    if (data.entrada || data.saida || data.entrada2 || data.saida2) {
      const pontoAtual = await prisma.ponto.findUnique({ where: { id } });
      if (pontoAtual) {
        const pontoAtualizado = { ...pontoAtual, ...data };
        (data as any).horasTrabalhadas = this.calcularHoras(pontoAtualizado);
      }
    }

    return await prisma.ponto.update({
      where: { id },
      data,
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
    pontos: Ponto[];
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
  private calcularHoras(ponto: any): number {
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
