import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../errors/index.js";
import { frequenciaAbaixoDoMinimo } from "./frequencia.service.js";
import type { ExportacaoPresencaQuery } from "../schemas/exportacao.schemas.js";

/**
 * Exportador Sistema Presença (acompanhamento da condicionalidade de educação
 * do Programa Bolsa Família).
 *
 * Limiares oficiais de frequência mínima — Lei 14.601/2023 (art. 12, II) e
 * Decreto 11.566/2023:
 *   - 60% para crianças de 4 e 5 anos (pré-escola);
 *   - 75% para beneficiários de 6 a 18 anos incompletos (aqui: 6–17).
 *
 * Regras fechadas do design:
 *   - JUSTIFICADA não conta como presença no percentual (mesmo critério do
 *     frequenciaService.calcularEstatisticas), mas é emitida em coluna própria
 *     `faltas_justificadas` para lançamento do motivo no Sistema Presença.
 *   - Aluno sem nenhum registro de frequência no mês fica FORA do CSV
 *     (contado em resumo.alunosSemRegistro) — evita falso-positivo de 0%.
 *   - Fora das faixas etárias (4–5 / 6–17) o aluno é excluído do CSV
 *     (contado em resumo.alunosForaFaixaEtaria). Idade no ÚLTIMO dia do mês.
 *   - CSV separado por ";", linhas "\r\n", UTF-8 com BOM (Excel PT-BR).
 */

const CABECALHO_CSV =
  "codigo_inep_escola;nome_escola;nome_aluno;nis_aluno;data_nascimento;serie;turma;turno;idade;faixa_etaria;limiar_frequencia;total_aulas;presencas;faltas;faltas_justificadas;percentual_frequencia;periodo";

export interface LinhaSistemaPresenca {
  codigoInepEscola: string;
  nomeEscola: string;
  nomeAluno: string;
  nisAluno: string; // "" quando ausente
  dataNascimento: string; // DD/MM/AAAA
  serie: string;
  turma: string;
  turno: string;
  idade: number; // no último dia do mês
  faixaEtaria: "PRE_ESCOLA_4_5" | "FUNDAMENTAL_MEDIO_6_17";
  limiarFrequencia: 60 | 75;
  totalAulas: number;
  presencas: number;
  faltas: number; // status FALTA
  faltasJustificadas: number;
  percentualFrequencia: number; // inteiro, Math.round (mesma fórmula do frequenciaService) sobre AULAS registradas
  periodo: string; // "MM/AAAA"
}

export interface ResumoSistemaPresenca {
  ano: number;
  mes: number;
  totalAvaliados: number; // matrículas ATIVA com turma na faixa etária
  totalBaixaFrequencia: number; // linhas do CSV
  alunosSemRegistro: number;
  alunosForaFaixaEtaria: number;
}

export interface ResultadoSistemaPresenca {
  nomeArquivo: string;
  conteudo: string; // CSV com BOM, linhas \r\n
  linhas: LinhaSistemaPresenca[];
  resumo: ResumoSistemaPresenca;
}

/** dadosCenso é Json nativo: garante objeto plano ou {} */
function objetoCenso(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : {};
}

export class ExportacaoPresencaService {
  /**
   * Célula de texto do CSV (aberto no Excel: BOM + ";"). Além de trocar os
   * separadores, neutraliza injeção de fórmula (CSV/formula injection):
   * conteúdo que começa com =, +, -, @, tab ou CR ganha o prefixo "'" e é
   * exibido como texto. Números (idade, totais, percentuais) não passam por
   * aqui como texto: um number é devolvido sem prefixo, então um valor
   * numérico negativo legítimo continua numérico.
   */
  private campo(v: unknown): string {
    if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
    const texto = String(v ?? "");
    const perigoso = /^[=+\-@\t\r]/.test(texto);
    const limpo = texto.replace(/[|\r\n;]/g, " ").trim();
    return perigoso || /^[=+\-@]/.test(limpo) ? `'${limpo}` : limpo;
  }

  private soDigitos(v?: string | null): string {
    return (v ?? "").replace(/\D/g, "");
  }

  private dataBR(d?: Date | null): string {
    if (!d) return "";
    const dia = String(d.getUTCDate()).padStart(2, "0");
    const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
    return `${dia}/${mes}/${d.getUTCFullYear()}`;
  }

  /** Anos completos na data de referência (aritmética UTC) */
  private idadeEm(nascimento: Date, referencia: Date): number {
    let idade = referencia.getUTCFullYear() - nascimento.getUTCFullYear();
    const mesRef = referencia.getUTCMonth();
    const mesNasc = nascimento.getUTCMonth();
    if (
      mesRef < mesNasc ||
      (mesRef === mesNasc && referencia.getUTCDate() < nascimento.getUTCDate())
    ) {
      idade--;
    }
    return idade;
  }

  /** D7: código INEP = dadosCenso.codigoEscola ∥ Escola.codigo */
  private resolverCodigoInep(escola: {
    codigo: string;
    dadosCenso: unknown;
  }): string {
    const censo = objetoCenso(escola.dadosCenso);
    const bruto =
      (typeof censo.codigoEscola === "string" && censo.codigoEscola.trim()) ||
      escola.codigo;
    return this.campo(bruto);
  }

  async gerarSistemaPresenca(
    // `formato` é resolvido na rota (download vs. prévia JSON) — o service gera sempre o mesmo resultado
    params: Omit<ExportacaoPresencaQuery, "formato">
  ): Promise<ResultadoSistemaPresenca> {
    const anoLetivo = await prisma.anoLetivo.findUnique({
      where: { id: params.anoLetivoId },
    });
    if (!anoLetivo) throw new NotFoundError("NF_031");

    if (params.escolaId) {
      const escolaFiltro = await prisma.escola.findUnique({
        where: { id: params.escolaId },
      });
      if (!escolaFiltro) throw new NotFoundError("NF_003");
    }

    const ano = anoLetivo.ano;
    const mes = params.mes;
    const dataInicio = new Date(Date.UTC(ano, mes - 1, 1));
    const dataFim = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999)); // último dia do mês
    const periodo = `${String(mes).padStart(2, "0")}/${ano}`;

    const matriculas = await prisma.matricula.findMany({
      where: {
        anoLetivo: ano,
        status: "ATIVA",
        turmaId: { not: null },
        ...(params.escolaId && { escolaId: params.escolaId }),
      },
      include: { escola: true, turma: { include: { serie: true } } },
    });

    // Agregação de frequência em UMA query (sem N+1 por aluno)
    const frequencias = await prisma.frequencia.findMany({
      where: {
        matriculaId: { in: matriculas.map((m) => m.id) },
        data: { gte: dataInicio, lte: dataFim },
      },
      select: { matriculaId: true, status: true },
    });
    const contagem = new Map<
      string,
      { presente: number; falta: number; justificada: number }
    >();
    for (const registro of frequencias) {
      const atual = contagem.get(registro.matriculaId) ?? {
        presente: 0,
        falta: 0,
        justificada: 0,
      };
      if (registro.status === "PRESENTE") atual.presente++;
      else if (registro.status === "FALTA") atual.falta++;
      else if (registro.status === "JUSTIFICADA") atual.justificada++;
      contagem.set(registro.matriculaId, atual);
    }

    // Código INEP resolvido uma vez por escola
    const codigoInepPorEscola = new Map<string, string>();
    const codigoInepDe = (escola: {
      id: string;
      codigo: string;
      dadosCenso: unknown;
    }): string => {
      const cacheado = codigoInepPorEscola.get(escola.id);
      if (cacheado !== undefined) return cacheado;
      const codigo = this.resolverCodigoInep(escola);
      codigoInepPorEscola.set(escola.id, codigo);
      return codigo;
    };

    const linhas: LinhaSistemaPresenca[] = [];
    let totalAvaliados = 0;
    let alunosSemRegistro = 0;
    let alunosForaFaixaEtaria = 0;

    for (const matricula of matriculas) {
      const idade = this.idadeEm(matricula.dataNascimento, dataFim);

      let faixaEtaria: LinhaSistemaPresenca["faixaEtaria"];
      let limiar: LinhaSistemaPresenca["limiarFrequencia"];
      if (idade >= 4 && idade <= 5) {
        faixaEtaria = "PRE_ESCOLA_4_5";
        limiar = 60;
      } else if (idade >= 6 && idade <= 17) {
        faixaEtaria = "FUNDAMENTAL_MEDIO_6_17";
        limiar = 75;
      } else {
        alunosForaFaixaEtaria++;
        continue;
      }
      totalAvaliados++;

      const stats = contagem.get(matricula.id);
      const totalAulas = stats
        ? stats.presente + stats.falta + stats.justificada
        : 0;
      if (!stats || totalAulas === 0) {
        alunosSemRegistro++;
        continue;
      }

      // Cada registro é UMA AULA (frequência por aula; turmas sem grade têm
      // um registro por dia): o percentual é sobre as aulas registradas.
      // JUSTIFICADA não conta como presença (D2). A inclusão compara a razão
      // EXATA com o limiar (74,5% está abaixo de 75%), como no restante do
      // sistema; a coluna do arquivo continua com o percentual arredondado.
      const percentual = Math.round((stats.presente / totalAulas) * 100);
      if (!frequenciaAbaixoDoMinimo(stats.presente, totalAulas, limiar)) continue;

      linhas.push({
        codigoInepEscola: codigoInepDe(matricula.escola),
        nomeEscola: matricula.escola.nome,
        nomeAluno: matricula.nomeAluno,
        nisAluno: this.soDigitos(matricula.nisAluno),
        dataNascimento: this.dataBR(matricula.dataNascimento),
        serie: matricula.turma?.serie?.nome ?? "",
        turma: matricula.turma?.nome ?? "",
        turno: matricula.turma?.turno ?? "",
        idade,
        faixaEtaria,
        limiarFrequencia: limiar,
        totalAulas,
        presencas: stats.presente,
        faltas: stats.falta,
        faltasJustificadas: stats.justificada,
        percentualFrequencia: percentual,
        periodo,
      });
    }

    linhas.sort(
      (a, b) =>
        a.nomeEscola.localeCompare(b.nomeEscola, "pt-BR") ||
        a.turma.localeCompare(b.turma, "pt-BR") ||
        a.nomeAluno.localeCompare(b.nomeAluno, "pt-BR")
    );

    const linhasCsv = linhas.map((l) =>
      [
        this.campo(l.codigoInepEscola),
        this.campo(l.nomeEscola),
        this.campo(l.nomeAluno),
        this.campo(l.nisAluno),
        l.dataNascimento,
        this.campo(l.serie),
        this.campo(l.turma),
        this.campo(l.turno),
        String(l.idade),
        l.faixaEtaria,
        String(l.limiarFrequencia),
        String(l.totalAulas),
        String(l.presencas),
        String(l.faltas),
        String(l.faltasJustificadas),
        String(l.percentualFrequencia),
        l.periodo,
      ].join(";")
    );
    const conteudo =
      "\uFEFF" + [CABECALHO_CSV, ...linhasCsv].join("\r\n") + "\r\n";

    const sufixoEscola = params.escolaId
      ? (() => {
          const escola = matriculas.find(
            (m) => m.escolaId === params.escolaId
          )?.escola;
          const codigo = escola ? codigoInepDe(escola) : "";
          return codigo || params.escolaId;
        })()
      : "rede";
    const nomeArquivo = `sistema-presenca_${ano}-${String(mes).padStart(2, "0")}_${sufixoEscola}.csv`;

    return {
      nomeArquivo,
      conteudo,
      linhas,
      resumo: {
        ano,
        mes,
        totalAvaliados,
        totalBaixaFrequencia: linhas.length,
        alunosSemRegistro,
        alunosForaFaixaEtaria,
      },
    };
  }
}

export const exportacaoPresencaService = new ExportacaoPresencaService();
