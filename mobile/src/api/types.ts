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
  frequenciasPendentesHoje: Array<{ turmaId: string; turmaNome: string }>;
}

export type StatusFrequencia = "PRESENTE" | "FALTA" | "JUSTIFICADA";

export interface Chamada {
  turma: { id: string; nome: string; turno: string; escola: { nome: string } };
  data: string;
  jaRegistrada: boolean;
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
