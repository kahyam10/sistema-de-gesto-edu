import { PrismaClient } from "@prisma/client";
import { NotFoundError, BusinessError } from "../errors/AppError.js";

const prisma = new PrismaClient();

export class ComunicadoService {
  /**
   * Cria um novo comunicado
   */
  async create(data: {
    escolaId?: string;
    titulo: string;
    mensagem: string;
    tipo: string;
    categoria?: string;
    destinatarios: string;
    turmaId?: string;
    etapaId?: string;
    anexoUrl?: string;
    dataPublicacao?: Date;
    dataExpiracao?: Date;
    destaque?: boolean;
    autorId?: string;
    autorNome: string;
  }) {
    // Validar escola se fornecida
    if (data.escolaId) {
      const escola = await prisma.escola.findUnique({
        where: { id: data.escolaId },
      });
      if (!escola) {
        throw new NotFoundError("NF_003");
      }
    }

    // Validar turma se fornecida
    if (data.turmaId) {
      const turma = await prisma.turma.findUnique({
        where: { id: data.turmaId },
      });
      if (!turma) {
        throw new NotFoundError("NF_005");
      }
    }

    // Validar etapa se fornecida
    if (data.etapaId) {
      const etapa = await prisma.etapaEnsino.findUnique({
        where: { id: data.etapaId },
      });
      if (!etapa) {
        throw new NotFoundError("NF_007");
      }
    }

    // Validar autor se fornecido
    if (data.autorId) {
      const autor = await prisma.profissionalEducacao.findUnique({
        where: { id: data.autorId },
      });
      if (!autor) {
        throw new NotFoundError("NF_006");
      }
    }

    const comunicado = await prisma.comunicado.create({
      data: {
        escolaId: data.escolaId,
        titulo: data.titulo,
        mensagem: data.mensagem,
        tipo: data.tipo,
        categoria: data.categoria,
        destinatarios: data.destinatarios,
        turmaId: data.turmaId,
        etapaId: data.etapaId,
        anexoUrl: data.anexoUrl,
        dataPublicacao: data.dataPublicacao || new Date(),
        dataExpiracao: data.dataExpiracao,
        destaque: data.destaque || false,
        autorId: data.autorId,
        autorNome: data.autorNome,
      },
      include: {
        escola: true,
        turma: {
          include: {
            serie: {
              include: {
                etapa: true,
              },
            },
          },
        },
        etapa: true,
        autor: true,
        _count: {
          select: {
            destinatariosLeitura: true,
          },
        },
      },
    });

    return comunicado;
  }

  /**
   * Lista todos os comunicados com filtros opcionais
   */
  async findAll(filters?: {
    escolaId?: string;
    turmaId?: string;
    etapaId?: string;
    tipo?: string;
    categoria?: string;
    destinatarios?: string;
    ativo?: boolean;
    destaque?: boolean;
  }) {
    const where: any = {};

    if (filters?.escolaId) where.escolaId = filters.escolaId;
    if (filters?.turmaId) where.turmaId = filters.turmaId;
    if (filters?.etapaId) where.etapaId = filters.etapaId;
    if (filters?.tipo) where.tipo = filters.tipo;
    if (filters?.categoria) where.categoria = filters.categoria;
    if (filters?.destinatarios) where.destinatarios = filters.destinatarios;
    if (filters?.ativo !== undefined) where.ativo = filters.ativo;
    if (filters?.destaque !== undefined) where.destaque = filters.destaque;

    // Filtrar comunicados não expirados
    where.OR = [
      { dataExpiracao: null },
      { dataExpiracao: { gte: new Date() } },
    ];

    const comunicados = await prisma.comunicado.findMany({
      where,
      include: {
        escola: true,
        turma: {
          include: {
            serie: {
              include: {
                etapa: true,
              },
            },
          },
        },
        etapa: true,
        autor: true,
        _count: {
          select: {
            destinatariosLeitura: true,
          },
        },
      },
      orderBy: [
        { destaque: "desc" },
        { dataPublicacao: "desc" },
      ],
    });

    return comunicados;
  }

  /**
   * Busca um comunicado por ID
   */
  async findById(id: string) {
    const comunicado = await prisma.comunicado.findUnique({
      where: { id },
      include: {
        escola: true,
        turma: {
          include: {
            serie: {
              include: {
                etapa: true,
              },
            },
          },
        },
        etapa: true,
        autor: true,
        destinatariosLeitura: true,
        _count: {
          select: {
            destinatariosLeitura: true,
          },
        },
      },
    });

    if (!comunicado) {
      throw new NotFoundError("NF_027");
    }

    return comunicado;
  }

  /**
   * Atualiza um comunicado
   */
  async update(
    id: string,
    data: {
      titulo?: string;
      mensagem?: string;
      tipo?: string;
      categoria?: string;
      destinatarios?: string;
      turmaId?: string;
      etapaId?: string;
      anexoUrl?: string;
      dataExpiracao?: Date;
      ativo?: boolean;
      destaque?: boolean;
    }
  ) {
    const comunicado = await prisma.comunicado.findUnique({
      where: { id },
    });

    if (!comunicado) {
      throw new NotFoundError("NF_027");
    }

    // Validar turma se fornecida
    if (data.turmaId) {
      const turma = await prisma.turma.findUnique({
        where: { id: data.turmaId },
      });
      if (!turma) {
        throw new NotFoundError("NF_002");
      }
    }

    // Validar etapa se fornecida
    if (data.etapaId) {
      const etapa = await prisma.etapaEnsino.findUnique({
        where: { id: data.etapaId },
      });
      if (!etapa) {
        throw new NotFoundError("NF_005");
      }
    }

    const updatedComunicado = await prisma.comunicado.update({
      where: { id },
      data,
      include: {
        escola: true,
        turma: {
          include: {
            serie: {
              include: {
                etapa: true,
              },
            },
          },
        },
        etapa: true,
        autor: true,
        _count: {
          select: {
            destinatariosLeitura: true,
          },
        },
      },
    });

    return updatedComunicado;
  }

  /**
   * Deleta um comunicado
   */
  async delete(id: string) {
    const comunicado = await prisma.comunicado.findUnique({
      where: { id },
    });

    if (!comunicado) {
      throw new NotFoundError("NF_027");
    }

    await prisma.comunicado.delete({
      where: { id },
    });

    return { message: "Comunicado deletado com sucesso" };
  }

  /**
   * Marca comunicado como lido por um usuário
   */
  async marcarComoLido(comunicadoId: string, userId: string) {
    // Validar comunicado
    const comunicado = await prisma.comunicado.findUnique({
      where: { id: comunicadoId },
    });
    if (!comunicado) {
      throw new NotFoundError("NF_027");
    }

    // Verificar se já existe registro
    const registro = await prisma.comunicadoDestinatario.findUnique({
      where: {
        comunicadoId_userId: {
          comunicadoId,
          userId,
        },
      },
    });

    if (registro) {
      // Atualiza registro existente
      const updated = await prisma.comunicadoDestinatario.update({
        where: {
          comunicadoId_userId: {
            comunicadoId,
            userId,
          },
        },
        data: {
          lido: true,
          dataLeitura: new Date(),
        },
      });
      return updated;
    }

    // Cria novo registro
    const novoRegistro = await prisma.comunicadoDestinatario.create({
      data: {
        comunicadoId,
        userId,
        lido: true,
        dataLeitura: new Date(),
      },
    });

    return novoRegistro;
  }

  /**
   * Marca comunicado como confirmado por um usuário
   */
  async confirmar(comunicadoId: string, userId: string) {
    // Verificar se existe registro
    let registro = await prisma.comunicadoDestinatario.findUnique({
      where: {
        comunicadoId_userId: {
          comunicadoId,
          userId,
        },
      },
    });

    if (!registro) {
      // Cria registro se não existir
      registro = await prisma.comunicadoDestinatario.create({
        data: {
          comunicadoId,
          userId,
          lido: true,
          dataLeitura: new Date(),
          confirmado: true,
          dataConfirmacao: new Date(),
        },
      });
    } else {
      // Atualiza registro existente
      registro = await prisma.comunicadoDestinatario.update({
        where: {
          comunicadoId_userId: {
            comunicadoId,
            userId,
          },
        },
        data: {
          confirmado: true,
          dataConfirmacao: new Date(),
          lido: true,
          dataLeitura: registro.dataLeitura || new Date(),
        },
      });
    }

    return registro;
  }

  /**
   * Busca comunicados por usuário (não lidos, lidos, todos)
   */
  async findByUser(userId: string, filtro?: "NAO_LIDOS" | "LIDOS" | "TODOS") {
    const where: any = {
      ativo: true,
      OR: [
        { dataExpiracao: null },
        { dataExpiracao: { gte: new Date() } },
      ],
    };

    const comunicados = await prisma.comunicado.findMany({
      where,
      include: {
        escola: true,
        turma: true,
        etapa: true,
        autor: true,
        destinatariosLeitura: {
          where: {
            userId,
          },
        },
      },
      orderBy: [
        { destaque: "desc" },
        { dataPublicacao: "desc" },
      ],
    });

    // Filtrar por status de leitura
    if (filtro === "NAO_LIDOS") {
      return comunicados.filter((c) => c.destinatariosLeitura.length === 0 || !c.destinatariosLeitura[0].lido);
    }

    if (filtro === "LIDOS") {
      return comunicados.filter((c) => c.destinatariosLeitura.length > 0 && c.destinatariosLeitura[0].lido);
    }

    return comunicados;
  }

  /**
   * Estatísticas de comunicados
   */
  async getEstatisticas(escolaId?: string) {
    const where: any = {
      ativo: true,
    };
    if (escolaId) where.escolaId = escolaId;

    const total = await prisma.comunicado.count({ where });

    const porTipo = await prisma.comunicado.groupBy({
      by: ["tipo"],
      where,
      _count: true,
    });

    const porCategoria = await prisma.comunicado.groupBy({
      by: ["categoria"],
      where,
      _count: true,
    });

    const destaques = await prisma.comunicado.count({
      where: {
        ...where,
        destaque: true,
      },
    });

    return {
      total,
      destaques,
      porTipo: porTipo.reduce((acc: any, item) => {
        acc[item.tipo] = item._count;
        return acc;
      }, {}),
      porCategoria: porCategoria.reduce((acc: any, item) => {
        if (item.categoria) {
          acc[item.categoria] = item._count;
        }
        return acc;
      }, {}),
    };
  }
}
