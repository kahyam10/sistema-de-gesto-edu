import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../errors/index.js";
import { configuracaoAvaliacaoService } from "./configuracao-avaliacao.service.js";

type Nota = { matriculaId: string; valor: number };
type Av = { id: string; disciplinaId: string; bimestre: number; peso: number; notas: Nota[] };

const arred = (n: number) => Math.round(n * 10) / 10;
const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/**
 * Média ponderada do aluno num conjunto de avaliações — mesma conta do
 * boletim (nota.service getBoletim): soma(valor × peso) / soma(pesos das
 * avaliações em que ele tem nota).
 */
function mediaPonderada(avs: Av[], matriculaId: string): number | null {
  let soma = 0;
  let pesos = 0;
  for (const av of avs) {
    const n = av.notas.find((x) => x.matriculaId === matriculaId);
    if (n) {
      soma += n.valor * av.peso;
      pesos += av.peso;
    }
  }
  return pesos ? Math.round((soma / pesos) * 100) / 100 : null;
}

/**
 * Acompanhamento de aprendizagens (Módulo 2): situação da turma no bimestre,
 * por disciplina e por aluno, com os motivos de atenção explícitos
 * (abaixo da média, frequência baixa, queda em relação ao bimestre anterior,
 * avaliação sem nota). Os limites vêm da configuração de avaliação vigente
 * (escola+etapa > etapa > escola > rede); sem configuração, 6,0 e 75%.
 */
export class AprendizagemService {
  async turma(turmaId: string, bimestrePedido?: number) {
    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      select: {
        id: true, nome: true, turno: true, anoLetivo: true, escolaId: true,
        escola: { select: { nome: true } },
        serie: { select: { nome: true, nivel: { select: { etapaId: true } } } },
      },
    });
    if (!turma) throw new NotFoundError("NF_005");
    const etapaId = turma.serie.nivel.etapaId;
    const cfg = await configuracaoAvaliacaoService.findByAnoLetivo(turma.anoLetivo, turma.escolaId, etapaId);
    const regra = {
      mediaMinima: cfg?.mediaMinima ?? 6,
      frequenciaMinima: cfg?.percentualFrequenciaMinima ?? 75,
      origem: cfg ? "CONFIGURACAO" : "PADRAO",
    };

    const [disciplinas, alunos, avaliacoes, freq] = await Promise.all([
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
      prisma.avaliacao.findMany({
        where: { turmaId },
        select: {
          id: true, disciplinaId: true, bimestre: true, peso: true,
          notas: { select: { matriculaId: true, valor: true } },
        },
      }),
      prisma.frequencia.groupBy({ by: ["matriculaId", "status"], where: { turmaId }, _count: true }),
    ]);

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
      const frequencia = f && f.total ? Math.round((f.presencas / f.total) * 100) : null;
      const porDisciplina = disciplinas.map((d) => {
        const avs = doBim(d.id, bimestre);
        const atual = mediaPonderada(avs, a.id);
        const anterior = bimestre > 1 ? mediaPonderada(doBim(d.id, bimestre - 1), a.id) : null;
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
      if (frequencia !== null && frequencia < regra.frequenciaMinima) {
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

  /** Resumo por turma da escola no ano letivo (padrão: o mais recente com turma ativa). */
  async escola(escolaId: string, anoLetivo?: number) {
    const escola = await prisma.escola.findUnique({ where: { id: escolaId }, select: { id: true, nome: true } });
    if (!escola) throw new NotFoundError("NF_003");
    const anos = await prisma.turma.findMany({
      where: { escolaId, ativo: true },
      select: { anoLetivo: true },
      distinct: ["anoLetivo"],
      orderBy: { anoLetivo: "desc" },
    });
    const ano = anoLetivo ?? anos[0]?.anoLetivo ?? new Date().getFullYear();
    const turmas = await prisma.turma.findMany({
      where: { escolaId, anoLetivo: ano, ativo: true },
      select: { id: true },
      orderBy: { nome: "asc" },
    });
    const resumos = [];
    for (const t of turmas) {
      const r = await this.turma(t.id);
      resumos.push({ turma: r.turma, bimestre: r.bimestre, resumo: r.resumo, regra: r.regra });
    }
    return { escola, anoLetivo: ano, anosDisponiveis: anos.map((a) => a.anoLetivo), turmas: resumos };
  }
}

export const aprendizagemService = new AprendizagemService();
