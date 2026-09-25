export type ProfessorStack = {
  Inicio: undefined;
  Turma: { turmaId: string; turmaNome: string };
  Chamada: { turmaId: string; turmaNome: string };
  Notas: { turmaId: string; turmaNome: string };
  NovaAvaliacao: { turmaId: string; turmaNome: string; disciplinaId: string };
  LancarNotas: { turmaId: string; turmaNome: string; avaliacaoId: string };
};

export type ResponsavelStack = {
  Alunos: undefined;
  Aluno: { matriculaId: string; nomeAluno: string };
};
