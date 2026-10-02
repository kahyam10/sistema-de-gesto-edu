import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { NotFoundError, PermissionError } from "../errors/AppError.js";
import { contextoAtual } from "../lib/contexto.js";
import { GESTAO, PEDAGOGICO } from "../lib/rbac.js";
import { portalService } from "./portal.service.js";

/** Usuário da sessão (request.user), passado pela rota. */
export interface UsuarioSessao {
  id: string;
  role: string;
}

const papelDaRequisicao = (u?: UsuarioSessao) => u?.role ?? contextoAtual()?.papel;

/** RESPONSAVEL, USER e papéis desconhecidos: só leem o que é deles (portal). */
const ehPapelDoPortal = (papel: string | undefined) => papel !== undefined && !PEDAGOGICO.includes(papel);

/**
 * Filtro extra de leitura para quem não é da equipe: só comunicados
 * publicados, ativos, não expirados e destinados a ele (rede ou escolas/
 * turmas/etapas dos alunos vinculados — o MESMO filtro do portal).
 * undefined = sem filtro extra (equipe: vale o escopo da extensão);
 * null = nada visível (sem usuário identificado ou sem vínculo).
 */
async function filtroDoPortal(u?: UsuarioSessao): Promise<Prisma.ComunicadoWhereInput | null | undefined> {
  if (!ehPapelDoPortal(papelDaRequisicao(u))) return undefined;
  if (!u) return null;
  return (await portalService.whereComunicados(u.id)) as Prisma.ComunicadoWhereInput | null;
}

/**
 * Quem tem escopo só altera comunicados das próprias escolas — nunca os da
 * rede (escolaId nulo), que são da gestão. A extensão já filtra a escrita;
 * isto dá um 403 explícito em vez de "não encontrado".
 */
function garantirEditavel(escolaId: string | null) {
  const e = contextoAtual()?.escopo;
  if (!e) return;
  const ok = e.tipo === "ESCOLA"
    ? escolaId !== null && escolaId === e.escolaId
    : escolaId !== null && e.escolaIds.includes(escolaId);
  if (!ok) throw new PermissionError("PERM_007", { detalhe: "comunicado da rede ou de outra escola" });
}

/**
 * Autor do comunicado. A gestão da rede assina como quiser (ex.: "SEMEC");
 * os demais assinam SEMPRE pela sessão — o corpo não escolhe o nome (antes,
 * qualquer um publicava como "SEMEC").
 */
async function autorDaSessao(
  data: { autorId?: string; autorNome: string },
  u?: UsuarioSessao
): Promise<{ autorId: string | undefined; autorNome: string }> {
  const papel = papelDaRequisicao(u);
  if (papel === undefined || GESTAO.includes(papel)) return { autorId: data.autorId, autorNome: data.autorNome };

  if (u) {
    const user = await prisma.user.findUnique({
      where: { id: u.id },
      select: { nome: true, profissionalId: true, profissional: { select: { nome: true } } },
    });
    if (!user) throw new PermissionError("PERM_001");
    return { autorId: user.profissionalId ?? undefined, autorNome: user.profissional?.nome ?? user.nome };
  }
  // Sem o usuário (rota que ainda não o repassa): deriva do escopo da sessão
  const e = contextoAtual()?.escopo;
  if (e?.tipo === "PROFESSOR" && e.profissionalId) {
    const prof = await prisma.profissionalEducacao.findUnique({ where: { id: e.profissionalId }, select: { nome: true } });
    if (prof) return { autorId: e.profissionalId, autorNome: prof.nome };
  }
  if (e?.tipo === "ESCOLA" && e.escolaId) {
    const escola = await prisma.escola.findUnique({ where: { id: e.escolaId }, select: { nome: true } });
    if (escola) return { autorId: undefined, autorNome: escola.nome };
  }
  throw new PermissionError("PERM_001");
}


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
  }, usuario?: UsuarioSessao) {
    // Professor publica só nas escolas em que leciona: nunca "para a rede"
    const e = contextoAtual()?.escopo;
    if (e?.tipo === "PROFESSOR" && !(data.escolaId && e.escolaIds.includes(data.escolaId))) {
      throw new PermissionError("PERM_007", { detalhe: "comunicado sem escola ou de outra escola" });
    }
    const autor = await autorDaSessao(data, usuario);

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
    if (autor.autorId) {
      const profissional = await prisma.profissionalEducacao.findUnique({
        where: { id: autor.autorId },
      });
      if (!profissional) {
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
        autorId: autor.autorId,
        autorNome: autor.autorNome,
      },
      include: {
        escola: true,
        turma: {
          include: {
            serie: {
              include: {
                nivel: { include: { etapa: true } },
              },
            },
          },
        },
        etapa: true,
        autor: { select: { id: true, nome: true, tipo: true } },
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
  }, usuario?: UsuarioSessao) {
    const doPortal = await filtroDoPortal(usuario);
    if (doPortal === null) return [];
    const where: Prisma.ComunicadoWhereInput = {};

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
      where: doPortal ? { AND: [where, doPortal] } : where,
      include: {
        escola: true,
        turma: {
          include: {
            serie: {
              include: {
                nivel: { include: { etapa: true } },
              },
            },
          },
        },
        etapa: true,
        autor: { select: { id: true, nome: true, tipo: true } },
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
   * Lista todos os comunicados com paginação
   */
  async findAllPaginated(
    filters: {
      escolaId?: string;
      turmaId?: string;
      etapaId?: string;
      tipo?: string;
      categoria?: string;
      destinatarios?: string;
      ativo?: boolean;
      destaque?: boolean;
    },
    pagination: { page: number; limit: number },
    usuario?: UsuarioSessao
  ) {
    const skip = (pagination.page - 1) * pagination.limit;
    const doPortal = await filtroDoPortal(usuario);
    if (doPortal === null) {
      return { data: [], pagination: { page: pagination.page, limit: pagination.limit, total: 0, totalPages: 0 } };
    }
    const where: Prisma.ComunicadoWhereInput = {};

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

    if (doPortal) where.AND = [doPortal];

    const include = {
      escola: true,
      turma: {
        include: {
          serie: {
            include: {
              nivel: { include: { etapa: true } },
            },
          },
        },
      },
      etapa: true,
      autor: { select: { id: true, nome: true, tipo: true } },
      _count: {
        select: {
          destinatariosLeitura: true,
        },
      },
    };

    const [data, total] = await Promise.all([
      prisma.comunicado.findMany({
        where,
        include,
        orderBy: [
          { destaque: "desc" },
          { dataPublicacao: "desc" },
        ],
        skip,
        take: pagination.limit,
      }),
      prisma.comunicado.count({ where }),
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

  /**
   * Busca um comunicado por ID
   */
  async findById(id: string, usuario?: UsuarioSessao) {
    const doPortal = await filtroDoPortal(usuario);
    if (doPortal === null) throw new NotFoundError("NF_027");
    const comunicado = await prisma.comunicado.findFirst({
      where: doPortal ? { AND: [{ id }, doPortal] } : { id },
      include: {
        escola: true,
        turma: {
          include: {
            serie: {
              include: {
                nivel: { include: { etapa: true } },
              },
            },
          },
        },
        etapa: true,
        autor: { select: { id: true, nome: true, tipo: true } },
        // Quem é do portal vê só o próprio recibo de leitura
        destinatariosLeitura: doPortal && usuario ? { where: { userId: usuario.id } } : true,
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
    garantirEditavel(comunicado.escolaId);

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
                nivel: { include: { etapa: true } },
              },
            },
          },
        },
        etapa: true,
        autor: { select: { id: true, nome: true, tipo: true } },
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
    garantirEditavel(comunicado.escolaId);

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
    let where: Prisma.ComunicadoWhereInput = {
      ativo: true,
      OR: [
        { dataExpiracao: null },
        { dataExpiracao: { gte: new Date() } },
      ],
    };
    // Responsável/USER (a rota já garante que é a própria lista): só os
    // comunicados destinados a ele, como no portal
    if (ehPapelDoPortal(contextoAtual()?.papel)) {
      const doPortal = (await portalService.whereComunicados(userId)) as Prisma.ComunicadoWhereInput | null;
      if (!doPortal) return [];
      where = doPortal;
    }

    const comunicados = await prisma.comunicado.findMany({
      where,
      include: {
        escola: true,
        turma: true,
        etapa: true,
        autor: { select: { id: true, nome: true, tipo: true } },
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
    const where: Prisma.ComunicadoWhereInput = {
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
      porTipo: porTipo.reduce((acc: Record<string, number>, item) => {
        acc[item.tipo] = item._count;
        return acc;
      }, {}),
      porCategoria: porCategoria.reduce((acc: Record<string, number>, item) => {
        if (item.categoria) {
          acc[item.categoria] = item._count;
        }
        return acc;
      }, {}),
    };
  }
}
