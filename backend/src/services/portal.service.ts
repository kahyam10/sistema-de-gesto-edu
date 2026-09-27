import { prisma } from "../lib/prisma.js";
import { BusinessError, NotFoundError, PermissionError } from "../errors/index.js";
import { frequenciaService } from "./frequencia.service.js";
import { notaService } from "./nota.service.js";
import { expandir } from "../lib/recorrencia.js";
import { hojeNaRede } from "../lib/datas.js";

const DIAS_SEMANA = ["DOMINGO", "SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO"] as const;

/**
 * Módulo 3 — Portais por papel.
 * Agregações de leitura para os portais (professor, aluno/responsável,
 * diretor/coordenação e SEMEC). Identidade SEMPRE derivada do userId do
 * JWT (passado pela rota) — nunca de params/query.
 */
export class PortalService {
  // ---------- helpers de identidade ----------

  /** Resolve o profissional vinculado ao usuário logado (BIZ_021 se não houver). */
  private async getProfissionalId(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profissionalId: true },
    });
    if (!user?.profissionalId) throw new BusinessError("BIZ_021");
    return user.profissionalId;
  }

  /** REGRA CRÍTICA do portal do responsável: 403 PERM_005 se a matrícula não está vinculada. */
  private async validarVinculo(userId: string, matriculaId: string) {
    const vinculo = await prisma.matriculaUsuario.findUnique({
      where: { matriculaId_userId: { matriculaId, userId } },
    });
    if (!vinculo || !vinculo.ativo) throw new PermissionError("PERM_005");
    return vinculo;
  }

  // ---------- Portal do Professor ----------

  async resumoProfessor(userId: string) {
    const profissionalId = await this.getProfissionalId(userId);
    // "Hoje" no fuso da rede (Bahia), não no do servidor (containers rodam em
    // UTC: depois das 21h o dia já virava e as aulas do dia sumiam). A
    // frequência é gravada como meia-noite UTC de AAAA-MM-DD, então comparamos
    // com o mesmo instante.
    const hojeISO = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Bahia" }).format(new Date());
    const inicioDia = new Date(hojeISO);
    const diaSemana = DIAS_SEMANA[inicioDia.getUTCDay()];
    const fimDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000 - 1);

    const [profissional, vinculos, aulasHoje] = await Promise.all([
      prisma.profissionalEducacao.findUnique({
        where: { id: profissionalId },
        select: { id: true, nome: true },
      }),
      prisma.turmaProfessor.findMany({
        where: { profissionalId, turma: { ativo: true } },
        include: {
          turma: {
            include: {
              escola: { select: { id: true, nome: true } },
              serie: { select: { id: true, nome: true } },
              _count: { select: { matriculas: { where: { status: "ATIVA" } } } },
            },
          },
        },
      }),
      prisma.gradeHoraria.findMany({
        where: { profissionalId, diaSemana, turma: { ativo: true } },
        include: { turma: { select: { id: true, nome: true } } },
        orderBy: { horaInicio: "asc" },
      }),
    ]);
    if (!profissional) throw new NotFoundError("NF_006");

    // Pendência = turma com aula hoje SEM nenhum registro de frequência na data
    const turmaIdsComAulaHoje = [...new Set(aulasHoje.map((a) => a.turmaId))];
    // Chamadas de hoje com o horário do último registro (para "feita às HH:MM")
    const frequenciasHoje = await prisma.frequencia.groupBy({
      by: ["turmaId"],
      where: { turmaId: { in: turmaIdsComAulaHoje }, data: { gte: inicioDia, lte: fimDia } },
      _max: { updatedAt: true },
    });
    const turmasComFrequencia = new Set(frequenciasHoje.map((f) => f.turmaId));

    return {
      profissional,
      turmas: vinculos.map((v) => ({
        id: v.turma.id,
        nome: v.turma.nome,
        turno: v.turma.turno,
        anoLetivo: v.turma.anoLetivo,
        escola: v.turma.escola,
        serie: v.turma.serie,
        disciplina: v.disciplina,
        tipoVinculo: v.tipo,
        totalAlunosAtivos: v.turma._count.matriculas,
      })),
      aulasHoje: aulasHoje.map((a) => ({
        turmaId: a.turmaId,
        turmaNome: a.turma.nome,
        disciplina: a.disciplina,
        horaInicio: a.horaInicio,
        horaFim: a.horaFim,
      })),
      chamadasRegistradasHoje: frequenciasHoje.map((f) => ({
        turmaId: f.turmaId,
        registradaEm: f._max.updatedAt,
      })),
      frequenciasPendentesHoje: aulasHoje
        .filter((a) => !turmasComFrequencia.has(a.turmaId))
        .map((a) => ({ turmaId: a.turmaId, turmaNome: a.turma.nome }))
        .filter((v, i, arr) => arr.findIndex((x) => x.turmaId === v.turmaId) === i),
    };
  }

  /** Garante que o professor logado leciona na turma (403 caso contrário). */
  private async validarTurmaDoProfessor(userId: string, turmaId: string) {
    const profissionalId = await this.getProfissionalId(userId);
    const vinculo = await prisma.turmaProfessor.findUnique({
      where: { turmaId_profissionalId: { turmaId, profissionalId } },
      select: { id: true },
    });
    if (!vinculo) throw new PermissionError("PERM_006");
    return profissionalId;
  }

  /**
   * Chamada do dia para o app do professor: alunos ATIVOS da turma com o status
   * já lançado na data (ou null). Só campos necessários — nada de CPF, saúde etc.
   */
  async chamadaDaTurma(userId: string, turmaId: string, data: Date) {
    await this.validarTurmaDoProfessor(userId, turmaId);
    const [turma, alunos, registros] = await Promise.all([
      prisma.turma.findUnique({
        where: { id: turmaId },
        select: { id: true, nome: true, turno: true, escola: { select: { nome: true } } },
      }),
      prisma.matricula.findMany({
        where: { turmaId, status: "ATIVA" },
        select: { id: true, nomeAluno: true, numeroMatricula: true },
        orderBy: { nomeAluno: "asc" },
      }),
      prisma.frequencia.findMany({
        where: { turmaId, data },
        select: { matriculaId: true, status: true, justificativa: true, updatedAt: true },
      }),
    ]);
    if (!turma) throw new NotFoundError("NF_005");
    const porAluno = new Map(registros.map((r) => [r.matriculaId, r]));
    const ultimo = registros.reduce<Date | null>(
      (m, r) => (m === null || r.updatedAt > m ? r.updatedAt : m),
      null
    );
    return {
      turma,
      data: data.toISOString().slice(0, 10),
      jaRegistrada: registros.length > 0,
      registradaEm: ultimo,
      alunos: alunos.map((a) => ({
        id: a.id,
        nomeAluno: a.nomeAluno,
        numeroMatricula: a.numeroMatricula,
        status: porAluno.get(a.id)?.status ?? null,
        justificativa: porAluno.get(a.id)?.justificativa ?? null,
      })),
    };
  }

  /** Disciplinas da etapa da turma + avaliações já criadas (para lançar notas). */
  async notasDaTurma(userId: string, turmaId: string) {
    await this.validarTurmaDoProfessor(userId, turmaId);
    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      select: {
        id: true,
        nome: true,
        serie: { select: { nivel: { select: { etapaId: true } } } },
      },
    });
    if (!turma) throw new NotFoundError("NF_005");
    const [disciplinas, avaliacoes, alunos] = await Promise.all([
      prisma.disciplina.findMany({
        where: { etapaId: turma.serie.nivel.etapaId, ativo: true },
        select: { id: true, nome: true, codigo: true },
        orderBy: [{ ordem: "asc" }, { nome: "asc" }],
      }),
      prisma.avaliacao.findMany({
        where: { turmaId },
        select: {
          id: true, nome: true, tipo: true, bimestre: true, data: true,
          valorMaximo: true, peso: true, disciplinaId: true,
          notas: { select: { matriculaId: true, valor: true } },
        },
        orderBy: [{ bimestre: "asc" }, { data: "asc" }],
      }),
      prisma.matricula.findMany({
        where: { turmaId, status: "ATIVA" },
        select: { id: true, nomeAluno: true, numeroMatricula: true },
        orderBy: { nomeAluno: "asc" },
      }),
    ]);
    return { turma: { id: turma.id, nome: turma.nome }, disciplinas, avaliacoes, alunos };
  }

  /**
   * Alunos ativos da turma com o percentual de presença de cada um (mesma
   * fórmula de frequenciaService.calcularEstatisticas: presenças / aulas).
   * Só campos mínimos — nada de CPF, saúde, endereço.
   */
  async alunosDaTurma(userId: string, turmaId: string) {
    await this.validarTurmaDoProfessor(userId, turmaId);
    const [turma, alunos, agrupado] = await Promise.all([
      prisma.turma.findUnique({
        where: { id: turmaId },
        select: {
          id: true, nome: true, turno: true,
          escola: { select: { nome: true } },
          serie: { select: { nome: true } },
        },
      }),
      prisma.matricula.findMany({
        where: { turmaId, status: "ATIVA" },
        select: { id: true, nomeAluno: true, numeroMatricula: true },
        orderBy: { nomeAluno: "asc" },
      }),
      prisma.frequencia.groupBy({
        by: ["matriculaId", "status"],
        where: { turmaId },
        _count: true,
      }),
    ]);
    if (!turma) throw new NotFoundError("NF_005");

    const cont = new Map<string, { total: number; presencas: number }>();
    for (const g of agrupado) {
      const c = cont.get(g.matriculaId) ?? { total: 0, presencas: 0 };
      c.total += g._count;
      if (g.status === "PRESENTE") c.presencas += g._count;
      cont.set(g.matriculaId, c);
    }
    const lista = alunos.map((a) => {
      const c = cont.get(a.id);
      const percentualPresenca = c && c.total > 0 ? Math.round((c.presencas / c.total) * 100) : null;
      return {
        ...a,
        totalAulas: c?.total ?? 0,
        percentualPresenca,
        abaixoDoLimite: percentualPresenca !== null && percentualPresenca < 75,
      };
    });
    const comAulas = lista.filter((a) => a.percentualPresenca !== null);
    return {
      turma,
      frequenciaMedia: comAulas.length
        ? Math.round(comAulas.reduce((s, a) => s + (a.percentualPresenca ?? 0), 0) / comAulas.length)
        : null,
      totalAbaixoDoLimite: lista.filter((a) => a.abaixoDoLimite).length,
      alunos: lista,
    };
  }

  // ---------- Portal do Aluno/Responsável ----------

  async alunosDoUsuario(userId: string) {
    const vinculos = await prisma.matriculaUsuario.findMany({
      where: { userId, ativo: true },
      include: {
        matricula: {
          include: {
            escola: { select: { id: true, nome: true } },
            etapa: { select: { id: true, nome: true } },
            turma: { include: { serie: { select: { id: true, nome: true } } } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return vinculos.map((v) => ({
      vinculoId: v.id,
      tipoVinculo: v.tipoVinculo,
      parentesco: v.parentesco,
      matricula: {
        id: v.matricula.id,
        numeroMatricula: v.matricula.numeroMatricula,
        nomeAluno: v.matricula.nomeAluno,
        anoLetivo: v.matricula.anoLetivo,
        status: v.matricula.status,
        escola: v.matricula.escola,
        etapa: v.matricula.etapa,
        turma: v.matricula.turma
          ? {
              id: v.matricula.turma.id,
              nome: v.matricula.turma.nome,
              turno: v.matricula.turma.turno,
              serie: v.matricula.turma.serie,
            }
          : null,
      },
    }));
  }

  // Tipos anotados via ReturnType porque Boletim/EstatisticasFrequencia não são
  // exportados pelos services de origem (evita TS4053 sem tocar em arquivo alheio).
  async boletimAluno(
    userId: string,
    matriculaId: string
  ): Promise<Awaited<ReturnType<typeof notaService.getBoletim>>> {
    await this.validarVinculo(userId, matriculaId);
    return notaService.getBoletim(matriculaId); // shape Boletim já pronto (nota.service.ts)
  }

  async frequenciaAluno(
    userId: string,
    matriculaId: string,
    dataInicio?: Date,
    dataFim?: Date
  ): Promise<{
    matricula: { id: string; nomeAluno: string; turmaId: string | null };
    estatisticas: Awaited<
      ReturnType<typeof frequenciaService.calcularEstatisticas>
    > | null;
    registros: Awaited<ReturnType<typeof frequenciaService.list>>;
  }> {
    await this.validarVinculo(userId, matriculaId);
    const matricula = await prisma.matricula.findUnique({
      where: { id: matriculaId },
      select: { id: true, nomeAluno: true, turmaId: true },
    });
    if (!matricula) throw new NotFoundError("NF_004");
    if (!matricula.turmaId) return { matricula, estatisticas: null, registros: [] };
    const [estatisticas, registros] = await Promise.all([
      frequenciaService.calcularEstatisticas(matriculaId, matricula.turmaId, dataInicio, dataFim),
      frequenciaService.list({ matriculaId, dataInicio, dataFim }),
    ]);
    return { matricula, estatisticas, registros };
  }

  /**
   * Comunicados relevantes para o responsável: rede toda ou da escola dos seus
   * alunos, destinados a TODOS/PAIS/ALUNOS ou à turma/etapa do aluno — com o
   * status de leitura DESTE usuário.
   */
  async comunicadosDoUsuario(userId: string) {
    const where = await this.whereComunicados(userId);
    if (!where) return [];
    const comunicados = await prisma.comunicado.findMany({
      where,
      select: {
        id: true, titulo: true, mensagem: true, tipo: true, categoria: true,
        dataPublicacao: true, destaque: true, autorNome: true,
        escola: { select: { nome: true } },
        destinatariosLeitura: {
          where: { userId },
          select: { lido: true, confirmado: true },
        },
      },
      orderBy: [{ destaque: "desc" }, { dataPublicacao: "desc" }],
      take: 100,
    });
    return comunicados.map(({ destinatariosLeitura, ...c }) => ({
      ...c,
      lido: destinatariosLeitura[0]?.lido ?? false,
      confirmado: destinatariosLeitura[0]?.confirmado ?? false,
    }));
  }

  // ---------- Portal do Diretor / Coordenação ----------

  /** escolaId já resolvido pela rota (própria escola, ou query p/ GESTAO). */
  async resumoEscola(escolaId: string, anoLetivo: number) {
    const escola = await prisma.escola.findUnique({
      where: { id: escolaId },
      select: { id: true, nome: true, codigo: true },
    });
    if (!escola) throw new NotFoundError("NF_003");

    const [turmas, statusFrequencia, buscasAbertas, acompanhamentos, semTurma, profissionais] =
      await Promise.all([
        prisma.turma.findMany({
          where: { escolaId, ativo: true, anoLetivo },
          include: {
            serie: { select: { nome: true } },
            _count: { select: { matriculas: { where: { status: "ATIVA" } } } },
          },
          orderBy: { nome: "asc" },
        }),
        // Anti-N+1: uma query, agregação em Map por turma (padrão listarAlunosComBaixaFrequencia)
        prisma.frequencia.findMany({
          where: { turma: { escolaId, anoLetivo } },
          select: { turmaId: true, status: true },
        }),
        prisma.buscaAtiva.count({
          where: { escolaId, status: { in: ["ATIVA", "EM_ACOMPANHAMENTO"] } },
        }),
        prisma.acompanhamentoIndividualizado.count({
          where: { escolaId, status: "EM_ANDAMENTO" },
        }),
        prisma.matricula.count({
          where: { escolaId, anoLetivo, status: "ATIVA", turmaId: null },
        }),
        prisma.escolaProfissional.count({ where: { escolaId } }),
      ]);

    // Map turmaId -> { total, presencas } ; percentual = Math.round(presencas/total*100)
    const porTurma = new Map<string, { total: number; presencas: number }>();
    for (const f of statusFrequencia) {
      const acc = porTurma.get(f.turmaId) ?? { total: 0, presencas: 0 };
      acc.total += 1;
      if (f.status === "PRESENTE") acc.presencas += 1;
      porTurma.set(f.turmaId, acc);
    }
    const turmasResumo = turmas.map((t) => {
      const freq = porTurma.get(t.id);
      return {
        turmaId: t.id,
        nome: t.nome,
        turno: t.turno,
        serie: t.serie.nome,
        totalAlunosAtivos: t._count.matriculas,
        percentualFrequencia:
          freq && freq.total > 0 ? Math.round((freq.presencas / freq.total) * 100) : null,
      };
    });
    const totalRegistros = [...porTurma.values()].reduce((a, b) => a + b.total, 0);
    const totalPresencas = [...porTurma.values()].reduce((a, b) => a + b.presencas, 0);

    return {
      escola,
      anoLetivo,
      totais: {
        turmas: turmas.length,
        matriculasAtivas: turmasResumo.reduce((a, t) => a + t.totalAlunosAtivos, 0) + semTurma,
        matriculasSemTurma: semTurma,
        profissionais,
        buscasAtivasAbertas: buscasAbertas,
        acompanhamentosEmAndamento: acompanhamentos,
      },
      frequencia: {
        percentualPresenca:
          totalRegistros > 0 ? Math.round((totalPresencas / totalRegistros) * 100) : null,
        totalRegistros,
        turmasAbaixoDe75: turmasResumo.filter(
          (t) => t.percentualFrequencia !== null && t.percentualFrequencia < 75
        ).length,
      },
      turmas: turmasResumo,
    };
  }

  // ---------- Portal SEMEC (consolidado municipal) ----------

  async resumoSemec(anoLetivo: number) {
    const [escolas, matriculasPorEscola, statusFrequencia, buscasPorEscola, semTurmaPorEscola] =
      await Promise.all([
        prisma.escola.findMany({
          where: { ativo: true },
          select: {
            id: true,
            nome: true,
            codigo: true,
            _count: { select: { turmas: { where: { ativo: true, anoLetivo } } } },
          },
          orderBy: { nome: "asc" },
        }),
        prisma.matricula.groupBy({
          by: ["escolaId"],
          where: { anoLetivo, status: "ATIVA" },
          _count: { _all: true },
        }),
        prisma.frequencia.findMany({
          where: { turma: { anoLetivo } },
          select: { status: true, turma: { select: { escolaId: true } } },
        }),
        prisma.buscaAtiva.groupBy({
          by: ["escolaId"],
          where: { status: { in: ["ATIVA", "EM_ACOMPANHAMENTO"] } },
          _count: { _all: true },
        }),
        prisma.matricula.groupBy({
          by: ["escolaId"],
          where: { anoLetivo, status: "ATIVA", turmaId: null },
          _count: { _all: true },
        }),
      ]);

    // Agregação em memória (Maps por escolaId), mesmo padrão do resumoEscola.
    const matriculasMap = new Map(matriculasPorEscola.map((m) => [m.escolaId, m._count._all]));
    const semTurmaMap = new Map(semTurmaPorEscola.map((m) => [m.escolaId, m._count._all]));
    const buscasMap = new Map<string, number>();
    for (const b of buscasPorEscola) {
      if (b.escolaId) buscasMap.set(b.escolaId, b._count._all);
    }
    const freqPorEscola = new Map<string, { total: number; presencas: number }>();
    for (const f of statusFrequencia) {
      const acc = freqPorEscola.get(f.turma.escolaId) ?? { total: 0, presencas: 0 };
      acc.total += 1;
      if (f.status === "PRESENTE") acc.presencas += 1;
      freqPorEscola.set(f.turma.escolaId, acc);
    }

    const escolasResumo = escolas.map((e) => {
      const freq = freqPorEscola.get(e.id);
      return {
        escolaId: e.id,
        nome: e.nome,
        codigo: e.codigo,
        turmas: e._count.turmas,
        matriculasAtivas: matriculasMap.get(e.id) ?? 0,
        matriculasSemTurma: semTurmaMap.get(e.id) ?? 0,
        percentualFrequencia:
          freq && freq.total > 0 ? Math.round((freq.presencas / freq.total) * 100) : null,
        buscasAtivasAbertas: buscasMap.get(e.id) ?? 0,
      };
    });

    const totalRegistros = [...freqPorEscola.values()].reduce((a, b) => a + b.total, 0);
    const totalPresencas = [...freqPorEscola.values()].reduce((a, b) => a + b.presencas, 0);

    return {
      anoLetivo,
      escolas: escolasResumo,
      totais: {
        escolas: escolasResumo.length,
        turmas: escolasResumo.reduce((a, e) => a + e.turmas, 0),
        matriculasAtivas: escolasResumo.reduce((a, e) => a + e.matriculasAtivas, 0),
        matriculasSemTurma: escolasResumo.reduce((a, e) => a + e.matriculasSemTurma, 0),
        buscasAtivasAbertas: escolasResumo.reduce((a, e) => a + e.buscasAtivasAbertas, 0),
        // Frequência da rede: agregada sobre TODOS os registros do ano letivo
        percentualFrequencia:
          totalRegistros > 0 ? Math.round((totalPresencas / totalRegistros) * 100) : null,
      },
    };
  }

  // ---------- Apps (pais e professores): agenda, cardápio, contatos, dados ----------

  /**
   * De onde vêm as escolas/turmas de um usuário: dos alunos vinculados
   * (responsável) e das turmas em que leciona (professor). Sempre derivado
   * do userId da sessão.
   */
  private async contextoDoUsuario(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nome: true, email: true, role: true, createdAt: true, escolaId: true, profissionalId: true },
    });
    if (!user) throw new NotFoundError("NF_002");
    const [vinculos, aulas] = await Promise.all([
      prisma.matriculaUsuario.findMany({
        where: { userId, ativo: true },
        select: {
          parentesco: true,
          matricula: {
            select: {
              id: true, nomeAluno: true, numeroMatricula: true, escolaId: true, turmaId: true, etapaId: true,
              escola: { select: { nome: true } },
              turma: { select: { nome: true, turno: true } },
            },
          },
        },
      }),
      user.profissionalId
        ? prisma.turmaProfessor.findMany({
            where: { profissionalId: user.profissionalId, turma: { ativo: true } },
            select: { turma: { select: { id: true, nome: true, escolaId: true, escola: { select: { nome: true } } } } },
          })
        : Promise.resolve([]),
    ]);
    const unicos = <T>(xs: Array<T | null | undefined>) => [...new Set(xs.filter((x): x is T => x != null))];
    const escolasAluno = unicos(vinculos.map((v) => v.matricula.escolaId));
    const escolasProfessor = unicos([...aulas.map((a) => a.turma.escolaId), ...(user.profissionalId ? [user.escolaId] : [])]);
    return {
      user,
      vinculos,
      aulas,
      escolasAluno,
      escolasProfessor,
      escolaIds: unicos([...escolasAluno, ...escolasProfessor]),
      turmasAluno: unicos(vinculos.map((v) => v.matricula.turmaId)),
      turmasProfessor: unicos(aulas.map((a) => a.turma.id)),
      etapasAluno: unicos(vinculos.map((v) => v.matricula.etapaId)),
    };
  }

  /**
   * Filtro dos comunicados que o usuário pode ver: como responsável (escolas
   * dos alunos; TODOS/PAIS/ALUNOS, turma ou etapa do aluno) e/ou como
   * professor (escolas das turmas; TODOS/PROFESSORES ou turma que leciona).
   * null = nenhum comunicado. Usado na lista E na trava de leitura/ciência.
   */
  async whereComunicados(userId: string) {
    const c = await this.contextoDoUsuario(userId);
    const agora = new Date();
    const daEscola = (ids: string[]) => ({ OR: [{ escolaId: null }, { escolaId: { in: ids } }] });
    const alvos: Array<Record<string, unknown>> = [];
    if (c.vinculos.length) {
      alvos.push({
        AND: [
          daEscola(c.escolasAluno),
          {
            OR: [
              { destinatarios: { in: ["TODOS", "PAIS", "ALUNOS"] } },
              { destinatarios: "TURMA_ESPECIFICA", turmaId: { in: c.turmasAluno } },
              { destinatarios: "ETAPA_ESPECIFICA", etapaId: { in: c.etapasAluno } },
            ],
          },
        ],
      });
    }
    if (c.user.profissionalId) {
      alvos.push({
        AND: [
          daEscola(c.escolasProfessor),
          {
            OR: [
              { destinatarios: { in: ["TODOS", "PROFESSORES"] } },
              { destinatarios: "TURMA_ESPECIFICA", turmaId: { in: c.turmasProfessor } },
            ],
          },
        ],
      });
    }
    if (!alvos.length) return null;
    return {
      ativo: true,
      dataPublicacao: { lte: agora },
      AND: [{ OR: [{ dataExpiracao: null }, { dataExpiracao: { gte: agora } }] }, { OR: alvos }],
    };
  }

  /** O comunicado está entre os que o usuário pode ver? (trava de marcar-lido/confirmar) */
  async comunicadoVisivelPara(userId: string, comunicadoId: string): Promise<boolean> {
    const where = await this.whereComunicados(userId);
    if (!where) return false;
    const achado = await prisma.comunicado.findFirst({ where: { id: comunicadoId, ...where }, select: { id: true } });
    return !!achado;
  }

  /** Início do dia de hoje na Bahia, como a frequência grava (meia-noite UTC de AAAA-MM-DD). */
  private hojeBahia(): Date {
    return hojeNaRede();
  }

  /**
   * Agenda dos próximos `dias`: eventos do calendário (rede + escolas do
   * usuário; os recorrentes viram uma entrada por ocorrência, até o fim do
   * ano letivo — ver lib/recorrencia.ts), reuniões de pais e
   * plantões pedagógicos (gerais da escola ou das turmas do usuário).
   * Sem ata, pauta interna, encaminhamentos ou lista de profissionais.
   */
  async agenda(userId: string, dias: number) {
    const c = await this.contextoDoUsuario(userId);
    const inicio = this.hojeBahia();
    const fim = new Date(inicio.getTime() + dias * 24 * 60 * 60 * 1000 - 1);
    const turmas = [...new Set([...c.turmasAluno, ...c.turmasProfessor])];
    const daTurma = { OR: [{ turmaId: null }, { turmaId: { in: turmas } }] };
    const doUsuario = { OR: [{ escolaId: null }, { escolaId: { in: c.escolaIds } }] };
    const camposEvento = {
      id: true, titulo: true, descricao: true, dataInicio: true, dataFim: true,
      horaInicio: true, horaFim: true, tipo: true, escola: { select: { nome: true } },
    } as const;
    const [unicos, recorrentes, reunioes, plantoes] = await Promise.all([
      prisma.eventoCalendario.findMany({
        where: {
          recorrente: false,
          AND: [
            { OR: [{ escolaId: null }, { escolaId: { in: c.escolaIds } }] },
            { dataInicio: { lte: fim } },
            { OR: [{ dataFim: { gte: inicio } }, { dataFim: null, dataInicio: { gte: inicio } }] },
          ],
        },
        select: camposEvento,
        orderBy: { dataInicio: "asc" },
        take: 100,
      }),
      prisma.eventoCalendario.findMany({
        where: { recorrente: true, tipoRecorrencia: { not: null }, dataInicio: { lte: fim }, ...doUsuario },
        select: { ...camposEvento, anoLetivoId: true, tipoRecorrencia: true, diaRecorrencia: true },
        take: 50,
      }),
      c.escolaIds.length
        ? prisma.reuniaoPais.findMany({
            where: { escolaId: { in: c.escolaIds }, data: { gte: inicio, lte: fim }, ...daTurma },
            select: {
              id: true, titulo: true, descricao: true, data: true, horario: true, duracao: true,
              local: true, tipo: true, finalidade: true, status: true,
              escola: { select: { nome: true } }, turma: { select: { nome: true } },
            },
            orderBy: { data: "asc" },
            take: 50,
          })
        : Promise.resolve([]),
      c.escolaIds.length
        ? prisma.plantaoPedagogico.findMany({
            where: { ativo: true, escolaId: { in: c.escolaIds }, data: { gte: inicio, lte: fim }, ...daTurma },
            select: {
              id: true, data: true, tipo: true, descricao: true, horarioInicio: true, horarioFim: true,
              local: true, escola: { select: { nome: true } }, turma: { select: { nome: true } },
            },
            orderBy: { data: "asc" },
            take: 50,
          })
        : Promise.resolve([]),
    ]);
    // A repetição para no fim do ano letivo de cada evento
    const fins = recorrentes.length
      ? await prisma.eventoCalendario.findMany({
          where: { tipo: "FIM_ANO_LETIVO", anoLetivoId: { in: [...new Set(recorrentes.map((e) => e.anoLetivoId))] } },
          select: { anoLetivoId: true, dataInicio: true },
        })
      : [];
    const fimDoAno = new Map(fins.map((f) => [f.anoLetivoId, f.dataInicio]));
    const ocorrencias = recorrentes.flatMap(({ anoLetivoId, ...e }) =>
      expandir(e, inicio, fim, fimDoAno.get(anoLetivoId) ?? null).map(({ ocorrenciaDe: _o, diaRecorrencia: _d, ...x }) => x)
    );
    const eventos = [...unicos.map((e) => ({ ...e, tipoRecorrencia: null as string | null })), ...ocorrencias]
      .sort((a, b) => a.dataInicio.getTime() - b.dataInicio.getTime())
      .slice(0, 100);
    return { de: inicio.toISOString().slice(0, 10), ate: fim.toISOString().slice(0, 10), eventos, reunioes, plantoes };
  }

  /** Cardápio da semana (de `de` até +6 dias) das escolas do usuário e da rede. Sem quantidades por aluno. */
  async cardapio(userId: string, de?: Date) {
    const c = await this.contextoDoUsuario(userId);
    const inicio = de ?? this.hojeBahia();
    const fim = new Date(inicio.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
    const refeicoes = c.escolaIds.length
      ? await prisma.cardapio.findMany({
          where: {
            ativo: true,
            data: { gte: inicio, lte: fim },
            OR: [{ escolaId: null }, { escolaId: { in: c.escolaIds } }],
          },
          select: {
            id: true, data: true, turno: true, tipoRefeicao: true, descricao: true,
            observacoesNutricionais: true, escola: { select: { nome: true } },
          },
          orderBy: [{ data: "asc" }, { turno: "asc" }],
          take: 200,
        })
      : [];
    return { de: inicio.toISOString().slice(0, 10), ate: fim.toISOString().slice(0, 10), refeicoes };
  }

  /** Contato institucional das escolas do usuário (telefone, e-mail e endereço DA ESCOLA). */
  async escolasDoUsuario(userId: string) {
    const c = await this.contextoDoUsuario(userId);
    if (!c.escolaIds.length) return [];
    return prisma.escola.findMany({
      where: { id: { in: c.escolaIds }, ativo: true },
      select: { id: true, nome: true, telefone: true, email: true, endereco: true },
      orderBy: { nome: "asc" },
    });
  }

  /** "Meus dados" (transparência LGPD): o que o sistema guarda sobre este usuário e os vínculos. */
  async meusDados(userId: string) {
    const c = await this.contextoDoUsuario(userId);
    const sessoesAtivas = await prisma.sessaoRefresh.count({
      where: { userId, revogadoEm: null, rotacionadoEm: null, familiaExpiraEm: { gt: new Date() } },
    });
    return {
      usuario: { nome: c.user.nome, email: c.user.email, papel: c.user.role, cadastradoEm: c.user.createdAt },
      alunosVinculados: c.vinculos.map((v) => ({
        nomeAluno: v.matricula.nomeAluno,
        numeroMatricula: v.matricula.numeroMatricula,
        parentesco: v.parentesco,
        escola: v.matricula.escola.nome,
        turma: v.matricula.turma?.nome ?? null,
      })),
      turmasQueLeciona: c.aulas.map((a) => ({ turma: a.turma.nome, escola: a.turma.escola.nome })),
      sessoesAtivas,
    };
  }
}

export const portalService = new PortalService();
