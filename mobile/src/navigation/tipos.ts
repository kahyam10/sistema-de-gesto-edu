// Um param list por perfil: as abas reaproveitam as mesmas telas
// (ex.: Chamada abre tanto de "Hoje" quanto de "Turmas"). As telas comuns
// (comunicados, agenda, perfil e seus atalhos) existem nos dois perfis.
export type ComumStack = {
  Comunicados: undefined;
  Comunicado: { id: string };
  Agenda: undefined;
  Perfil: undefined;
  Notificacoes: undefined;
  Privacidade: undefined;
  Contatos: undefined;
};

export type ProfessorStack = ComumStack & {
  Inicio: undefined;
  Turmas: undefined;
  Turma: { turmaId: string; turmaNome: string };
  Chamada: { turmaId: string; turmaNome: string };
  Notas: { turmaId: string; turmaNome: string; aviso?: string };
  NovaAvaliacao: { turmaId: string; turmaNome: string; disciplinaId: string; bimestre: number };
  LancarNotas: { turmaId: string; turmaNome: string; avaliacaoId: string };
};

export type ResponsavelStack = ComumStack & {
  Inicio: undefined;
  Aluno: { matriculaId: string; nomeAluno: string };
};
