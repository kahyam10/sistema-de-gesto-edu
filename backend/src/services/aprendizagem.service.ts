import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../errors/index.js";
import { configuracaoAvaliacaoService } from "./configuracao-avaliacao.service.js";
import { frequenciaAbaixoDoMinimo } from "./frequencia.service.js";
import { mediaDasAvaliacoes } from "../lib/media.js";
import { hojeNaRede } from "../lib/datas.js";
import { NOTA_MINIMA_RECUPERACAO_PADRAO } from "../schemas/index.js";

type Nota = { matriculaId: string; valor: number };
type Av = { id: string; disciplinaId: string; bimestre: number; data: Date; peso: number; valorMaximo: number; notas: Nota[] };
type TurmaInfo = {
  id: string; nome: string; turno: string; anoLetivo: number; escolaId: string;
  escola: { nome: string };
  serie: { nome: string; nivel: { etapaId: string } };
};
type Regra = { mediaMinima: number; notaMinimaRecuperacao: number; frequenciaMinima: number; origem: string };
type Disc = { id: string; nome: string };
type Aluno = { id: string; nomeAluno: string; numeroMatricula: string };
type FreqAgrupada = { matriculaId: string; status: string; _count: number };

const arred = (n: number) => Math.round(n * 10) / 10;
const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

const selectTurma = {
  id: true, nome: true, turno: true, anoLetivo: true, escolaId: true,
  escola: { select: { nome: true } },
  serie: { select: { nome: true, nivel: { select: { etapaId: true } } } },
} as const;
const selectAvaliacao = {
  id: true, disciplinaId: true, bimestre: true, data: true, peso: true, valorMaximo: true,
  notas: { select: { matriculaId: true, valor: true } },
} as const;

/** Média do aluno num conjunto de avaliações — mesma conta do boletim (lib/media). */
function mediaDoAluno(avs: Av[], matriculaId: string, hoje: Date): number | null {
  if (avs.length === 0) return null;
  return mediaDasAvaliacoes(
    avs.map((av) => ({
      data: av.data,
      peso: av.peso,
      valorMaximo: av.valorMaximo,
      nota: av.notas.find((x) => x.matriculaId === matriculaId)?.valor ?? null,
    })),
    hoje
  );
}

async function regraVigente(anoLetivo: number, escolaId: string, etapaId: string): Promise<Regra> {
  const cfg = await configuracaoAvaliacaoService.findByAnoLetivo(anoLetivo, escolaId, etapaId);
  return {
    mediaMinima: cfg?.mediaMinima ?? 6,
    // Piso de recuperação da mesma configuração (informativo; padrão 3,0)
    notaMinimaRecuperacao: cfg?.notaMinimaRecuperacao ?? NOTA_MINIMA_RECUPERACAO_PADRAO,
    frequenciaMinima: cfg?.percentualFrequenciaMinima ?? 75,
    origem: cfg ? "CONFIGURACAO" : "PADRAO",
  };
}

/**
 * Acompanhamento de aprendizagens (Módulo 2): situação da turma no bimestre,
 * por disciplina e por aluno, com os motivos de atenção explícitos
 * (abaixo da média, frequência baixa, queda em relação ao bimestre anterior,
 * avaliação sem nota). Os limites vêm da configuração de avaliação vigente
 * (escola+etapa > etapa > escola > rede); sem configuração, 6,0 e 75%.
 */
export class AprendizagemService {
  async turma(turmaId: string, bimestrePedido?: number, hoje: Date = hojeNaRede()) {
    const turma = await prisma.turma.findUnique({ where: { id: turmaId }, select: selectTurma });
    if (!turma) throw new NotFoundError("NF_005");
    const etapaId = turma.serie.nivel.etapaId;

    const [regra, disciplinas, alunos, avaliacoes, freq] = await Promise.all([
      regraVigente(turma.anoLetivo, turma.escolaId, etapaId),
      prisma.disciplina.findMany({
        where: { etapaId, ativo: true },
        select: { id: true, nome: true },
        orderBy: [{ ordem: "asc" }, { nome: "asc" }],
      }),
      prisma.matricula.findMany({
        where: { turmaId, status: "ATIVA" },
        select: { id: true, nomeAluno: true, numeroMatricula: true },
        orderBy: { nomeAluno: "asc" },
      }),
      prisma.avaliacao.findMany({ where: { turmaId }, select: selectAvaliacao }),
      prisma.frequencia.groupBy({ by: ["matriculaId", "status"], where: { turmaId }, _count: true }),
    ]);
    return this.montar(turma, regra, disciplinas, alunos, avaliacoes, freq, bimestrePedido, hoje);
  }

  /** Cálculo puro do acompanhamento de UMA turma (dados já carregados). */
  private montar(
    turma: TurmaInfo, regra: Regra, disciplinas: Disc[], alunos: Aluno[],
    avaliacoes: Av[], freq: FreqAgrupada[], bimestrePedido: number | undefined, hoje: Date
  ) {
    const bimestresComAvaliacao = [...new Set(avaliacoes.map((a) => a.bimestre))].sort();
    const bimestre = bimestrePedido ?? bimestresComAvaliacao[bimestresComAvaliacao.length - 1] ?? 1;
    const doBim = (disciplinaId: string, bim: number) =>
      avaliacoes.filter((a) => a.disciplinaId === disciplinaId && a.bimestre === bim);

    const presenca = new Map<string, { total: number; presencas: number }>();
    for (const g of freq) {
      const c = presenca.get(g.matriculaId) ?? { total: 0, presencas: 0 };
      c.total += g._count;
      if (g.status === "PRESENTE") c.presencas += g._count;
      presenca.set(g.matriculaId, c);
    }

    const linhasAlunos = alunos.map((a) => {
      const f = presenca.get(a.id);
      // Exibe arredondado; compara com a razão exata (74,5% não vira 75%)
      const frequencia = f && f.total ? Math.round((f.presencas / f.total) * 100) : null;
      const frequenciaBaixa = !!f && f.total > 0 && frequenciaAbaixoDoMinimo(f.presencas, f.total, regra.frequenciaMinima);
      const porDisciplina = disciplinas.map((d) => {
        const avs = doBim(d.id, bimestre);
        const atual = mediaDoAluno(avs, a.id, hoje);
        const anterior = bimestre > 1 ? mediaDoAluno(doBim(d.id, bimestre - 1), a.id, hoje) : null;
        const semNota = avs.filter((av) => !av.notas.some((n) => n.matriculaId === a.id)).length;
        return { disciplinaId: d.id, media: atual, mediaAnterior: anterior, avaliacoesSemNota: semNota };
      });
      const abaixo = porDisciplina.filter((x) => x.media !== null && x.media < regra.mediaMinima);
      const queda = porDisciplina.filter((x) => x.media !== null && x.mediaAnterior !== null && x.media < x.mediaAnterior);
      const pendentes = porDisciplina.reduce((t, x) => t + x.avaliacoesSemNota, 0);
      const nome = (id: string) => disciplinas.find((d) => d.id === id)?.nome ?? id;
      const motivos: Array<{ codigo: string; texto: string }> = [];
      if (abaixo.length) {
        motivos.push({ codigo: "ABAIXO_DA_MEDIA", texto: `Abaixo da média em ${abaixo.map((x) => nome(x.disciplinaId)).join(", ")}` });
      }
      if (frequenciaBaixa) {
        motivos.push({ codigo: "FREQUENCIA_BAIXA", texto: `Frequência de ${frequencia}%` });
      }
      if (queda.length) {
        motivos.push({ codigo: "QUEDA", texto: `Caiu em relação ao ${bimestre - 1}º bimestre em ${queda.map((x) => nome(x.disciplinaId)).join(", ")}` });
      }
      if (pendentes) motivos.push({ codigo: "SEM_NOTA", texto: `${pendentes} avaliação(ões) sem nota lançada` });
      const medias = porDisciplina.map((x) => x.media).filter((x): x is number => x !== null);
      return {
        matriculaId: a.id,
        nomeAluno: a.nomeAluno,
        numeroMatricula: a.numeroMatricula,
        frequencia,
        mediaGeral: medias.length ? arred(media(medias)!) : null,
        disciplinas: porDisciplina.map((x) => ({ disciplinaId: x.disciplinaId, media: x.media, mediaAnterior: x.mediaAnterior })),
        motivos,
      };
    });

    const linhasDisciplinas = disciplinas.map((d) => {
      const medias = linhasAlunos
        .map((a) => a.disciplinas.find((x) => x.disciplinaId === d.id)?.media)
        .filter((x): x is number => x !== null && x !== undefined);
      return {
        disciplinaId: d.id,
        nome: d.nome,
        avaliacoes: doBim(d.id, bimestre).length,
        mediaTurma: medias.length ? arred(media(medias)!) : null,
        alunosComNota: medias.length,
        abaixoDaMedia: medias.filter((m) => m < regra.mediaMinima).length,
      };
    });

    // Quem tem mais motivos aparece primeiro
    const ordenados = [...linhasAlunos].sort((x, y) => y.motivos.length - x.motivos.length || x.nomeAluno.localeCompare(y.nomeAluno));
    const gerais = linhasAlunos.map((a) => a.mediaGeral).filter((x): x is number => x !== null);
    return {
      turma: {
        id: turma.id, nome: turma.nome, turno: turma.turno, anoLetivo: turma.anoLetivo,
        escola: turma.escola.nome, serie: turma.serie.nome,
      },
      regra,
      bimestre,
      bimestresComAvaliacao,
      resumo: {
        alunos: alunos.length,
        emAtencao: linhasAlunos.filter((a) => a.motivos.some((m) => m.codigo !== "SEM_NOTA")).length,
        frequenciaBaixa: linhasAlunos.filter((a) => a.motivos.some((m) => m.codigo === "FREQUENCIA_BAIXA")).length,
        mediaGeral: gerais.length ? arred(media(gerais)!) : null,
      },
      disciplinas: linhasDisciplinas,
      alunos: ordenados,
    };
  }

  /**
   * Resumo por turma da escola no ano letivo (padrão: o mais recente com turma
   * ativa). Busca em LOTE (turmas, disciplinas, alunos, avaliações e
   * frequência da escola inteira em poucas consultas) e reaproveita o mesmo
   * cálculo de `turma()` — antes eram ~7 consultas por turma.
   */
  async escola(escolaId: string, anoLetivo?: number, hoje: Date = hojeNaRede()) {
    const escola = await prisma.escola.findUnique({ where: { id: escolaId }, select: { id: true, nome: true } });
    if (!escola) throw new NotFoundError("NF_003");
    const anos = await prisma.turma.findMany({
      where: { escolaId, ativo: true },
      select: { anoLetivo: true },
      distinct: ["anoLetivo"],
      orderBy: { anoLetivo: "desc" },
    });
    const ano = anoLetivo ?? anos[0]?.anoLetivo ?? Number(hojeNaRede().toISOString().slice(0, 4));
    const turmas = await prisma.turma.findMany({
      where: { escolaId, anoLetivo: ano, ativo: true },
      select: selectTurma,
      orderBy: { nome: "asc" },
    });
    const turmaIds = turmas.map((t) => t.id);
    const etapaIds = [...new Set(turmas.map((t) => t.serie.nivel.etapaId))];

    const [regras, disciplinas, alunos, avaliacoes, freq] = await Promise.all([
      // Uma consulta por etapa distinta (normalmente 1–3 por escola)
      Promise.all(etapaIds.map(async (e) => [e, await regraVigente(ano, escolaId, e)] as const)),
      prisma.disciplina.findMany({
        where: { etapaId: { in: etapaIds }, ativo: true },
        select: { id: true, nome: true, etapaId: true },
        orderBy: [{ ordem: "asc" }, { nome: "asc" }],
      }),
      prisma.matricula.findMany({
        where: { turmaId: { in: turmaIds }, status: "ATIVA" },
        select: { id: true, nomeAluno: true, numeroMatricula: true, turmaId: true },
        orderBy: { nomeAluno: "asc" },
      }),
      prisma.avaliacao.findMany({ where: { turmaId: { in: turmaIds } }, select: { ...selectAvaliacao, turmaId: true } }),
      prisma.frequencia.groupBy({ by: ["turmaId", "matriculaId", "status"], where: { turmaId: { in: turmaIds } }, _count: true }),
    ]);
    const regraDaEtapa = new Map(regras);
    const agrupa = <T, K>(xs: T[], chave: (x: T) => K) => {
      const m = new Map<K, T[]>();
      for (const x of xs) {
        const k = chave(x);
        const l = m.get(k);
        if (l) l.push(x);
        else m.set(k, [x]);
      }
      return m;
    };
    const discPorEtapa = agrupa(disciplinas, (d) => d.etapaId);
    const alunosPorTurma = agrupa(alunos, (a) => a.turmaId);
    const avsPorTurma = agrupa(avaliacoes, (a) => a.turmaId);
    const freqPorTurma = agrupa(freq, (f) => f.turmaId);

    const resumos = turmas.map((t) => {
      const etapaId = t.serie.nivel.etapaId;
      const r = this.montar(
        t,
        regraDaEtapa.get(etapaId)!,
        discPorEtapa.get(etapaId) ?? [],
        alunosPorTurma.get(t.id) ?? [],
        avsPorTurma.get(t.id) ?? [],
        freqPorTurma.get(t.id) ?? [],
        undefined,
        hoje
      );
      return { turma: r.turma, bimestre: r.bimestre, resumo: r.resumo, regra: r.regra };
    });
    return { escola, anoLetivo: ano, anosDisponiveis: anos.map((a) => a.anoLetivo), turmas: resumos };
  }
}

export const aprendizagemService = new AprendizagemService();
