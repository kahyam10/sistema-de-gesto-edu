import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { NotFoundError, BusinessError } from "../errors/index.js";
import {
  CreateReuniaoDemocraticaInput,
  UpdateReuniaoDemocraticaInput,
  RegistrarAtaInput,
} from "../schemas/democratica.schemas.js";

interface ReuniaoDemocraticaFilters {
  escolaId?: string;
  orgao?: string;
  status?: string;
  colegiadoId?: string;
  dataInicio?: Date;
  dataFim?: Date;
}

export class ReuniaoDemocraticaService {
  private buildWhere(filters?: ReuniaoDemocraticaFilters) {
    const where: any = {};

    if (filters?.escolaId) where.escolaId = filters.escolaId;
    if (filters?.orgao) where.orgao = filters.orgao;
    if (filters?.status) where.status = filters.status;
    if (filters?.colegiadoId) where.colegiadoId = filters.colegiadoId;

    if (filters?.dataInicio || filters?.dataFim) {
      where.data = {};
      if (filters.dataInicio) where.data.gte = filters.dataInicio;
      if (filters.dataFim) where.data.lte = filters.dataFim;
    }

    return where;
  }

  // Lista reuniões com filtros
  async findAll(filters?: ReuniaoDemocraticaFilters) {
    return await prisma.reuniaoDemocratica.findMany({
      where: this.buildWhere(filters),
      include: {
        escola: { select: { id: true, nome: true } },
        _count: { select: { presencas: true } },
      },
      orderBy: { data: "desc" },
    });
  }

  // Lista reuniões com paginação
  async findAllPaginated(
    filters: ReuniaoDemocraticaFilters,
    pagination: { page: number; limit: number }
  ) {
    const skip = (pagination.page - 1) * pagination.limit;
    const where = this.buildWhere(filters);

    const [data, total] = await Promise.all([
      prisma.reuniaoDemocratica.findMany({
        where,
        include: {
          escola: { select: { id: true, nome: true } },
          _count: { select: { presencas: true } },
        },
        orderBy: { data: "desc" },
        skip,
        take: pagination.limit,
      }),
      prisma.reuniaoDemocratica.count({ where }),
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

  // Busca reunião por ID com presenças
  async findById(id: string) {
    const reuniao = await prisma.reuniaoDemocratica.findUnique({
      where: { id },
      include: {
        escola: { select: { id: true, nome: true } },
        presencas: true,
        colegiado: { select: { id: true, nome: true } },
      },
    });

    if (!reuniao) {
      throw new NotFoundError("NF_046");
    }

    return reuniao;
  }

  // Cria reunião/assembleia
  async create(data: CreateReuniaoDemocraticaInput) {
    const escola = await prisma.escola.findUnique({
      where: { id: data.escolaId },
    });
    if (!escola) {
      throw new NotFoundError("NF_003");
    }

    if (data.colegiadoId) {
      const colegiado = await prisma.colegiadoEscolar.findUnique({
        where: { id: data.colegiadoId },
      });
      if (!colegiado) {
        throw new NotFoundError("NF_040");
      }
    }

    return await prisma.reuniaoDemocratica.create({
      data: {
        ...data,
        pauta: data.pauta as Prisma.InputJsonValue | undefined,
      },
      include: { escola: { select: { id: true, nome: true } } },
    });
  }

  // Atualiza reunião (cancelada é imutável)
  async update(id: string, data: UpdateReuniaoDemocraticaInput) {
    const atual = await prisma.reuniaoDemocratica.findUnique({
      where: { id },
    });
    if (!atual) {
      throw new NotFoundError("NF_046");
    }

    if (atual.status === "CANCELADA") {
      throw new BusinessError("BIZ_033");
    }

    return await prisma.reuniaoDemocratica.update({
      where: { id },
      data: {
        ...data,
        pauta: data.pauta as Prisma.InputJsonValue | undefined,
      },
      include: { escola: { select: { id: true, nome: true } } },
    });
  }

  // Remove reunião (cascade remove presenças)
  async delete(id: string) {
    const reuniao = await prisma.reuniaoDemocratica.findUnique({
      where: { id },
    });
    if (!reuniao) {
      throw new NotFoundError("NF_046");
    }

    await prisma.reuniaoDemocratica.delete({ where: { id } });
  }

  // Registra ata, decisões e presenças (idempotente: substitui presenças anteriores)
  async registrarAta(id: string, data: RegistrarAtaInput) {
    return await prisma.$transaction(async (tx) => {
      const reuniao = await tx.reuniaoDemocratica.findUnique({
        where: { id },
      });
      if (!reuniao) {
        throw new NotFoundError("NF_046");
      }

      if (reuniao.status === "CANCELADA") {
        throw new BusinessError("BIZ_033");
      }

      await tx.presencaReuniaoDemocratica.deleteMany({
        where: { reuniaoId: id },
      });

      if (data.presencas && data.presencas.length > 0) {
        await tx.presencaReuniaoDemocratica.createMany({
          data: data.presencas.map((p) => ({
            reuniaoId: id,
            nome: p.nome,
            segmento: p.segmento,
            presente: p.presente,
          })),
        });
      }

      return await tx.reuniaoDemocratica.update({
        where: { id },
        data: {
          ata: data.ata,
          decisoes: data.decisoes as Prisma.InputJsonValue | undefined,
          status: "REALIZADA",
        },
        include: {
          escola: { select: { id: true, nome: true } },
          presencas: true,
        },
      });
    });
  }

  // Cancela reunião
  async cancelar(id: string) {
    const reuniao = await prisma.reuniaoDemocratica.findUnique({
      where: { id },
    });
    if (!reuniao) {
      throw new NotFoundError("NF_046");
    }

    if (reuniao.status === "CANCELADA") {
      throw new BusinessError("BIZ_033");
    }

    return await prisma.reuniaoDemocratica.update({
      where: { id },
      data: { status: "CANCELADA" },
    });
  }
}

export const reuniaoDemocraticaService = new ReuniaoDemocraticaService();
