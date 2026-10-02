import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { mediaDasAvaliacoes, mediaDosBimestres } from "../lib/media.js";
import { hojeNaRede } from "../lib/datas.js";
import { configuracaoAvaliacaoService } from "./configuracao-avaliacao.service.js";
import { NotFoundError } from "../errors/index.js";
import { CreateNotaInput, LancarNotasTurmaInput, UpdateNotaInput } from "../schemas/index.js";
import {
  frequenciaService,
  frequenciaAbaixoDoMinimo,
  FREQUENCIA_MINIMA_PADRAO,
} from "./frequencia.service.js";

interface BoletimDisciplina {
  disciplinaId: string;
  disciplinaNome: string;
  disciplinaCodigo: string;
  bimestres: Array<{
    bimestre: number;
    media: number | null;
    avaliacoes: Array<{
      id: string;
      nome: string;
      tipo: string;
      peso: number;
      valorMaximo: number;
      nota: number | null;
    }>;
  }>;
  mediaFinal: number | null;
  situacao: "APROVADO" | "RECUPERACAO" | "REPROVADO" | "EM_CURSO";
}

export interface Boletim {
  matricula: {
    id: string;
    nomeAluno: string;
    numeroMatricula: string;
  };
  turma: {
    id: string;
    nome: string;
    serie: string;
  };
  disciplinas: BoletimDisciplina[];
  frequencia: {
    percentualPresenca: number;
    totalAulas: number;
    presencas: number;
    faltas: number;
    abaixoDoLimite: boolean;
  };
  situacaoGeral: "APROVADO" | "RECUPERACAO" | "REPROVADO" | "EM_CURSO";
}

/** Boletim de todos os alunos ativos de uma turma (GET /api/notas/boletim-turma/:turmaId). */
export interface BoletimTurma {
  turma: { id: string; nome: string; serie: string; anoLetivo: number };
  boletins: Boletim[];
}

type Situacao = "APROVADO" | "RECUPERACAO" | "REPROVADO" | "EM_CURSO";

/** Regra de aprovação da turma (configuração de avaliação vigente; padrão 6,0 / 75% / 4 períodos). */
export interface RegraAprovacao {
  mediaMinima: number;
  frequenciaMinima: number;
  periodos: number;
}

type AvaliacaoComNotas = {
  disciplinaId: string;
  bimestre: number;
  data: Date;
  peso: number;
  valorMaximo: number;
  notas: Array<{ valor: number }>;
};

/** Média do aluno num conjunto de avaliações já filtradas pela nota DELE (notas[0]). */
function mediaDoAluno(avaliacoes: AvaliacaoComNotas[], hoje: Date): number | null {
  if (avaliacoes.length === 0) return null;
  // lib/media: escala 0–10 pelo valorMaximo; realizada sem nota = 0; futura sem nota fica de fora
  return mediaDasAvaliacoes(
    avaliacoes.map((av) => ({
      data: av.data,
      peso: av.peso,
      valorMaximo: av.valorMaximo,
      nota: av.notas[0]?.valor ?? null,
    })),
    hoje
  );
}

/**
 * Situação de UMA disciplina — a mesma conta no boletim e na rota de
 * situação final (antes cada uma tinha a sua regra).
 */
export function determinaSituacao(
  mediaFinal: number | null,
  bimestresComNota: number,
  frequencia: { presencas: number; totalAulas: number },
  regra: RegraAprovacao
): Situacao {
  // Se nem todos os bimestres têm nota, está em curso
  if (bimestresComNota < regra.periodos) return "EM_CURSO";
  if (mediaFinal === null) return "EM_CURSO";

  // Reprovado por frequência (razão exata: 74,5% não vira 75%)
  if (frequenciaAbaixoDoMinimo(frequencia.presencas, frequencia.totalAulas, regra.frequenciaMinima)) {
    return "REPROVADO";
  }

  // Aprovado (média mínima da configuração de avaliação vigente; padrão 6,0)
  if (mediaFinal >= regra.mediaMinima) return "APROVADO";

  // Recuperação
  if (mediaFinal >= 3.0) return "RECUPERACAO";

  // Reprovado por nota
  return "REPROVADO";
}

/** Situação geral: EM_CURSO > REPROVADO > RECUPERACAO > APROVADO. */
function situacaoGeralDe(situacoes: Situacao[]): Situacao {
  if (situacoes.some((s) => s === "EM_CURSO")) return "EM_CURSO";
  if (situacoes.some((s) => s === "REPROVADO")) return "REPROVADO";
  if (situacoes.some((s) => s === "RECUPERACAO")) return "RECUPERACAO";
  return "APROVADO";
}

/** Turma com série/etapa, como o boletim a carrega. */
type TurmaDoBoletim = {
  id: string;
  nome: string;
  anoLetivo: number;
  serie: { nome: string };
};

/** O que é comum a todos os alunos de uma turma no boletim. */
interface ContextoBoletim {
  turma: TurmaDoBoletim;
  disciplinas: Array<{ id: string; nome: string; codigo: string }>;
  regra: RegraAprovacao;
}

type AvaliacaoDoBoletim = AvaliacaoComNotas & {
  id: string;
  nome: string;
  tipo: string;
};

type EstatisticasDoBoletim = {
  percentualPresenca: number;
  totalAulas: number;
  presencas: number;
  faltas: number;
  faltasJustificadas: number;
};

/**
 * Monta o boletim de UM aluno a partir de dados já carregados — a única
 * implementação da conta, usada pelo boletim individual e pelo da turma.
 * `avaliacoes`: todas as da turma, com `notas` contendo só a nota DESTE
 * aluno (no máximo uma por avaliação).
 */
function montarBoletim(
  matricula: { id: string; nomeAluno: string; numeroMatricula: string },
  { turma, disciplinas, regra }: ContextoBoletim,
  avaliacoes: AvaliacaoDoBoletim[],
  frequencia: EstatisticasDoBoletim,
  hoje: Date
): Boletim {
  const porDisciplinaBimestre = new Map<string, AvaliacaoDoBoletim[]>();
  for (const av of avaliacoes) {
    const chave = `${av.disciplinaId}:${av.bimestre}`;
    const lista = porDisciplinaBimestre.get(chave);
    if (lista) lista.push(av);
    else porDisciplinaBimestre.set(chave, [av]);
  }

  const boletimDisciplinas: BoletimDisciplina[] = [];

  for (const disciplina of disciplinas) {
    const bimestres: BoletimDisciplina["bimestres"] = [];
    const medias: number[] = [];
    let bimestresComNota = 0;

    for (let bim = 1; bim <= 4; bim++) {
      const doBimestre = porDisciplinaBimestre.get(`${disciplina.id}:${bim}`) ?? [];

      const avaliacoesComNotas = doBimestre.map((av) => ({
        id: av.id,
        nome: av.nome,
        tipo: av.tipo,
        peso: av.peso,
        valorMaximo: av.valorMaximo,
        nota: av.notas[0]?.valor ?? null,
      }));

      const media = mediaDoAluno(doBimestre, hoje);
      if (media !== null) {
        bimestresComNota++;
        medias.push(media);
      }

      bimestres.push({
        bimestre: bim,
        media,
        avaliacoes: avaliacoesComNotas,
      });
    }

    const mediaFinal = mediaDosBimestres(medias);

    boletimDisciplinas.push({
      disciplinaId: disciplina.id,
      disciplinaNome: disciplina.nome,
      disciplinaCodigo: disciplina.codigo,
      bimestres,
      mediaFinal,
      situacao: determinaSituacao(mediaFinal, bimestresComNota, frequencia, regra),
    });
  }

  return {
    matricula: {
      id: matricula.id,
      nomeAluno: matricula.nomeAluno,
      numeroMatricula: matricula.numeroMatricula,
    },
    turma: {
      id: turma.id,
      nome: turma.nome,
      serie: turma.serie.nome,
    },
    disciplinas: boletimDisciplinas,
    frequencia: {
      percentualPresenca: frequencia.percentualPresenca,
      totalAulas: frequencia.totalAulas,
      presencas: frequencia.presencas,
      faltas: frequencia.faltas + frequencia.faltasJustificadas,
      // Mesmo limite da situação (configuração da rede), razão exata
      abaixoDoLimite: frequenciaAbaixoDoMinimo(
        frequencia.presencas,
        frequencia.totalAulas,
        regra.frequenciaMinima
      ),
    },
    situacaoGeral: situacaoGeralDe(boletimDisciplinas.map((d) => d.situacao)),
  };
}

function resumoDaTurma(turma: TurmaDoBoletim): BoletimTurma["turma"] {
  return { id: turma.id, nome: turma.nome, serie: turma.serie.nome, anoLetivo: turma.anoLetivo };
}

export class NotaService {
  async findById(id: string) {
    return prisma.nota.findUnique({
      where: { id },
      include: {
        avaliacao: {
          include: {
            turma: {
              select: { id: true, nome: true, serie: { select: { nome: true } } },
            },
            disciplina: { select: { id: true, nome: true, codigo: true } },
          },
        },
        matricula: {
          select: { id: true, nomeAluno: true, numeroMatricula: true },
        },
      },
    });
  }

  async findAll(filters?: {
    turmaId?: string;
    disciplina?: string;
    matriculaId?: string;
    bimestre?: number;
  }) {
    const where: Prisma.NotaWhereInput = {};

    if (filters?.turmaId) where.turmaId = filters.turmaId;
    if (filters?.disciplina) where.disciplina = filters.disciplina;
    if (filters?.matriculaId) where.matriculaId = filters.matriculaId;
    if (filters?.bimestre) where.bimestre = filters.bimestre;

    return prisma.nota.findMany({
      where,
      include: {
        avaliacao: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            peso: true,
            valorMaximo: true,
          },
        },
        matricula: {
          select: { id: true, nomeAluno: true, numeroMatricula: true },
        },
      },
      orderBy: [
        { disciplina: "asc" },
        { bimestre: "asc" },
        { createdAt: "asc" },
      ],
    });
  }

  async findAllPaginated(
    filters: {
      turmaId?: string;
      disciplina?: string;
      matriculaId?: string;
      bimestre?: number;
    },
    pagination: { page: number; limit: number }
  ) {
    const skip = (pagination.page - 1) * pagination.limit;
    const where: Prisma.NotaWhereInput = {};

    if (filters?.turmaId) where.turmaId = filters.turmaId;
    if (filters?.disciplina) where.disciplina = filters.disciplina;
    if (filters?.matriculaId) where.matriculaId = filters.matriculaId;
    if (filters?.bimestre) where.bimestre = filters.bimestre;

    const include = {
      avaliacao: {
        select: {
          id: true,
          nome: true,
          tipo: true,
          peso: true,
          valorMaximo: true,
        },
      },
      matricula: {
        select: { id: true, nomeAluno: true, numeroMatricula: true },
      },
    };

    const [data, total] = await Promise.all([
      prisma.nota.findMany({
        where,
        include,
        orderBy: [
          { disciplina: "asc" },
          { bimestre: "asc" },
          { createdAt: "asc" },
        ],
        skip,
        take: pagination.limit,
      }),
      prisma.nota.count({ where }),
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

  async create(data: CreateNotaInput) {
    // Verifica se matrícula existe e pertence à turma
    const matricula = await prisma.matricula.findUnique({
      where: { id: data.matriculaId },
      include: { turma: true },
    });

    if (!matricula) {
      throw new NotFoundError("NF_004");
    }

    if (matricula.turmaId !== data.turmaId) {
      throw new Error("Matrícula não pertence à turma especificada");
    }

    // Cria a nota
    return prisma.nota.create({
      data: {
        matriculaId: data.matriculaId,
        turmaId: data.turmaId,
        disciplina: data.disciplina,
        bimestre: data.bimestre,
        avaliacaoId: data.avaliacaoId ?? undefined,
        valor: data.valor,
        observacao: data.observacao,
      },
      include: {
        avaliacao: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            peso: true,
            valorMaximo: true,
          },
        },
        matricula: {
          select: { id: true, nomeAluno: true, numeroMatricula: true },
        },
      },
    });
  }

  /**
   * Lança notas em lote para uma avaliação.
   * Faz upsert: cria se não existe, atualiza se já existe.
   */
  async lancarNotasTurma(data: LancarNotasTurmaInput) {
    // Verifica se avaliação existe
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: data.avaliacaoId },
      include: {
        turma: { include: { matriculas: { where: { status: "ATIVA" } } } },
        disciplina: true,
      },
    });

    if (!avaliacao) {
      throw new NotFoundError("NF_010");
    }

    // Valida que todas as matrículas pertencem à turma
    const matriculasIds = avaliacao.turma.matriculas.map((m) => m.id);
    for (const nota of data.notas) {
      if (!matriculasIds.includes(nota.matriculaId)) {
        throw new Error(
          `Matrícula ${nota.matriculaId} não pertence à turma desta avaliação`
        );
      }
      if (nota.valor > avaliacao.valorMaximo) {
        throw new Error(
          `Nota ${nota.valor} excede o valor máximo ${avaliacao.valorMaximo}`
        );
      }
    }

    // Upsert em transação
    const notas = await prisma.$transaction(
      data.notas.map((nota) =>
        prisma.nota.upsert({
          where: {
            avaliacaoId_matriculaId: {
              avaliacaoId: data.avaliacaoId,
              matriculaId: nota.matriculaId,
            },
          },
          update: {
            valor: nota.valor,
            observacao: nota.observacao,
          },
          create: {
            avaliacaoId: data.avaliacaoId,
            matriculaId: nota.matriculaId,
            turmaId: avaliacao.turmaId,
            disciplina: avaliacao.disciplina.nome,
            bimestre: avaliacao.bimestre,
            valor: nota.valor,
            observacao: nota.observacao,
          },
          include: {
            matricula: {
              select: { id: true, nomeAluno: true, numeroMatricula: true },
            },
          },
        })
      )
    );

    return {
      message: `Notas lançadas para ${notas.length} aluno(s)`,
      notas,
    };
  }

  async update(id: string, data: UpdateNotaInput) {
    const nota = await prisma.nota.findUnique({ where: { id } });
    if (!nota) {
      throw new NotFoundError("NF_011");
    }

    if (data.valor !== undefined && nota.avaliacaoId) {
      const avaliacao = await prisma.avaliacao.findUnique({
        where: { id: nota.avaliacaoId },
      });
      if (avaliacao && data.valor > avaliacao.valorMaximo) {
        throw new Error(
          `Nota ${data.valor} excede o valor máximo ${avaliacao.valorMaximo}`
        );
      }
    }

    return prisma.nota.update({
      where: { id },
      data,
      include: {
        avaliacao: {
          include: {
            disciplina: { select: { id: true, nome: true } },
          },
        },
        matricula: {
          select: { id: true, nomeAluno: true, numeroMatricula: true },
        },
      },
    });
  }

  async delete(id: string) {
    const nota = await prisma.nota.findUnique({ where: { id } });
    if (!nota) {
      throw new NotFoundError("NF_011");
    }
    return prisma.nota.delete({ where: { id } });
  }

  /**
   * Calcula média ponderada de um aluno em uma disciplina/turma/bimestre.
   * Fórmula: sum(nota * peso) / sum(peso) — avaliação já realizada sem nota
   * do aluno conta como 0 (lib/media.notasParaMedia).
   */
  async calcularMedia(
    matriculaId: string,
    turmaId: string,
    disciplinaId: string,
    bimestre: number,
    hoje: Date = hojeNaRede()
  ): Promise<number | null> {
    const avaliacoes = await prisma.avaliacao.findMany({
      where: { turmaId, disciplinaId, bimestre },
      include: {
        notas: {
          where: { matriculaId },
        },
      },
    });
    return mediaDoAluno(avaliacoes, hoje);
  }

  /** Médias por bimestre (1–4) de um aluno numa disciplina, numa consulta só. */
  private async mediasPorBimestre(
    matriculaId: string,
    turmaId: string,
    disciplinaId: string,
    hoje: Date
  ): Promise<Array<number | null>> {
    const avaliacoes = await prisma.avaliacao.findMany({
      where: { turmaId, disciplinaId },
      include: { notas: { where: { matriculaId } } },
    });
    return [1, 2, 3, 4].map((bim) =>
      mediaDoAluno(avaliacoes.filter((av) => av.bimestre === bim), hoje)
    );
  }

  /**
   * Calcula média final (média dos 4 bimestres).
   */
  async calcularMediaFinal(
    matriculaId: string,
    turmaId: string,
    disciplinaId: string,
    hoje: Date = hojeNaRede()
  ): Promise<number | null> {
    return mediaDosBimestres(
      await this.mediasPorBimestre(matriculaId, turmaId, disciplinaId, hoje)
    );
  }

  /** Regra de aprovação vigente para a turma (configuração de avaliação da rede). */
  async regraDaTurma(turma: {
    anoLetivo: number;
    escolaId: string;
    etapaId: string;
  }): Promise<RegraAprovacao> {
    const cfg = await configuracaoAvaliacaoService.findByAnoLetivo(
      turma.anoLetivo,
      turma.escolaId,
      turma.etapaId
    );
    return {
      mediaMinima: cfg?.mediaMinima ?? 6.0,
      frequenciaMinima: cfg?.percentualFrequenciaMinima ?? FREQUENCIA_MINIMA_PADRAO,
      periodos: Math.min(cfg?.numeroPeriodos ?? 4, 4),
    };
  }

  /**
   * Turma, disciplinas da etapa e regra de aprovação — o "contexto" comum ao
   * boletim individual e ao boletim da turma (lote).
   */
  private async contextoDoBoletim(turmaId: string) {
    // Busca turma com série (hierarquia atual: Serie → Nível → Etapa).
    // Com escopo (professor/escola), a extensão do Prisma devolve null para
    // turma fora dele → NF_005 (404).
    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      include: {
        serie: {
          select: {
            nome: true,
            nivel: { select: { etapaId: true } },
          },
        },
      },
    });

    if (!turma) {
      throw new NotFoundError("NF_005");
    }

    const [disciplinas, regra] = await Promise.all([
      // Disciplinas da etapa
      prisma.disciplina.findMany({
        where: { etapaId: turma.serie.nivel.etapaId, ativo: true },
        orderBy: [{ ordem: "asc" }, { nome: "asc" }],
      }),
      // Regras da configuração de avaliação vigente (antes fixas em 6,0 e 75%)
      this.regraDaTurma({
        anoLetivo: turma.anoLetivo,
        escolaId: turma.escolaId,
        etapaId: turma.serie.nivel.etapaId,
      }),
    ]);

    return { turma, disciplinas, regra };
  }

  /**
   * TODAS as avaliações da turma com as notas das matrículas pedidas, numa
   * consulta só (sem N+1 de disciplina × bimestre × aluno). Ordem estável
   * (data, id) para o boletim individual e o da turma saírem iguais.
   */
  private avaliacoesComNotas(turmaId: string, matriculaIds: string[]) {
    return prisma.avaliacao.findMany({
      where: { turmaId },
      include: {
        notas: { where: { matriculaId: { in: matriculaIds } } },
      },
      orderBy: [{ data: "asc" }, { id: "asc" }],
    });
  }

  /**
   * Gera boletim completo de um aluno.
   */
  async getBoletim(
    matriculaId: string,
    turmaId?: string,
    hoje: Date = hojeNaRede()
  ): Promise<Boletim> {
    // Busca matrícula
    const matricula = await prisma.matricula.findUnique({
      where: { id: matriculaId },
      select: { id: true, nomeAluno: true, numeroMatricula: true, turmaId: true },
    });

    if (!matricula) {
      throw new NotFoundError("NF_004");
    }

    const turmaEfetiva = turmaId || matricula.turmaId;
    if (!turmaEfetiva) {
      throw new Error("Aluno não está vinculado a uma turma");
    }

    const contexto = await this.contextoDoBoletim(turmaEfetiva);
    const [avaliacoes, frequencia] = await Promise.all([
      this.avaliacoesComNotas(turmaEfetiva, [matriculaId]),
      // Frequência geral (uma única vez, usada em todas as disciplinas)
      frequenciaService.calcularEstatisticas(matriculaId, turmaEfetiva),
    ]);

    return montarBoletim(matricula, contexto, avaliacoes, frequencia, hoje);
  }

  /**
   * Boletim de TODOS os alunos ATIVOS da turma (opcionalmente só as
   * matrículas do ano letivo informado), com a MESMA conta do boletim
   * individual (montarBoletim) e um número fixo de consultas, qualquer que
   * seja o tamanho da turma: turma, disciplinas, configuração, matrículas,
   * avaliações+notas e frequências da turma.
   */
  async getBoletimTurma(
    turmaId: string,
    anoLetivo?: number,
    hoje: Date = hojeNaRede()
  ): Promise<BoletimTurma> {
    const contexto = await this.contextoDoBoletim(turmaId);

    const matriculas = await prisma.matricula.findMany({
      // Todas as situações (ATIVA, CONCLUIDA, TRANSFERIDA...): as telas de
      // conselho/recuperação listam a turma inteira, inclusive quem o próprio
      // conselho acabou de concluir. Quem não está no resumo de frequência
      // (só ATIVA) tem a frequência calculada individualmente abaixo.
      where: {
        turmaId,
        ...(anoLetivo !== undefined && { anoLetivo }),
      },
      select: { id: true, nomeAluno: true, numeroMatricula: true },
      orderBy: [{ nomeAluno: "asc" }, { id: "asc" }],
    });

    if (matriculas.length === 0) {
      return { turma: resumoDaTurma(contexto.turma), boletins: [] };
    }

    const ids = matriculas.map((m) => m.id);
    const [avaliacoes, resumoFrequencia] = await Promise.all([
      this.avaliacoesComNotas(turmaId, ids),
      // Mesmas estatísticas de frequenciaService.calcularEstatisticas, para a
      // turma inteira em uma consulta
      frequenciaService.getResumoTurma(turmaId),
    ]);
    const frequenciaPorMatricula = new Map(
      resumoFrequencia.map((r) => [r.matricula.id, r.estatisticas])
    );

    const boletins: Boletim[] = [];
    for (const matricula of matriculas) {
      // Avaliações vistas por ESTE aluno: notas[0] = a nota dele (ou nenhuma),
      // exatamente como na consulta do boletim individual
      const doAluno = avaliacoes.map((av) => ({
        ...av,
        notas: av.notas.filter((n) => n.matriculaId === matricula.id),
      }));
      // Matrícula que mudou de status entre as duas consultas: busca a dela
      const frequencia =
        frequenciaPorMatricula.get(matricula.id) ??
        (await frequenciaService.calcularEstatisticas(matricula.id, turmaId));
      boletins.push(montarBoletim(matricula, contexto, doAluno, frequencia, hoje));
    }

    return { turma: resumoDaTurma(contexto.turma), boletins };
  }

  /**
   * Retorna situação final em uma disciplina específica — mesma regra
   * (configuração de avaliação da rede) e mesma conta do boletim.
   */
  async getSituacaoFinal(
    matriculaId: string,
    turmaId: string,
    disciplinaId: string,
    hoje: Date = hojeNaRede()
  ) {
    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      select: {
        anoLetivo: true,
        escolaId: true,
        serie: { select: { nivel: { select: { etapaId: true } } } },
      },
    });
    if (!turma) {
      throw new NotFoundError("NF_005");
    }

    const [medias, regra, frequencia] = await Promise.all([
      this.mediasPorBimestre(matriculaId, turmaId, disciplinaId, hoje),
      this.regraDaTurma({
        anoLetivo: turma.anoLetivo,
        escolaId: turma.escolaId,
        etapaId: turma.serie.nivel.etapaId,
      }),
      frequenciaService.calcularEstatisticas(matriculaId, turmaId),
    ]);
    const mediaFinal = mediaDosBimestres(medias);
    const bimestresComNota = medias.filter((m) => m !== null).length;

    const situacao = determinaSituacao(
      mediaFinal,
      bimestresComNota,
      frequencia,
      regra
    );

    return {
      situacao,
      mediaFinal,
      frequencia: frequencia.percentualPresenca,
    };
  }
}

export const notaService = new NotaService();
