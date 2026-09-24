import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../errors/index.js";
import type { ExportacaoEducacensoQuery } from "../schemas/exportacao.schemas.js";

/**
 * Exportador Educacenso/INEP — arquivo TXT de migração (layout SIMPLIFICADO).
 *
 * Gera arquivo pipe-delimited com os registros 00 (escola), 20 (turma),
 * 30 (pessoa física), 40 (vínculo gestor), 50 (vínculo docente),
 * 60 (vínculo aluno/matrícula) e 99 (fim de arquivo), em blocos por escola.
 *
 * ATENÇÃO: é um SUBCONJUNTO documentado do layout de migração oficial —
 * serve de base de migração assistida + relatório de pendências e DEVE ser
 * validado no sistema oficial do Educacenso antes de qualquer submissão.
 */

/** Ibirapitanga-BA — confirmado em geoftp.ibge.gov.br (mapa municipal 2912707) */
const CODIGO_IBGE_MUNICIPIO = "2912707";
const UF = "BA";

const MAPA_SEXO: Record<string, string> = { M: "1", F: "2" };
// lookup normalizado sem acento/maiúsculas; ausente/não mapeado → "0" (não declarada)
const MAPA_COR_RACA: Record<string, string> = {
  BRANCA: "1",
  PRETA: "2",
  PARDA: "3",
  AMARELA: "4",
  INDIGENA: "5",
};
const MAPA_TURNO: Record<string, string> = {
  MATUTINO: "1",
  VESPERTINO: "2",
  NOTURNO: "3",
  INTEGRAL: "4",
};
// vazio → "1" + AVISO
const MAPA_SITUACAO_FUNCIONAMENTO: Record<string, string> = {
  "Em atividade": "1",
  Paralisada: "2",
  Extinta: "3",
};
// vazio → "3" (rede municipal) sem pendência
const MAPA_DEPENDENCIA: Record<string, string> = {
  Federal: "1",
  Estadual: "2",
  Municipal: "3",
  Privada: "4",
};
// vazio → "" + AVISO
const MAPA_LOCALIZACAO: Record<string, string> = { Urbana: "1", Rural: "2" };
// vazio → "" + AVISO
const MAPA_SITUACAO_FUNCIONAL: Record<string, string> = {
  EFETIVO: "1",
  CONTRATADO: "2",
  TEMPORARIO: "2",
  TERCEIRIZADO: "3",
  CEDIDO: "4",
};
/** Serie.nome (seed-prod) → código de etapa do Educacenso */
const MAPA_ETAPA_EDUCACENSO: Record<string, string> = {
  "BERCARIO I": "1",
  "BERCARIO II": "1",
  "MATERNAL I": "1",
  "MATERNAL II": "1",
  "PRE I": "2",
  "PRE II": "2",
  "1O ANO": "14",
  "2O ANO": "15",
  "3O ANO": "16",
  "4O ANO": "17",
  "5O ANO": "18",
  "6O ANO": "19",
  "7O ANO": "20",
  "8O ANO": "21",
  "9O ANO": "41",
  "1A SERIE": "25",
  "2A SERIE": "26",
  "3A SERIE": "27",
};

export interface PendenciaEducacenso {
  linha: number; // 1-based no arquivo TXT
  registro: "00" | "20" | "30" | "40" | "50" | "60";
  entidade:
    | "ESCOLA"
    | "TURMA"
    | "PESSOA"
    | "VINCULO_GESTOR"
    | "VINCULO_DOCENTE"
    | "VINCULO_ALUNO";
  entidadeId: string;
  entidadeNome: string;
  campo: string; // nome lógico do campo
  posicao: number; // posição 1-based do campo na linha
  nivel: "ERRO" | "AVISO"; // ERRO = inviabiliza migração; AVISO = campo opcional vazio
  motivo: string;
}

export interface ResumoEducacenso {
  ano: number;
  totalEscolas: number;
  totalTurmas: number;
  totalAlunos: number;
  totalProfissionais: number;
  totalLinhas: number;
  totalPendencias: number;
  pendenciasPorNivel: { ERRO: number; AVISO: number };
}

export interface ResultadoEducacenso {
  nomeArquivo: string;
  conteudo: string; // linhas unidas por \r\n
  resumo: ResumoEducacenso;
  pendencias: PendenciaEducacenso[];
}

/** dadosCenso é Json nativo: garante objeto plano ou {} */
function objetoCenso(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : {};
}

/** Remove acentos/ordinais e parêntesis finais para lookup de série */
function normalizarNomeSerie(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/º/g, "O")
    .replace(/ª/g, "A")
    .replace(/\s*\(.*\)$/, "")
    .trim();
}

function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

export class ExportacaoEducacensoService {
  private campo(v: unknown): string {
    return String(v ?? "").replace(/[|\r\n;]/g, " ").trim();
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

  /** D7: código INEP = dadosCenso.codigoEscola ∥ Escola.codigo; válido = 8 dígitos */
  private resolverCodigoInep(escola: {
    codigo: string;
    dadosCenso: unknown;
  }): { valor: string; valido: boolean } {
    const censo = objetoCenso(escola.dadosCenso);
    const bruto =
      (typeof censo.codigoEscola === "string" && censo.codigoEscola.trim()) ||
      escola.codigo;
    return { valor: this.campo(bruto), valido: /^\d{8}$/.test(bruto.trim()) };
  }

  private codigoEtapa(nomeSerie: string): string {
    return MAPA_ETAPA_EDUCACENSO[normalizarNomeSerie(nomeSerie)] ?? "";
  }

  async gerarEducacenso(
    // `formato` é resolvido na rota (download vs. prévia JSON) — o service gera sempre o mesmo resultado
    params: Omit<ExportacaoEducacensoQuery, "formato">
  ): Promise<ResultadoEducacenso> {
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

    // Cargas anti-N+1 (4 queries) + agrupamento em memória
    const escolas = await prisma.escola.findMany({
      where: { ativo: true, ...(params.escolaId && { id: params.escolaId }) },
      include: { diretor: true },
      orderBy: { nome: "asc" },
    });
    const escolaIds = escolas.map((e) => e.id);

    const turmas = await prisma.turma.findMany({
      where: {
        anoLetivo: anoLetivo.ano,
        ativo: true,
        escolaId: { in: escolaIds },
      },
      include: {
        serie: true,
        professores: { include: { profissional: true } },
      },
      orderBy: { nome: "asc" },
    });

    const matriculas = await prisma.matricula.findMany({
      where: {
        anoLetivo: anoLetivo.ano,
        status: "ATIVA",
        escolaId: { in: escolaIds },
      },
      orderBy: { nomeAluno: "asc" },
    });

    const eventos = await prisma.eventoCalendario.findMany({
      where: {
        anoLetivoId: params.anoLetivoId,
        tipo: { in: ["INICIO_ANO_LETIVO", "FIM_ANO_LETIVO"] },
      },
    });

    const turmasPorEscola = new Map<string, typeof turmas>();
    for (const turma of turmas) {
      const lista = turmasPorEscola.get(turma.escolaId) ?? [];
      lista.push(turma);
      turmasPorEscola.set(turma.escolaId, lista);
    }
    const matriculasPorEscola = new Map<string, typeof matriculas>();
    for (const matricula of matriculas) {
      const lista = matriculasPorEscola.get(matricula.escolaId) ?? [];
      lista.push(matricula);
      matriculasPorEscola.set(matricula.escolaId, lista);
    }
    const turmaPorId = new Map(turmas.map((t) => [t.id, t]));

    const linhas: string[] = [];
    const pendencias: PendenciaEducacenso[] = [];
    const profissionaisExportados = new Set<string>();
    let codigoInepEscolaFiltrada: string | null = null;

    const push = (campos: string[]): number => {
      linhas.push(campos.join("|"));
      return linhas.length; // número 1-based da linha recém-emitida
    };

    for (const escola of escolas) {
      const censo = objetoCenso(escola.dadosCenso);
      const inep = this.resolverCodigoInep(escola);
      const codigoInep = inep.valido ? inep.valor : this.campo(inep.valor);
      if (params.escolaId && escola.id === params.escolaId && inep.valido) {
        codigoInepEscolaFiltrada = inep.valor;
      }

      const pendEscola = (
        p: Omit<PendenciaEducacenso, "linha" | "entidade" | "entidadeId" | "entidadeNome">,
        linha: number
      ) =>
        pendencias.push({
          ...p,
          linha,
          entidade: "ESCOLA",
          entidadeId: escola.id,
          entidadeNome: escola.nome,
        });

      // ---------- Registro 00 — Escola (14 campos) ----------
      const eventoInicio =
        eventos.find(
          (e) => e.tipo === "INICIO_ANO_LETIVO" && e.escolaId === escola.id
        ) ?? eventos.find((e) => e.tipo === "INICIO_ANO_LETIVO" && !e.escolaId);
      const eventoFim =
        eventos.find(
          (e) => e.tipo === "FIM_ANO_LETIVO" && e.escolaId === escola.id
        ) ?? eventos.find((e) => e.tipo === "FIM_ANO_LETIVO" && !e.escolaId);

      const situacaoBruta =
        typeof censo.situacaoFuncionamento === "string"
          ? censo.situacaoFuncionamento
          : "";
      const dependenciaBruta =
        typeof censo.dependenciaAdministrativa === "string"
          ? censo.dependenciaAdministrativa
          : "";
      const localizacaoBruta =
        typeof censo.localizacao === "string" ? censo.localizacao : "";

      const linha00 = push([
        "00",
        codigoInep,
        MAPA_SITUACAO_FUNCIONAMENTO[situacaoBruta] ?? "1",
        this.dataBR(eventoInicio?.dataInicio),
        this.dataBR(eventoFim?.dataInicio),
        this.campo(escola.nome),
        "", // CEP — endereço é texto livre no banco
        CODIGO_IBGE_MUNICIPIO,
        UF,
        this.campo(escola.endereco),
        this.soDigitos(escola.telefone),
        this.campo(escola.email),
        MAPA_DEPENDENCIA[dependenciaBruta] ?? "3",
        MAPA_LOCALIZACAO[localizacaoBruta] ?? "",
      ]);

      if (!inep.valido) {
        pendEscola(
          {
            registro: "00",
            campo: "codigoInep",
            posicao: 2,
            nivel: "ERRO",
            motivo:
              "Código INEP da escola inválido ou ausente (esperado 8 dígitos)",
          },
          linha00
        );
      }
      if (!situacaoBruta) {
        pendEscola(
          {
            registro: "00",
            campo: "situacaoFuncionamento",
            posicao: 3,
            nivel: "AVISO",
            motivo:
              "Situação de funcionamento não informada no questionário do censo — assumido 'Em atividade'",
          },
          linha00
        );
      }
      if (!eventoInicio) {
        pendEscola(
          {
            registro: "00",
            campo: "dataInicioAnoLetivo",
            posicao: 4,
            nivel: "AVISO",
            motivo: "Evento INICIO_ANO_LETIVO não cadastrado no calendário",
          },
          linha00
        );
      }
      if (!eventoFim) {
        pendEscola(
          {
            registro: "00",
            campo: "dataFimAnoLetivo",
            posicao: 5,
            nivel: "AVISO",
            motivo: "Evento FIM_ANO_LETIVO não cadastrado no calendário",
          },
          linha00
        );
      }
      pendEscola(
        {
          registro: "00",
          campo: "cep",
          posicao: 7,
          nivel: "AVISO",
          motivo: "CEP não cadastrado de forma estruturada",
        },
        linha00
      );
      if (!escola.endereco) {
        pendEscola(
          {
            registro: "00",
            campo: "endereco",
            posicao: 10,
            nivel: "AVISO",
            motivo: "Endereço da escola não cadastrado",
          },
          linha00
        );
      }
      if (!this.soDigitos(escola.telefone)) {
        pendEscola(
          {
            registro: "00",
            campo: "telefone",
            posicao: 11,
            nivel: "AVISO",
            motivo: "Telefone da escola não cadastrado",
          },
          linha00
        );
      }
      if (!escola.email) {
        pendEscola(
          {
            registro: "00",
            campo: "email",
            posicao: 12,
            nivel: "AVISO",
            motivo: "E-mail da escola não cadastrado",
          },
          linha00
        );
      }
      if (!MAPA_LOCALIZACAO[localizacaoBruta]) {
        pendEscola(
          {
            registro: "00",
            campo: "localizacao",
            posicao: 14,
            nivel: "AVISO",
            motivo:
              "Localização (Urbana/Rural) não informada no questionário do censo",
          },
          linha00
        );
      }

      // ---------- Registro 20 — Turmas (8 campos) ----------
      const turmasEscola = turmasPorEscola.get(escola.id) ?? [];
      for (const turma of turmasEscola) {
        const etapaCodigo = this.codigoEtapa(turma.serie.nome);
        const linha20 = push([
          "20",
          codigoInep,
          turma.id,
          this.campo(turma.nome),
          MAPA_TURNO[turma.turno] ?? "",
          String(turma.anoLetivo),
          etapaCodigo,
          String(turma.capacidadeMaxima),
        ]);
        if (!etapaCodigo) {
          pendencias.push({
            linha: linha20,
            registro: "20",
            entidade: "TURMA",
            entidadeId: turma.id,
            entidadeNome: turma.nome,
            campo: "etapaEducacenso",
            posicao: 7,
            nivel: "ERRO",
            motivo: `Série sem código Educacenso mapeado (${turma.serie.nome})`,
          });
        }
      }

      // ---------- Registro 30 — Pessoa física (13 campos) ----------
      const pessoasEmitidasNaEscola = new Set<string>();

      const emitirRegistro30Profissional = (profissional: {
        id: string;
        nome: string;
        cpf: string;
        dataNascimento: Date | null;
      }): void => {
        if (pessoasEmitidasNaEscola.has(profissional.id)) return;
        pessoasEmitidasNaEscola.add(profissional.id);
        profissionaisExportados.add(profissional.id);

        const cpf = this.soDigitos(profissional.cpf);
        const linha30 = push([
          "30",
          codigoInep,
          profissional.id,
          "", // identificação única INEP não armazenada
          cpf,
          this.campo(profissional.nome),
          this.dataBR(profissional.dataNascimento),
          "", // sexo não cadastrado para profissionais
          "0", // cor/raça não declarada
          "1", // nacionalidade brasileira (default)
          "", // município de nascimento (código IBGE) não armazenado
          "", // NIS não se aplica ao vínculo profissional
          "", // filiação não cadastrada para profissionais
        ]);
        const pendPessoa = (
          p: Omit<PendenciaEducacenso, "linha" | "registro" | "entidade" | "entidadeId" | "entidadeNome">
        ) =>
          pendencias.push({
            ...p,
            linha: linha30,
            registro: "30",
            entidade: "PESSOA",
            entidadeId: profissional.id,
            entidadeNome: profissional.nome,
          });

        pendPessoa({
          campo: "identificacaoInep",
          posicao: 4,
          nivel: "AVISO",
          motivo: "ID INEP não armazenado",
        });
        if (!cpf) {
          pendPessoa({
            campo: "cpf",
            posicao: 5,
            nivel: "AVISO",
            motivo: "CPF não cadastrado",
          });
        }
        if (!profissional.dataNascimento) {
          pendPessoa({
            campo: "dataNascimento",
            posicao: 7,
            nivel: "AVISO",
            motivo: "Data de nascimento não cadastrada",
          });
        }
        pendPessoa({
          campo: "sexo",
          posicao: 8,
          nivel: "AVISO",
          motivo: "Sexo não cadastrado para profissionais",
        });
      };

      // ---------- Gestor: 30 + 40 (6 campos) ----------
      if (escola.diretorId && escola.diretor) {
        emitirRegistro30Profissional(escola.diretor);

        const situacaoFuncional =
          MAPA_SITUACAO_FUNCIONAL[escola.diretor.regimeContratacao ?? ""] ?? "";
        const linha40 = push([
          "40",
          codigoInep,
          escola.diretorId,
          "1", // cargo: Diretor
          "", // critério de acesso ao cargo não armazenado
          situacaoFuncional,
        ]);
        pendencias.push({
          linha: linha40,
          registro: "40",
          entidade: "VINCULO_GESTOR",
          entidadeId: escola.diretorId,
          entidadeNome: escola.diretor.nome,
          campo: "criterioAcesso",
          posicao: 5,
          nivel: "AVISO",
          motivo: "Critério de acesso ao cargo não armazenado",
        });
        if (!situacaoFuncional) {
          pendencias.push({
            linha: linha40,
            registro: "40",
            entidade: "VINCULO_GESTOR",
            entidadeId: escola.diretorId,
            entidadeNome: escola.diretor.nome,
            campo: "situacaoFuncional",
            posicao: 6,
            nivel: "AVISO",
            motivo: "Regime de contratação do gestor não cadastrado",
          });
        }
      } else {
        pendEscola(
          {
            registro: "40",
            campo: "gestorEscolar",
            posicao: 3,
            nivel: "ERRO",
            motivo: "Escola sem diretor vinculado",
          },
          linha00
        );
      }

      // ---------- Docentes: 30 + 50 (6 campos) por vínculo ----------
      const vinculosPorDocente = new Map<
        string,
        { profissional: NonNullable<(typeof turmasEscola)[number]["professores"][number]["profissional"]>; vinculos: Array<{ turmaId: string; tipo: string; disciplina: string | null }> }
      >();
      for (const turma of turmasEscola) {
        for (const vinculo of turma.professores) {
          if (!vinculo.profissional?.ativo) continue;
          const atual = vinculosPorDocente.get(vinculo.profissionalId) ?? {
            profissional: vinculo.profissional,
            vinculos: [],
          };
          atual.vinculos.push({
            turmaId: turma.id,
            tipo: vinculo.tipo,
            disciplina: vinculo.disciplina,
          });
          vinculosPorDocente.set(vinculo.profissionalId, atual);
        }
      }
      const docentes = [...vinculosPorDocente.values()].sort((a, b) =>
        a.profissional.nome.localeCompare(b.profissional.nome, "pt-BR")
      );
      for (const docente of docentes) {
        emitirRegistro30Profissional(docente.profissional);
        for (const vinculo of docente.vinculos) {
          const linha50 = push([
            "50",
            codigoInep,
            docente.profissional.id,
            vinculo.turmaId,
            vinculo.tipo === "PROFESSOR"
              ? "1"
              : vinculo.tipo === "AUXILIAR"
                ? "2"
                : "",
            this.campo(vinculo.disciplina),
          ]);
          pendencias.push({
            linha: linha50,
            registro: "50",
            entidade: "VINCULO_DOCENTE",
            entidadeId: docente.profissional.id,
            entidadeNome: docente.profissional.nome,
            campo: "disciplina",
            posicao: 6,
            nivel: "AVISO",
            motivo: "Disciplina em texto livre — layout oficial exige código",
          });
        }
      }

      // ---------- Alunos: 30 + 60 (8 campos) por matrícula ----------
      const matriculasEscola = matriculasPorEscola.get(escola.id) ?? [];
      for (const matricula of matriculasEscola) {
        const cpf = this.soDigitos(matricula.cpfAluno);
        const nis = this.soDigitos(matricula.nisAluno);
        const nacionalidadeCodigo =
          !matricula.nacionalidade ||
          normalizarTexto(matricula.nacionalidade) === "BRASILEIRA"
            ? "1"
            : "3";
        const corRaca = matricula.corRaca
          ? (MAPA_COR_RACA[normalizarTexto(matricula.corRaca)] ?? "0")
          : "0";

        const linha30 = push([
          "30",
          codigoInep,
          matricula.id, // não existe model Aluno — a matrícula é a pessoa
          "",
          cpf,
          this.campo(matricula.nomeAluno),
          this.dataBR(matricula.dataNascimento),
          MAPA_SEXO[matricula.sexo] ?? "",
          corRaca,
          nacionalidadeCodigo,
          "", // naturalidade é texto livre; layout exige código IBGE
          nis,
          this.campo(matricula.nomeResponsavel),
        ]);
        const pendAluno = (
          p: Omit<PendenciaEducacenso, "linha" | "entidade" | "entidadeId" | "entidadeNome">,
          linha: number
        ) =>
          pendencias.push({
            ...p,
            linha,
            entidade: p.registro === "60" ? "VINCULO_ALUNO" : "PESSOA",
            entidadeId: matricula.id,
            entidadeNome: matricula.nomeAluno,
          });

        pendAluno(
          {
            registro: "30",
            campo: "identificacaoInep",
            posicao: 4,
            nivel: "AVISO",
            motivo: "ID INEP não armazenado",
          },
          linha30
        );
        if (!cpf) {
          pendAluno(
            {
              registro: "30",
              campo: "cpf",
              posicao: 5,
              nivel: "AVISO",
              motivo: "CPF não cadastrado",
            },
            linha30
          );
        }
        if (matricula.naturalidade) {
          pendAluno(
            {
              registro: "30",
              campo: "municipioNascimento",
              posicao: 11,
              nivel: "AVISO",
              motivo: "Naturalidade textual — informar código IBGE manualmente",
            },
            linha30
          );
        }
        if (!nis) {
          pendAluno(
            {
              registro: "30",
              campo: "nis",
              posicao: 12,
              nivel: "AVISO",
              motivo: "NIS do aluno não cadastrado",
            },
            linha30
          );
        }

        const turmaDaMatricula = matricula.turmaId
          ? turmaPorId.get(matricula.turmaId)
          : undefined;
        const linha60 = push([
          "60",
          codigoInep,
          matricula.id,
          matricula.turmaId ?? "",
          matricula.numeroMatricula,
          turmaDaMatricula ? this.codigoEtapa(turmaDaMatricula.serie.nome) : "",
          matricula.possuiDeficiencia ? "1" : "0",
          "", // transporte escolar público não cadastrado
        ]);
        if (!matricula.turmaId) {
          pendAluno(
            {
              registro: "60",
              campo: "codigoTurma",
              posicao: 4,
              nivel: "ERRO",
              motivo: "Matrícula ativa sem turma",
            },
            linha60
          );
        }
        pendAluno(
          {
            registro: "60",
            campo: "transporteEscolarPublico",
            posicao: 8,
            nivel: "AVISO",
            motivo: "Transporte escolar não cadastrado",
          },
          linha60
        );
      }
    }

    // ---------- Registro 99 — fim de arquivo (uma única linha) ----------
    linhas.push("99|");
    const conteudo = linhas.join("\r\n") + "\r\n";

    const nomeArquivo = params.escolaId
      ? `educacenso_${anoLetivo.ano}_${codigoInepEscolaFiltrada ?? params.escolaId}.txt`
      : `educacenso_${anoLetivo.ano}_rede.txt`;

    const pendenciasPorNivel = pendencias.reduce(
      (acc, p) => {
        acc[p.nivel] += 1;
        return acc;
      },
      { ERRO: 0, AVISO: 0 }
    );

    return {
      nomeArquivo,
      conteudo,
      resumo: {
        ano: anoLetivo.ano,
        totalEscolas: escolas.length,
        totalTurmas: turmas.length,
        totalAlunos: matriculas.length,
        totalProfissionais: profissionaisExportados.size,
        totalLinhas: linhas.length,
        totalPendencias: pendencias.length,
        pendenciasPorNivel,
      },
      pendencias,
    };
  }
}

export const exportacaoEducacensoService = new ExportacaoEducacensoService();
