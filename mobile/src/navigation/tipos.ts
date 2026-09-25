// Um único param list por perfil: as abas reaproveitam as mesmas telas
// (ex.: Chamada abre tanto de "Hoje" quanto de "Turmas").
export type ProfessorStack = {
  Inicio: undefined;
  Turmas: undefined;
  Turma: { turmaId: string; turmaNome: string };
  Chamada: { turmaId: string; turmaNome: string };
  Notas: { turmaId: string; turmaNome: string; aviso?: string };
  NovaAvaliacao: { turmaId: string; turmaNome: string; disciplinaId: string; bimestre: number };
  LancarNotas: { turmaId: string; turmaNome: string; avaliacaoId: string };
};

export type ResponsavelStack = {
  Inicio: undefined;
  Aluno: { matriculaId: string; nomeAluno: string };
  Comunicados: undefined;
  Comunicado: { id: string };
};
