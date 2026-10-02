import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { NotFoundError, PermissionError } from "../errors/AppError.js";
import { contextoAtual } from "../lib/contexto.js";
import { escolasDoEscopo, filtroLeitura } from "../lib/escopo.js";
import { GESTAO } from "../lib/rbac.js";

/** Limite padrão da lista pessoal (as mais relevantes primeiro: não lidas, prioridade, recentes). */
export const LIMITE_NOTIFICACOES_USUARIO = 100;

// Equipe das escolas (quem pode receber aviso de colega da mesma escola)
const PAPEIS_EQUIPE_ESCOLA = ["DIRETOR", "COORDENADOR", "SECRETARIA", "PROFESSOR"];

/**
 * Quem não é da gestão da rede só notifica quem está no seu escopo: a equipe
 * das escolas do escopo (lotada nelas ou com aula em turma delas) e os
 * responsáveis (vínculo ativo) de alunos do escopo. Fora disso → 403.
 * Sem contexto (jobs/rotinas internas) ou gestão: sem restrição.
 */
async function garantirDestinatariosNoEscopo(userIds: string[]) {
  const ctx = contextoAtual();
  const papel = ctx?.papel;
  if (!ctx || papel === undefined || GESTAO.includes(papel)) return;
  const e = ctx.escopo;
  if (!e) throw new PermissionError("PERM_007", { detalhe: "destinatário fora do seu escopo" });

  const unicos = [...new Set(userIds)];
  const escolas = escolasDoEscopo(e);
  const daMatricula = filtroLeitura("Matricula", e) ?? {};
  const permitidos = await prisma.user.findMany({
    where: {
      id: { in: unicos },
      OR: [
        {
          role: { in: PAPEIS_EQUIPE_ESCOLA },
          OR: [
            { escolaId: { in: escolas } },
            { profissional: { escolas: { some: { escolaId: { in: escolas } } } } },
            { profissional: { turmas: { some: { turma: { escolaId: { in: escolas } } } } } },
          ],
        },
        { vinculosMatricula: { some: { ativo: true, matricula: daMatricula } } },
      ],
    },
    select: { id: true },
  });
  if (permitidos.length !== unicos.length) {
    throw new PermissionError("PERM_007", { detalhe: "destinatário fora do seu escopo" });
  }
}


export class NotificacaoService {
  /**
   * Cria uma nova notificação
   */
  async create(data: {
    userId: string;
    titulo: string;
    mensagem: string;
    tipo: string;
    prioridade?: string;
    canais: string[];
    link?: string;
    acaoTipo?: string;
    acaoId?: string;
  }) {
    await garantirDestinatariosNoEscopo([data.userId]);
    const notificacao = await prisma.notificacao.create({
      data: {
        userId: data.userId,
        titulo: data.titulo,
        mensagem: data.mensagem,
        tipo: data.tipo,
        prioridade: data.prioridade || "NORMAL",
        canais: data.canais,
        link: data.link,
        acaoTipo: data.acaoTipo,
        acaoId: data.acaoId,
      },
    });

    return notificacao;
  }

  /**
   * Cria notificações em massa para múltiplos usuários
   */
  async createBulk(data: {
    userIds: string[];
    titulo: string;
    mensagem: string;
    tipo: string;
    prioridade?: string;
    canais: string[];
    link?: string;
    acaoTipo?: string;
    acaoId?: string;
  }) {
    await garantirDestinatariosNoEscopo(data.userIds);
    const notificacoes = await Promise.all(
      data.userIds.map((userId) =>
        prisma.notificacao.create({
          data: {
            userId,
            titulo: data.titulo,
            mensagem: data.mensagem,
            tipo: data.tipo,
            prioridade: data.prioridade || "NORMAL",
            canais: data.canais,
            link: data.link,
            acaoTipo: data.acaoTipo,
            acaoId: data.acaoId,
          },
        })
      )
    );

    return notificacoes;
  }

  /**
   * Lista todas as notificações com filtros opcionais
   */
  async findAll(filters?: {
    userId?: string;
    tipo?: string;
    prioridade?: string;
    lida?: boolean;
  }) {
    const where: Prisma.NotificacaoWhereInput = {};

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.tipo) where.tipo = filters.tipo;
    if (filters?.prioridade) where.prioridade = filters.prioridade;
    if (filters?.lida !== undefined) where.lida = filters.lida;

    const notificacoes = await prisma.notificacao.findMany({
      where,
      orderBy: [
        { lida: "asc" }, // Não lidas primeiro
        { prioridade: "desc" },
        { createdAt: "desc" },
      ],
    });

    return notificacoes;
  }

  /**
   * Lista todas as notificações com paginação
   */
  async findAllPaginated(
    filters: {
      userId?: string;
      tipo?: string;
      prioridade?: string;
      lida?: boolean;
    },
    pagination: { page: number; limit: number }
  ) {
    const skip = (pagination.page - 1) * pagination.limit;
    const where: Prisma.NotificacaoWhereInput = {};

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.tipo) where.tipo = filters.tipo;
    if (filters?.prioridade) where.prioridade = filters.prioridade;
    if (filters?.lida !== undefined) where.lida = filters.lida;

    const [data, total] = await Promise.all([
      prisma.notificacao.findMany({
        where,
        orderBy: [
          { lida: "asc" }, // Não lidas primeiro
          { prioridade: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: pagination.limit,
      }),
      prisma.notificacao.count({ where }),
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
   * Busca notificações de um usuário
   */
  async findByUser(userId: string, filtro?: "NAO_LIDAS" | "LIDAS" | "TODAS") {
    const where: Prisma.NotificacaoWhereInput = { userId };

    if (filtro === "NAO_LIDAS") {
      where.lida = false;
    } else if (filtro === "LIDAS") {
      where.lida = true;
    }

    const notificacoes = await prisma.notificacao.findMany({
      where,
      orderBy: [
        { lida: "asc" },
        { prioridade: "desc" },
        { createdAt: "desc" },
      ],
      take: LIMITE_NOTIFICACOES_USUARIO,
    });

    return notificacoes;
  }

  /**
   * Busca uma notificação por ID
   */
  async findById(id: string) {
    const notificacao = await prisma.notificacao.findUnique({
      where: { id },
    });

    if (!notificacao) {
      throw new NotFoundError("NF_028");
    }

    return notificacao;
  }

  /**
   * Marca notificação como lida
   */
  async marcarComoLida(id: string) {
    const notificacao = await prisma.notificacao.findUnique({
      where: { id },
    });

    if (!notificacao) {
      throw new NotFoundError("NF_028");
    }

    const updated = await prisma.notificacao.update({
      where: { id },
      data: {
        lida: true,
        dataLeitura: new Date(),
      },
    });

    return updated;
  }

  /**
   * Marca todas as notificações de um usuário como lidas
   */
  async marcarTodasComoLidas(userId: string) {
    const result = await prisma.notificacao.updateMany({
      where: {
        userId,
        lida: false,
      },
      data: {
        lida: true,
        dataLeitura: new Date(),
      },
    });

    return {
      message: "Notificações marcadas como lidas",
      count: result.count,
    };
  }

  /**
   * Deleta uma notificação
   */
  async delete(id: string) {
    const notificacao = await prisma.notificacao.findUnique({
      where: { id },
    });

    if (!notificacao) {
      throw new NotFoundError("NF_028");
    }

    await prisma.notificacao.delete({
      where: { id },
    });

    return { message: "Notificação deletada com sucesso" };
  }

  /**
   * Deleta todas as notificações lidas de um usuário
   */
  async deletarLidas(userId: string) {
    const result = await prisma.notificacao.deleteMany({
      where: {
        userId,
        lida: true,
      },
    });

    return {
      message: "Notificações lidas deletadas",
      count: result.count,
    };
  }

  /**
   * Conta notificações não lidas de um usuário
   */
  async countNaoLidas(userId: string) {
    const count = await prisma.notificacao.count({
      where: {
        userId,
        lida: false,
      },
    });

    return { count };
  }

  /**
   * Estatísticas de notificações
   */
  async getEstatisticas(userId?: string) {
    const where: Prisma.NotificacaoWhereInput = {};
    if (userId) where.userId = userId;

    const total = await prisma.notificacao.count({ where });

    const naoLidas = await prisma.notificacao.count({
      where: {
        ...where,
        lida: false,
      },
    });

    const porTipo = await prisma.notificacao.groupBy({
      by: ["tipo"],
      where,
      _count: true,
    });

    const porPrioridade = await prisma.notificacao.groupBy({
      by: ["prioridade"],
      where,
      _count: true,
    });

    return {
      total,
      naoLidas,
      lidas: total - naoLidas,
      porTipo: porTipo.reduce((acc: Record<string, number>, item) => {
        acc[item.tipo] = item._count;
        return acc;
      }, {}),
      porPrioridade: porPrioridade.reduce((acc: Record<string, number>, item) => {
        acc[item.prioridade] = item._count;
        return acc;
      }, {}),
    };
  }

  /**
   * Atualiza status de envio de notificação
   */
  async atualizarStatusEnvio(
    id: string,
    canal: "EMAIL" | "SMS" | "PUSH",
    enviado: boolean
  ) {
    const notificacao = await prisma.notificacao.findUnique({
      where: { id },
    });

    if (!notificacao) {
      throw new NotFoundError("NF_028");
    }

    const updateData: Prisma.NotificacaoUpdateInput = {};

    if (canal === "EMAIL") {
      updateData.enviadaEmail = enviado;
    } else if (canal === "SMS") {
      updateData.enviadaSMS = enviado;
    } else if (canal === "PUSH") {
      updateData.enviadaPush = enviado;
    }

    const updated = await prisma.notificacao.update({
      where: { id },
      data: updateData,
    });

    return updated;
  }
}
