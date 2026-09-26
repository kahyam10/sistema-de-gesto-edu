import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { contextoAtual } from "../lib/contexto.js";
import { COORDENACAO_PEDAGOGICA, GESTAO } from "../lib/rbac.js";
import { BusinessError, NotFoundError, PermissionError } from "../errors/index.js";
import type {
  CreateAtividadeInput, CreateConteudoInput, CreatePlanoInput, ListarPlanosQuery,
  RevisarPlanoInput, UpdateAtividadeInput, UpdateConteudoInput, UpdatePlanoInput,
} from "../schemas/planejamento.schemas.js";

export interface Usuario {
  id: string;
  role: string;
}

const EDITAVEL = ["RASCUNHO", "DEVOLVIDO"];
const ehGestao = (u: Usuario) => GESTAO.includes(u.role);

/**
 * Quem tem escopo só altera registros da própria escola (ou, professor, das
 * escolas em que leciona). Registros "da rede" (escolaId nulo) só a gestão.
 * A extensão do Prisma já filtra a leitura; isto dá 403 explícito na escrita.
 */
function garantirEditavel(escolaId: string | null) {
  const e = contextoAtual()?.escopo;
  if (!e) return;
  const ok = e.tipo === "ESCOLA"
    ? escolaId !== null && escolaId === e.escolaId
    : escolaId !== null && e.escolaIds.includes(escolaId);
  if (!ok) throw new PermissionError("PERM_007", { detalhe: "registro da rede ou de outra escola" });
}

/** Planos em rascunho só aparecem para quem os escreveu. */
const visivelPara = (u: Usuario): Prisma.PlanoAulaWhereInput => ({
  OR: [{ autorId: u.id }, { status: { not: "RASCUNHO" } }],
});

async function etapaDaSerie(serieId: string) {
  const serie = await prisma.serie.findUnique({
    where: { id: serieId },
    select: { id: true, nivel: { select: { etapaId: true } } },
  });
  if (!serie) throw new NotFoundError("NF_001", { recurso: "série" });
  return serie.nivel.etapaId;
}

async function garantirDisciplinaDaEtapa(disciplinaId: string, etapaId: string) {
  const d = await prisma.disciplina.findUnique({ where: { id: disciplinaId }, select: { etapaId: true } });
  if (!d) throw new NotFoundError("NF_001", { recurso: "disciplina" });
  if (d.etapaId !== etapaId) throw new BusinessError("BIZ_040");
}

const incluirConteudo = {
  serie: { select: { id: true, nome: true } },
  disciplina: { select: { id: true, nome: true } },
  escola: { select: { id: true, nome: true } },
  _count: { select: { planosAula: true } },
} satisfies Prisma.ConteudoProgramaticoInclude;

const incluirAtividade = {
  disciplina: { select: { id: true, nome: true } },
  serie: { select: { id: true, nome: true } },
  escola: { select: { id: true, nome: true } },
  autor: { select: { id: true, nome: true } },
  _count: { select: { planos: true } },
} satisfies Prisma.AtividadePedagogicaInclude;

const incluirPlanoLista = {
  turma: { select: { id: true, nome: true, anoLetivo: true, escola: { select: { id: true, nome: true } } } },
  disciplina: { select: { id: true, nome: true } },
  autor: { select: { id: true, nome: true } },
  revisadoPor: { select: { id: true, nome: true } },
  conteudoProgramatico: { select: { id: true, titulo: true } },
  _count: { select: { atividades: true } },
} satisfies Prisma.PlanoAulaInclude;

const incluirPlano = {
  ...incluirPlanoLista,
  atividades: {
    select: { atividade: { select: { id: true, titulo: true, tipo: true, descricao: true, habilidadesBncc: true } } },
  },
} satisfies Prisma.PlanoAulaInclude;

type PlanoCompleto = Prisma.PlanoAulaGetPayload<{ include: typeof incluirPlano }>;
const formatarPlano = (p: PlanoCompleto) => {
  const { atividades, ...resto } = p;
  return { ...resto, atividades: atividades.map((a) => a.atividade) };
};

/**
 * Módulo 2 — Planejamento pedagógico: conteúdo programático (rede/escola),
 * banco de atividades e planos de aula com revisão da coordenação.
 */
export class PlanejamentoService {
  // ==================== Conteúdo programático ====================

  async listarConteudos(f: {
    anoLetivo?: number; bimestre?: number; serieId?: string; disciplinaId?: string;
    escolaId?: string; incluirRede?: boolean; ativo?: boolean;
  }) {
    const where: Prisma.ConteudoProgramaticoWhereInput = {
      anoLetivo: f.anoLetivo,
      bimestre: f.bimestre,
      serieId: f.serieId,
      disciplinaId: f.disciplinaId,
      ativo: f.ativo ?? true,
    };
    if (f.escolaId) {
      where.OR = f.incluirRede === false ? [{ escolaId: f.escolaId }] : [{ escolaId: f.escolaId }, { escolaId: null }];
    }
    return prisma.conteudoProgramatico.findMany({
      where,
      include: incluirConteudo,
      orderBy: [{ bimestre: "asc" }, { ordem: "asc" }, { titulo: "asc" }],
      take: 500,
    });
  }

  async criarConteudo(d: CreateConteudoInput) {
    await garantirDisciplinaDaEtapa(d.disciplinaId, await etapaDaSerie(d.serieId));
    // escolaId ausente = rede: a extensão de escopo recusa para quem é da escola
    return prisma.conteudoProgramatico.create({ data: { ...d, escolaId: d.escolaId ?? null }, include: incluirConteudo });
  }

  async atualizarConteudo(id: string, d: UpdateConteudoInput) {
    const atual = await prisma.conteudoProgramatico.findUnique({ where: { id }, select: { escolaId: true } });
    if (!atual) throw new NotFoundError("NF_001", { recurso: "conteúdo programático" });
    garantirEditavel(atual.escolaId);
    return prisma.conteudoProgramatico.update({ where: { id }, data: d, include: incluirConteudo });
  }

  async removerConteudo(id: string) {
    const atual = await prisma.conteudoProgramatico.findUnique({
      where: { id },
      select: { escolaId: true, _count: { select: { planosAula: true } } },
    });
    if (!atual) throw new NotFoundError("NF_001", { recurso: "conteúdo programático" });
    garantirEditavel(atual.escolaId);
    if (atual._count.planosAula > 0) throw new BusinessError("BIZ_042");
    await prisma.conteudoProgramatico.delete({ where: { id } });
    return { ok: true };
  }

  // ==================== Banco de atividades ====================

  async listarAtividades(
    f: {
      disciplinaId?: string; serieId?: string; escolaId?: string; tipo?: string; busca?: string;
      habilidade?: string; minhas?: boolean; ativo?: boolean;
    },
    u: Usuario
  ) {
    const and: Prisma.AtividadePedagogicaWhereInput[] = [{ ativo: f.ativo ?? true }];
    if (f.disciplinaId) and.push({ disciplinaId: f.disciplinaId });
    if (f.tipo) and.push({ tipo: f.tipo });
    if (f.serieId) and.push({ OR: [{ serieId: f.serieId }, { serieId: null }] });
    if (f.escolaId) and.push({ OR: [{ escolaId: f.escolaId }, { escolaId: null }] });
    if (f.habilidade) and.push({ habilidadesBncc: { has: f.habilidade } });
    if (f.minhas) and.push({ autorId: u.id });
    if (f.busca) {
      and.push({
        OR: [
          { titulo: { contains: f.busca, mode: "insensitive" } },
          { descricao: { contains: f.busca, mode: "insensitive" } },
        ],
      });
    }
    return prisma.atividadePedagogica.findMany({
      where: { AND: and },
      include: incluirAtividade,
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
  }

  async buscarAtividade(id: string) {
    const a = await prisma.atividadePedagogica.findUnique({ where: { id }, include: incluirAtividade });
    if (!a) throw new NotFoundError("NF_001", { recurso: "atividade" });
    return a;
  }

  async criarAtividade(d: CreateAtividadeInput, u: Usuario) {
    if (d.serieId) await garantirDisciplinaDaEtapa(d.disciplinaId, await etapaDaSerie(d.serieId));
    else if (!(await prisma.disciplina.findUnique({ where: { id: d.disciplinaId }, select: { id: true } }))) {
      throw new NotFoundError("NF_001", { recurso: "disciplina" });
    }
    const escolaId = d.escolaId ?? null;
    // Professor: a extensão de escopo não confere escolaId → confere aqui
    if (contextoAtual()?.escopo?.tipo === "PROFESSOR") garantirEditavel(escolaId);
    return prisma.atividadePedagogica.create({
      data: { ...d, escolaId, autorId: u.id },
      include: incluirAtividade,
    });
  }

  private async atividadeParaAlterar(id: string, u: Usuario) {
    const atual = await prisma.atividadePedagogica.findUnique({
      where: { id },
      select: { escolaId: true, autorId: true, disciplinaId: true, _count: { select: { planos: true } } },
    });
    if (!atual) throw new NotFoundError("NF_001", { recurso: "atividade" });
    // Professor altera só as próprias; direção/coordenação, as da escola; gestão, todas
    if (u.role === "PROFESSOR" && atual.autorId !== u.id) throw new PermissionError("PERM_004");
    garantirEditavel(atual.escolaId);
    return atual;
  }

  async atualizarAtividade(id: string, d: UpdateAtividadeInput, u: Usuario) {
    const atual = await this.atividadeParaAlterar(id, u);
    if (d.serieId) await garantirDisciplinaDaEtapa(atual.disciplinaId, await etapaDaSerie(d.serieId));
    return prisma.atividadePedagogica.update({ where: { id }, data: d, include: incluirAtividade });
  }

  async removerAtividade(id: string, u: Usuario) {
    const atual = await this.atividadeParaAlterar(id, u);
    if (atual._count.planos > 0) throw new BusinessError("BIZ_042");
    await prisma.atividadePedagogica.delete({ where: { id } });
    return { ok: true };
  }

  // ==================== Planos de aula ====================

  async listarPlanos(q: ListarPlanosQuery, u: Usuario) {
    const and: Prisma.PlanoAulaWhereInput[] = [visivelPara(u)];
    if (q.turmaId) and.push({ turmaId: q.turmaId });
    if (q.disciplinaId) and.push({ disciplinaId: q.disciplinaId });
    if (q.escolaId) and.push({ turma: { escolaId: q.escolaId } });
    if (q.bimestre) and.push({ bimestre: q.bimestre });
    if (q.status) and.push({ status: q.status });
    if (q.meus) and.push({ autorId: u.id });
    if (q.de || q.ate) and.push({ dataAula: { gte: q.de, lte: q.ate } });
    const where: Prisma.PlanoAulaWhereInput = { AND: and };
    const [data, total] = await Promise.all([
      prisma.planoAula.findMany({
        where,
        include: incluirPlanoLista,
        orderBy: [{ dataAula: "desc" }, { createdAt: "desc" }],
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      prisma.planoAula.count({ where }),
    ]);
    return { data, pagination: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) } };
  }

  async buscarPlano(id: string, u: Usuario) {
    const p = await prisma.planoAula.findFirst({ where: { AND: [{ id }, visivelPara(u)] }, include: incluirPlano });
    if (!p) throw new NotFoundError("NF_001", { recurso: "plano de aula" });
    return formatarPlano(p);
  }

  /** Confere conteúdo programático e atividades contra a turma/disciplina do plano. */
  private async validarVinculos(
    turma: { serieId: string; escolaId: string; anoLetivo: number },
    disciplinaId: string,
    conteudoId: string | null | undefined,
    atividades: string[] | undefined
  ) {
    if (conteudoId) {
      const c = await prisma.conteudoProgramatico.findUnique({ where: { id: conteudoId } });
      if (!c) throw new NotFoundError("NF_001", { recurso: "conteúdo programático" });
      const confere =
        c.serieId === turma.serieId && c.disciplinaId === disciplinaId && c.anoLetivo === turma.anoLetivo &&
        (c.escolaId === null || c.escolaId === turma.escolaId);
      if (!confere) throw new BusinessError("BIZ_041");
    }
    if (atividades?.length) {
      const ids = [...new Set(atividades)];
      const achadas = await prisma.atividadePedagogica.count({ where: { id: { in: ids }, ativo: true } });
      if (achadas !== ids.length) throw new NotFoundError("NF_001", { recurso: "atividade" });
    }
  }

  private async turmaDoPlano(turmaId: string) {
    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      select: { id: true, serieId: true, escolaId: true, anoLetivo: true, serie: { select: { nivel: { select: { etapaId: true } } } } },
    });
    if (!turma) throw new NotFoundError("NF_005");
    return turma;
  }

  async criarPlano(d: CreatePlanoInput, u: Usuario) {
    const turma = await this.turmaDoPlano(d.turmaId);
    await garantirDisciplinaDaEtapa(d.disciplinaId, turma.serie.nivel.etapaId);
    await this.validarVinculos(turma, d.disciplinaId, d.conteudoProgramaticoId, d.atividades);
    const { atividades, ...campos } = d;
    const p = await prisma.planoAula.create({
      data: {
        ...campos,
        autorId: u.id,
        status: "RASCUNHO",
        atividades: { create: [...new Set(atividades)].map((atividadeId) => ({ atividadeId })) },
      },
      include: incluirPlano,
    });
    return formatarPlano(p);
  }

  /** Só o autor altera, e só enquanto rascunho ou devolvido. */
  private async planoDoAutor(id: string, u: Usuario) {
    const p = await prisma.planoAula.findFirst({
      where: { AND: [{ id }, visivelPara(u)] },
      select: { id: true, autorId: true, status: true, turmaId: true, disciplinaId: true },
    });
    if (!p) throw new NotFoundError("NF_001", { recurso: "plano de aula" });
    if (p.autorId !== u.id) throw new PermissionError("PERM_004");
    return p;
  }

  async atualizarPlano(id: string, d: UpdatePlanoInput, u: Usuario) {
    const atual = await this.planoDoAutor(id, u);
    if (!EDITAVEL.includes(atual.status)) throw new BusinessError("BIZ_039", { status: atual.status });
    const turma = await this.turmaDoPlano(atual.turmaId);
    await this.validarVinculos(turma, atual.disciplinaId, d.conteudoProgramaticoId, d.atividades);
    const { atividades, ...campos } = d;
    const p = await prisma.$transaction(async (tx) => {
      if (atividades) {
        await tx.planoAulaAtividade.deleteMany({ where: { planoId: id } });
        await tx.planoAulaAtividade.createMany({
          data: [...new Set(atividades)].map((atividadeId) => ({ planoId: id, atividadeId })),
        });
      }
      return tx.planoAula.update({ where: { id }, data: campos, include: incluirPlano });
    });
    return formatarPlano(p);
  }

  async removerPlano(id: string, u: Usuario) {
    if (ehGestao(u)) {
      const existe = await prisma.planoAula.findFirst({ where: { AND: [{ id }, visivelPara(u)] }, select: { id: true } });
      if (!existe) throw new NotFoundError("NF_001", { recurso: "plano de aula" });
    } else {
      const atual = await this.planoDoAutor(id, u);
      if (!EDITAVEL.includes(atual.status)) throw new BusinessError("BIZ_039", { status: atual.status });
    }
    await prisma.planoAula.delete({ where: { id } });
    return { ok: true };
  }

  async enviarPlano(id: string, u: Usuario) {
    const atual = await this.planoDoAutor(id, u);
    if (!EDITAVEL.includes(atual.status)) throw new BusinessError("BIZ_039", { status: atual.status });
    const p = await prisma.planoAula.update({
      where: { id },
      data: { status: "ENVIADO", enviadoEm: new Date() },
      include: incluirPlano,
    });
    return formatarPlano(p);
  }

  async revisarPlano(id: string, d: RevisarPlanoInput, u: Usuario) {
    if (!COORDENACAO_PEDAGOGICA.includes(u.role)) throw new PermissionError("PERM_002");
    const atual = await prisma.planoAula.findFirst({
      where: { AND: [{ id }, visivelPara(u)] },
      select: { status: true, autorId: true },
    });
    if (!atual) throw new NotFoundError("NF_001", { recurso: "plano de aula" });
    if (atual.status !== "ENVIADO") throw new BusinessError("BIZ_039", { status: atual.status });
    if (atual.autorId === u.id) throw new BusinessError("BIZ_043");
    if (d.decisao === "DEVOLVIDO" && !d.parecer) throw new BusinessError("BIZ_044");
    const p = await prisma.planoAula.update({
      where: { id },
      data: { status: d.decisao, parecer: d.parecer ?? null, revisadoPorId: u.id, revisadoEm: new Date() },
      include: incluirPlano,
    });
    return formatarPlano(p);
  }

  // ==================== Cobertura do conteúdo programático ====================

  /**
   * Para a turma: cada conteúdo previsto (rede + escola) com os planos que o
   * cobrem. Situação: APROVADO (algum plano aprovado), PLANEJADO (enviado ou
   * devolvido), EM_RASCUNHO (só rascunho do próprio usuário) ou SEM_PLANO.
   */
  async cobertura(q: { turmaId: string; disciplinaId?: string; bimestre?: number }, u: Usuario) {
    const turma = await prisma.turma.findUnique({
      where: { id: q.turmaId },
      select: {
        id: true, nome: true, anoLetivo: true, serieId: true, escolaId: true,
        serie: { select: { nome: true, nivel: { select: { etapaId: true } } } },
      },
    });
    if (!turma) throw new NotFoundError("NF_005");
    const disciplinas = await prisma.disciplina.findMany({
      where: { etapaId: turma.serie.nivel.etapaId, ativo: true, ...(q.disciplinaId ? { id: q.disciplinaId } : {}) },
      select: { id: true, nome: true },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    });
    const idsDisc = disciplinas.map((d) => d.id);
    const [conteudos, planos] = await Promise.all([
      prisma.conteudoProgramatico.findMany({
        where: {
          anoLetivo: turma.anoLetivo, serieId: turma.serieId, disciplinaId: { in: idsDisc },
          bimestre: q.bimestre, ativo: true,
          OR: [{ escolaId: null }, { escolaId: turma.escolaId }],
        },
        select: { id: true, titulo: true, bimestre: true, disciplinaId: true, habilidadesBncc: true, escolaId: true },
        orderBy: [{ bimestre: "asc" }, { ordem: "asc" }, { titulo: "asc" }],
      }),
      prisma.planoAula.findMany({
        where: { AND: [{ turmaId: turma.id, disciplinaId: { in: idsDisc }, bimestre: q.bimestre }, visivelPara(u)] },
        select: { id: true, titulo: true, dataAula: true, status: true, disciplinaId: true, conteudoProgramaticoId: true },
        orderBy: { dataAula: "asc" },
      }),
    ]);

    const situacao = (ps: typeof planos) =>
      ps.some((p) => p.status === "APROVADO") ? "APROVADO"
        : ps.some((p) => p.status === "ENVIADO" || p.status === "DEVOLVIDO") ? "PLANEJADO"
          : ps.length ? "EM_RASCUNHO" : "SEM_PLANO";

    const porDisciplina = disciplinas.map((d) => {
      const itens = conteudos
        .filter((c) => c.disciplinaId === d.id)
        .map((c) => {
          const ps = planos.filter((p) => p.conteudoProgramaticoId === c.id);
          return {
            id: c.id, titulo: c.titulo, bimestre: c.bimestre, habilidadesBncc: c.habilidadesBncc,
            daRede: c.escolaId === null, situacao: situacao(ps),
            planos: ps.map(({ id, titulo, dataAula, status }) => ({ id, titulo, dataAula, status })),
          };
        });
      return {
        disciplinaId: d.id,
        nome: d.nome,
        previstos: itens.length,
        aprovados: itens.filter((i) => i.situacao === "APROVADO").length,
        semPlano: itens.filter((i) => i.situacao === "SEM_PLANO").length,
        planosSemConteudo: planos.filter((p) => p.disciplinaId === d.id && !p.conteudoProgramaticoId).length,
        conteudos: itens,
      };
    });

    return {
      turma: { id: turma.id, nome: turma.nome, anoLetivo: turma.anoLetivo, serie: turma.serie.nome },
      bimestre: q.bimestre ?? null,
      resumo: {
        previstos: porDisciplina.reduce((t, x) => t + x.previstos, 0),
        aprovados: porDisciplina.reduce((t, x) => t + x.aprovados, 0),
        semPlano: porDisciplina.reduce((t, x) => t + x.semPlano, 0),
      },
      disciplinas: porDisciplina,
    };
  }
}

export const planejamentoService = new PlanejamentoService();
