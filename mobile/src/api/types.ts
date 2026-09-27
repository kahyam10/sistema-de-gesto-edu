export type Papel =
  | "ADMIN" | "SEMEC" | "DIRETOR" | "COORDENADOR" | "SECRETARIA"
  | "PROFESSOR" | "RESPONSAVEL" | "USER";

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  role: Papel;
  escolaId?: string | null;
}

export interface TokensResposta {
  user: Usuario;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ---------- Professor ----------
export interface ResumoProfessor {
  profissional: { id: string; nome: string };
  turmas: Array<{
    id: string;
    nome: string;
    turno: string;
    anoLetivo: number;
    escola: { id: string; nome: string };
    serie: { id: string; nome: string };
    disciplina: string | null;
    totalAlunosAtivos: number;
  }>;
  aulasHoje: Array<{ turmaId: string; turmaNome: string; disciplina: string; horaInicio: string; horaFim: string }>;
  chamadasRegistradasHoje: Array<{ turmaId: string; registradaEm: string | null }>;
  frequenciasPendentesHoje: Array<{ turmaId: string; turmaNome: string }>;
}

export type StatusFrequencia = "PRESENTE" | "FALTA" | "JUSTIFICADA";

export interface Chamada {
  turma: { id: string; nome: string; turno: string; escola: { nome: string } };
  data: string;
  jaRegistrada: boolean;
  registradaEm: string | null;
  alunos: Array<{
    id: string;
    nomeAluno: string;
    numeroMatricula: string;
    status: StatusFrequencia | null;
    justificativa: string | null;
  }>;
}

export interface Avaliacao {
  id: string;
  nome: string;
  tipo: string;
  bimestre: number;
  data: string;
  valorMaximo: number;
  peso: number;
  disciplinaId: string;
  notas: Array<{ matriculaId: string; valor: number }>;
}

export interface NotasDaTurma {
  turma: { id: string; nome: string };
  disciplinas: Array<{ id: string; nome: string; codigo: string }>;
  avaliacoes: Avaliacao[];
  alunos: Array<{ id: string; nomeAluno: string; numeroMatricula: string }>;
}

export interface AlunosDaTurma {
  turma: { id: string; nome: string; turno: string; escola: { nome: string }; serie: { nome: string } };
  frequenciaMedia: number | null;
  totalAbaixoDoLimite: number;
  alunos: Array<{
    id: string;
    nomeAluno: string;
    numeroMatricula: string;
    totalAulas: number;
    percentualPresenca: number | null;
    abaixoDoLimite: boolean;
  }>;
}

// ---------- Responsável ----------
export interface AlunoVinculado {
  vinculoId: string;
  tipoVinculo: "RESPONSAVEL" | "ALUNO";
  parentesco: string | null;
  matricula: {
    id: string;
    numeroMatricula: string;
    nomeAluno: string;
    anoLetivo: number;
    status: string;
    escola: { id: string; nome: string };
    etapa: { id: string; nome: string };
    turma: { id: string; nome: string; turno: string; serie: { id: string; nome: string } } | null;
  };
}

export type Situacao = "APROVADO" | "RECUPERACAO" | "REPROVADO" | "EM_CURSO";

export interface Boletim {
  matricula: { id: string; nomeAluno: string; numeroMatricula: string };
  turma: { id: string; nome: string; serie: string };
  disciplinas: Array<{
    disciplinaId: string;
    disciplinaNome: string;
    bimestres: Array<{ bimestre: number; media: number | null }>;
    mediaFinal: number | null;
    situacao: Situacao;
  }>;
  frequencia: { percentualPresenca: number; totalAulas: number; presencas: number; faltas: number; abaixoDoLimite: boolean };
  situacaoGeral: Situacao;
}

export interface FrequenciaAluno {
  matricula: { id: string; nomeAluno: string; turmaId: string | null };
  estatisticas: {
    totalAulas: number;
    presencas: number;
    faltas: number;
    faltasJustificadas: number;
    percentualPresenca: number;
    abaixoDoLimite: boolean;
  } | null;
  registros: Array<{ id: string; data: string; status: StatusFrequencia; justificativa?: string | null }>;
}

export interface Comunicado {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  categoria: string | null;
  dataPublicacao: string;
  destaque: boolean;
  autorNome: string;
  escola: { nome: string } | null;
  lido: boolean;
  confirmado: boolean;
}

// ---------- Comum (pais e professores) ----------
export interface Agenda {
  de: string;
  ate: string;
  eventos: Array<{
    id: string; titulo: string; descricao: string | null; dataInicio: string; dataFim: string | null;
    horaInicio: string | null; horaFim: string | null; tipo: string; escola: { nome: string } | null;
  }>;
  reunioes: Array<{
    id: string; titulo: string; descricao: string | null; data: string; horario: string; duracao: number | null;
    local: string | null; tipo: string; finalidade: string | null; status: string;
    escola: { nome: string }; turma: { nome: string } | null;
  }>;
  plantoes: Array<{
    id: string; data: string; tipo: string; descricao: string | null; horarioInicio: string; horarioFim: string;
    local: string | null; escola: { nome: string }; turma: { nome: string } | null;
  }>;
}

export interface CardapioSemana {
  de: string;
  ate: string;
  refeicoes: Array<{
    id: string; data: string; turno: string; tipoRefeicao: string; descricao: string;
    observacoesNutricionais: string | null; escola: { nome: string } | null;
  }>;
}

export interface EscolaContato {
  id: string; nome: string; telefone: string | null; email: string | null; endereco: string | null;
}

export interface MeusDados {
  usuario: { nome: string; email: string; papel: string; cadastradoEm: string };
  alunosVinculados: Array<{ nomeAluno: string; numeroMatricula: string; parentesco: string | null; escola: string; turma: string | null }>;
  turmasQueLeciona: Array<{ turma: string; escola: string }>;
  sessoesAtivas: number;
}

export interface Notificacao {
  id: string; titulo: string; mensagem: string; tipo: string; prioridade: string;
  acaoTipo: string | null; acaoId: string | null; lida: boolean; createdAt: string;
}

// ---------- Planejamento (planos de aula) ----------
export type StatusPlano = "RASCUNHO" | "ENVIADO" | "APROVADO" | "DEVOLVIDO";
type Ref = { id: string; nome: string };

export interface PlanoResumo {
  id: string;
  bimestre: number;
  dataAula: string;
  titulo: string;
  objetivos: string;
  status: StatusPlano;
  enviadoEm: string | null;
  parecer: string | null;
  revisadoEm: string | null;
  turmaId: string;
  disciplinaId: string;
  conteudoProgramaticoId: string | null;
  disciplina: Ref;
  revisadoPor: Ref | null;
  conteudoProgramatico: { id: string; titulo: string } | null;
}

export interface PlanoAula extends PlanoResumo {
  desenvolvimento: string | null;
  recursos: string | null;
  avaliacao: string | null;
  habilidadesBncc: string[];
  atividades: Array<{ id: string; titulo: string; tipo: string }>;
}

export interface DadosPlano {
  turmaId: string;
  disciplinaId: string;
  bimestre: number;
  dataAula: string;
  titulo: string;
  objetivos: string;
  desenvolvimento?: string;
  recursos?: string;
  avaliacao?: string;
  habilidadesBncc: string[];
  conteudoProgramaticoId?: string;
}

/** Conteúdo programático previsto para a turma (GET /api/planejamento/cobertura). */
export interface CoberturaTurma {
  disciplinas: Array<{
    disciplinaId: string;
    nome: string;
    conteudos: Array<{ id: string; titulo: string; bimestre: number; habilidadesBncc: string[] }>;
  }>;
}
