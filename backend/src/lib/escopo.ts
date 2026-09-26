// Escopo de dados por escola/turma aplicado NA CAMADA DE DADOS (extensão do
// Prisma). Toda consulta de um usuário com escopo recebe o filtro
// automaticamente — inclusive rotas futuras — e toda escrita tem as chaves
// (escolaId/turmaId/matriculaId/pai) verificadas contra o escopo.
// Sem contexto (seeds, testes de service, jobs) nada é filtrado.
import { Prisma } from "@prisma/client";
import type { Escopo } from "./contexto.js";
import { PermissionError } from "../errors/AppError.js";

type Where = Record<string, unknown>;

// Como cada model chega na escola/turma:
//  - escola: tem escolaId obrigatório
//  - escolaOpcional: escolaId null = registro da rede (leitura liberada, escrita não)
//  - via: herda o escopo do registro pai pela relação indicada
type Regra =
  | { tipo: "escola" }
  | { tipo: "escolaOpcional" }
  | { tipo: "via"; relacao: string; fk: string; pai: string };

const via = (relacao: string, fk: string, pai: string): Regra => ({ tipo: "via", relacao, fk, pai });

export const REGRAS: Record<string, Regra | "especial"> = {
  Escola: "especial",
  Turma: "especial",
  Matricula: "especial",
  ProfissionalEducacao: "especial",
  Sala: { tipo: "escola" },
  EscolaEtapa: { tipo: "escola" },
  EscolaProfissional: { tipo: "escola" },
  SalaRecursos: { tipo: "escola" },
  PlantaoPedagogico: { tipo: "escola" },
  ReuniaoPais: { tipo: "escola" },
  ItemEstoque: { tipo: "escola" },
  RegistroRefeicao: { tipo: "escola" },
  RotaEscola: { tipo: "escola" },
  ColegiadoEscolar: { tipo: "escola" },
  GremioEstudantil: { tipo: "escola" },
  ReuniaoDemocratica: { tipo: "escola" },
  AtividadeComplementar: { tipo: "escola" },
  EventoCalendario: { tipo: "escolaOpcional" },
  ConfiguracaoAvaliacao: { tipo: "escolaOpcional" },
  Cardapio: { tipo: "escolaOpcional" },
  Comunicado: { tipo: "escolaOpcional" },
  ConteudoProgramatico: { tipo: "escolaOpcional" },
  AtividadePedagogica: { tipo: "escolaOpcional" },
  PlanoAula: via("turma", "turmaId", "Turma"),
  PlanoAulaAtividade: via("plano", "planoId", "PlanoAula"),
  TurmaProfessor: via("turma", "turmaId", "Turma"),
  GradeHoraria: via("turma", "turmaId", "Turma"),
  Avaliacao: via("turma", "turmaId", "Turma"),
  Frequencia: via("turma", "turmaId", "Turma"),
  Nota: via("turma", "turmaId", "Turma"),
  LiderTurma: via("turma", "turmaId", "Turma"),
  TransferenciaMatricula: via("matricula", "matriculaId", "Matricula"),
  BuscaAtiva: via("matricula", "matriculaId", "Matricula"),
  PlanoEducacionalIndividualizado: via("matricula", "matriculaId", "Matricula"),
  AcompanhamentoIndividualizado: via("matricula", "matriculaId", "Matricula"),
  PresencaReuniao: via("matricula", "matriculaId", "Matricula"),
  DocumentoMatricula: via("matricula", "matriculaId", "Matricula"),
  MatriculaUsuario: via("matricula", "matriculaId", "Matricula"),
  RotaAluno: via("matricula", "matriculaId", "Matricula"),
  VisitaDomiciliar: via("buscaAtiva", "buscaAtivaId", "BuscaAtiva"),
  EncaminhamentoExterno: via("buscaAtiva", "buscaAtivaId", "BuscaAtiva"),
  AtendimentoAEE: via("salaRecursos", "salaRecursosId", "SalaRecursos"),
  MovimentacaoEstoque: via("item", "itemId", "ItemEstoque"),
  ChapaGremio: via("gremio", "gremioId", "GremioEstudantil"),
  AtividadeGremio: via("gremio", "gremioId", "GremioEstudantil"),
  PresencaReuniaoDemocratica: via("reuniao", "reuniaoId", "ReuniaoDemocratica"),
  MembroColegiado: via("colegiado", "colegiadoId", "ColegiadoEscolar"),
  AcParticipante: via("ac", "acId", "AtividadeComplementar"),
  FormacaoProfissional: via("profissional", "profissionalId", "ProfissionalEducacao"),
  CertificacaoProfissional: via("profissional", "profissionalId", "ProfissionalEducacao"),
  HistoricoContratacao: via("profissional", "profissionalId", "ProfissionalEducacao"),
  Afastamento: via("profissional", "profissionalId", "ProfissionalEducacao"),
  Licenca: via("profissional", "profissionalId", "ProfissionalEducacao"),
  Ponto: via("profissional", "profissionalId", "ProfissionalEducacao"),
  // Fora do escopo (dados da rede ou pessoais já protegidos): User, SessaoRefresh,
  // AuditLog, estrutura de ensino, Disciplina, AnoLetivo, módulos/fases,
  // transporte municipal (Veiculo, Motorista, RotaTransporte, Manutencao),
  // Notificacao e ComunicadoDestinatario (filtrados por usuário).
};

const NADA = "__sem_acesso__";

// Models "escolaOpcional" que o professor só lê da rede e das próprias escolas
const ESCOLA_OPCIONAL_DO_PROFESSOR = new Set(["Comunicado", "ConteudoProgramatico", "AtividadePedagogica"]); // id impossível: filtro que não casa com nada

/** Filtro de LEITURA de um model para o escopo. null = sem restrição. */
export function filtroLeitura(model: string, e: Escopo): Where | null {
  const regra = REGRAS[model];
  if (!regra) return null;
  const E = e.tipo === "ESCOLA" ? e.escolaId ?? NADA : null;

  if (regra === "especial") {
    switch (model) {
      case "Escola":
        return e.tipo === "ESCOLA" ? { id: E } : { id: { in: e.escolaIds } };
      case "Turma":
        return e.tipo === "ESCOLA" ? { escolaId: E } : { id: { in: e.turmaIds } };
      case "Matricula":
        return e.tipo === "ESCOLA" ? { escolaId: E } : { turmaId: { in: e.turmaIds } };
      case "ProfissionalEducacao":
        // Professor enxerga colegas (dados sensíveis são removidos na resposta)
        return e.tipo === "ESCOLA" ? { escolas: { some: { escolaId: E } } } : null;
    }
    return null;
  }
  if (regra.tipo === "escola") return e.tipo === "ESCOLA" ? { escolaId: E } : null;
  if (regra.tipo === "escolaOpcional") {
    if (e.tipo === "ESCOLA") return { OR: [{ escolaId: null }, { escolaId: E }] };
    // Professor: registros da rede + os das escolas em que leciona
    return ESCOLA_OPCIONAL_DO_PROFESSOR.has(model)
      ? { OR: [{ escolaId: null }, { escolaId: { in: e.escolaIds } }] }
      : null;
  }
  const doPai = filtroLeitura(regra.pai, e);
  return doPai ? { [regra.relacao]: doPai } : null;
}

/** Filtro de ESCRITA (update/delete): registros "da rede" não são editáveis por quem tem escopo. */
export function filtroEscrita(model: string, e: Escopo): Where | null {
  const regra = REGRAS[model];
  if (regra && regra !== "especial" && regra.tipo === "escolaOpcional" && e.tipo === "ESCOLA") {
    return { escolaId: e.escolaId ?? NADA };
  }
  return filtroLeitura(model, e);
}

// Erro de catálogo (PERM_007 → 403): as rotas já tratam AppError
export class EscopoNegadoError extends PermissionError {
  constructor(public detalhe: string) {
    super("PERM_007", { detalhe });
  }
}

type Verificador = (modelPai: string, id: string) => Promise<boolean>;

/** Confere as chaves de um "data" de create/update contra o escopo. */
export async function validarDados(
  model: string,
  data: Record<string, unknown> | undefined,
  e: Escopo,
  pertence: Verificador,
  criacao = false
) {
  if (!data || typeof data !== "object") return;
  const regra = REGRAS[model];
  const E = e.tipo === "ESCOLA" ? e.escolaId : null;

  // escolaId direto. Na CRIAÇÃO de registros de escola (inclusive os que
  // aceitam escolaId nulo = "da rede"), quem tem escopo só cria na própria
  // escola — omitir o escolaId não vira atalho para publicar na rede toda.
  // Na atualização, só se o campo vier (mudança de escola).
  const temEscola =
    model === "Turma" || model === "Matricula" ||
    (regra && regra !== "especial" && (regra.tipo === "escola" || regra.tipo === "escolaOpcional"));
  if (e.tipo === "ESCOLA" && temEscola && (criacao || "escolaId" in data) && data.escolaId !== E) {
    throw new EscopoNegadoError(`${model}.escolaId`);
  }
  // Chaves para turma/matrícula e para o pai declarado na regra
  const checagens: Array<[string, string]> = [];
  if (model !== "Turma" && typeof data.turmaId === "string") checagens.push(["Turma", data.turmaId]);
  if (model !== "Matricula" && typeof data.matriculaId === "string") checagens.push(["Matricula", data.matriculaId]);
  if (regra && regra !== "especial" && regra.tipo === "via") {
    const id = data[regra.fk];
    if (typeof id === "string") checagens.push([regra.pai, id]);
  }
  // Profissional criado/atualizado com vínculos de escola aninhados
  if (model === "ProfissionalEducacao" && e.tipo === "ESCOLA") {
    const esc = (data.escolas as { create?: Array<{ escolaId: string }> } | undefined)?.create;
    if (Array.isArray(esc) && esc.some((x) => x.escolaId !== E)) {
      throw new EscopoNegadoError("ProfissionalEducacao.escolas");
    }
  }
  for (const [pai, id] of checagens) {
    if (!(await pertence(pai, id))) throw new EscopoNegadoError(`${model} → ${pai}`);
  }
}

export const OPERACOES_LEITURA = new Set([
  "findUnique", "findUniqueOrThrow", "findFirst", "findFirstOrThrow", "findMany",
  "count", "aggregate", "groupBy",
]);
export const OPERACOES_ESCRITA_FILTRADA = new Set(["update", "updateMany", "delete", "deleteMany"]);

export const juntar = (where: unknown, filtro: Where): Where =>
  where && Object.keys(where as object).length > 0 ? { AND: [where as Where, filtro] } : filtro;

/** Para findUnique/update/delete o where precisa manter os campos únicos no topo. */
export const juntarUnico = (where: unknown, filtro: Where): Where => ({
  ...(where as Where),
  AND: [...(Array.isArray((where as Where)?.AND) ? ((where as Where).AND as Where[]) : []), filtro],
});

export type { Prisma };
