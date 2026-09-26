import { prisma, prismaSemEscopo } from "../lib/prisma.js";
import { NotFoundError } from "../errors/index.js";
import { duracao, fracaoMaximaRegencia, paresConflitantes } from "../lib/horarios.js";

type Alerta = { codigo: string; mensagem: string };
const horas = (min: number) => Math.round((min / 60) * 10) / 10;

/**
 * Quadro de lotação da escola (Módulo 4): para cada profissional ligado a ela
 * (lotação, aula na grade ou AC), cruza jornada × regência × AC e aponta
 * excessos e choques de horário. As horas são de relógio (a grade guarda o
 * horário de início e fim de cada aula).
 *
 * Totais de outras escolas entram só como soma (e conflito, sem detalhar a
 * outra escola): o diretor precisa deles para não sobrecarregar ninguém.
 */
export class LotacaoService {
  async quadro(escolaId: string) {
    // Com escopo: diretor/secretaria só abrem a própria escola (senão 404)
    const escola = await prisma.escola.findUnique({ where: { id: escolaId }, select: { id: true, nome: true } });
    if (!escola) throw new NotFoundError("NF_003");
    const fracao = fracaoMaximaRegencia();

    const [lotacoes, aulasNaEscola, acsNaEscola] = await Promise.all([
      prismaSemEscopo.escolaProfissional.findMany({ where: { escolaId }, select: { profissionalId: true } }),
      prismaSemEscopo.gradeHoraria.findMany({
        where: { turma: { escolaId }, profissionalId: { not: null } },
        select: { profissionalId: true },
      }),
      prismaSemEscopo.atividadeComplementar.findMany({
        where: { escolaId, ativo: true },
        select: { coordenadorId: true, participantes: { select: { profissionalId: true } } },
      }),
    ]);
    const ids = [
      ...new Set([
        ...lotacoes.map((l) => l.profissionalId),
        ...aulasNaEscola.map((a) => a.profissionalId!),
        ...acsNaEscola.flatMap((a) => [...a.participantes.map((p) => p.profissionalId), ...(a.coordenadorId ? [a.coordenadorId] : [])]),
      ]),
    ];

    const [profissionais, todasLotacoes, todasAulas, todasAcs] = await Promise.all([
      prismaSemEscopo.profissionalEducacao.findMany({
        where: { id: { in: ids } },
        select: { id: true, nome: true, tipo: true, regimeContratacao: true, jornada: true, ativo: true },
        orderBy: { nome: "asc" },
      }),
      prismaSemEscopo.escolaProfissional.findMany({
        where: { profissionalId: { in: ids } },
        select: { profissionalId: true, escolaId: true, funcao: true, cargaHoraria: true },
      }),
      prismaSemEscopo.gradeHoraria.findMany({
        where: { profissionalId: { in: ids } },
        select: {
          profissionalId: true, diaSemana: true, horaInicio: true, horaFim: true, disciplina: true,
          turma: { select: { nome: true, escolaId: true } },
        },
      }),
      prismaSemEscopo.atividadeComplementar.findMany({
        where: {
          ativo: true,
          OR: [{ coordenadorId: { in: ids } }, { participantes: { some: { profissionalId: { in: ids } } } }],
        },
        select: {
          escolaId: true, area: true, diaSemana: true, horaInicio: true, horaFim: true, coordenadorId: true,
          participantes: { select: { profissionalId: true } },
        },
      }),
    ]);

    const linhas = profissionais.map((p) => {
      const aulas = todasAulas.filter((a) => a.profissionalId === p.id);
      const acs = todasAcs.filter(
        (a) => a.coordenadorId === p.id || a.participantes.some((x) => x.profissionalId === p.id)
      );
      const lot = todasLotacoes.filter((l) => l.profissionalId === p.id);
      const aqui = lot.find((l) => l.escolaId === escolaId) ?? null;

      const soma = <T extends { horaInicio: string; horaFim: string }>(xs: T[]) =>
        xs.reduce((t, x) => t + duracao(x.horaInicio, x.horaFim), 0);
      const regenciaTotal = soma(aulas);
      const regenciaEscola = soma(aulas.filter((a) => a.turma.escolaId === escolaId));
      const acTotal = soma(acs);
      const acEscola = soma(acs.filter((a) => a.escolaId === escolaId));
      const jornadaMin = p.jornada ? p.jornada * 60 : null;

      const agenda = [
        ...aulas.map((a) => ({
          tipo: "AULA" as const, diaSemana: a.diaSemana, horaInicio: a.horaInicio, horaFim: a.horaFim,
          nestaEscola: a.turma.escolaId === escolaId,
          descricao: a.turma.escolaId === escolaId ? `${a.disciplina} · ${a.turma.nome}` : "Aula em outra escola",
        })),
        ...acs.map((a) => ({
          tipo: "AC" as const, diaSemana: a.diaSemana, horaInicio: a.horaInicio, horaFim: a.horaFim,
          nestaEscola: a.escolaId === escolaId,
          descricao: a.escolaId === escolaId ? `AC · ${a.area}` : "AC em outra escola",
        })),
      ];
      const conflitos = paresConflitantes(agenda).map(([a, b]) => ({
        diaSemana: a.diaSemana,
        entre: [`${a.descricao} (${a.horaInicio}–${a.horaFim})`, `${b.descricao} (${b.horaInicio}–${b.horaFim})`],
      }));

      const alertas: Alerta[] = [];
      if (jornadaMin === null) {
        alertas.push({ codigo: "SEM_JORNADA", mensagem: "Jornada semanal não cadastrada" });
      } else {
        if (regenciaTotal > jornadaMin * fracao + 0.5) {
          alertas.push({
            codigo: "REGENCIA_ACIMA_DO_LIMITE",
            mensagem: `Regência de ${horas(regenciaTotal)}h passa do limite de ${horas(jornadaMin * fracao)}h`,
          });
        }
        if (regenciaTotal + acTotal > jornadaMin) {
          alertas.push({
            codigo: "JORNADA_EXCEDIDA",
            mensagem: `Aulas + AC somam ${horas(regenciaTotal + acTotal)}h, acima da jornada de ${p.jornada}h`,
          });
        }
        const lotado = lot.reduce((t, l) => t + (l.cargaHoraria ?? 0), 0);
        if (lotado > (p.jornada ?? 0)) {
          alertas.push({
            codigo: "LOTACAO_ACIMA_DA_JORNADA",
            mensagem: `Lotações somam ${lotado}h, acima da jornada de ${p.jornada}h`,
          });
        }
      }
      if (!aqui) alertas.push({ codigo: "SEM_LOTACAO", mensagem: "Tem aula ou AC aqui, mas não está lotado nesta escola" });
      if (conflitos.length) alertas.push({ codigo: "CONFLITO_HORARIO", mensagem: `${conflitos.length} choque(s) de horário` });

      return {
        profissional: { id: p.id, nome: p.nome, tipo: p.tipo, regimeContratacao: p.regimeContratacao, ativo: p.ativo },
        jornadaHoras: p.jornada,
        lotacaoNaEscola: aqui ? { funcao: aqui.funcao, cargaHoraria: aqui.cargaHoraria } : null,
        disciplinasNaEscola: [...new Set(aulas.filter((a) => a.turma.escolaId === escolaId).map((a) => a.disciplina))].sort(),
        horas: {
          regenciaNaEscola: horas(regenciaEscola),
          regenciaTotal: horas(regenciaTotal),
          acNaEscola: horas(acEscola),
          acTotal: horas(acTotal),
          limiteRegencia: jornadaMin === null ? null : horas(jornadaMin * fracao),
          saldo: jornadaMin === null ? null : horas(jornadaMin - regenciaTotal - acTotal),
        },
        conflitos,
        alertas,
      };
    });

    return {
      escola,
      fracaoMaximaRegencia: Math.round(fracao * 10000) / 10000,
      resumo: {
        profissionais: linhas.length,
        comAlerta: linhas.filter((l) => l.alertas.length > 0).length,
        regenciaNaEscola: Math.round(linhas.reduce((t, l) => t + l.horas.regenciaNaEscola, 0) * 10) / 10,
        acNaEscola: Math.round(linhas.reduce((t, l) => t + l.horas.acNaEscola, 0) * 10) / 10,
      },
      profissionais: linhas,
    };
  }
}

export const lotacaoService = new LotacaoService();
