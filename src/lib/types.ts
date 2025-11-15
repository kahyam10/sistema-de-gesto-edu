export type ModuleStatus = 'planning' | 'in-progress' | 'completed' | 'blocked'

export interface SubModule {
  id: string
  name: string
  description: string
  status: ModuleStatus
}

export interface Module {
  id: string
  name: string
  description: string
  icon: string
  subModules: SubModule[]
  status: ModuleStatus
  phase: number
  progress: number
}

export interface Phase {
  id: string
  name: string
  monthRange: string
  duration: string
  modules: string[]
  status: ModuleStatus
  description: string
}

export interface KPI {
  id: string
  name: string
  description: string
  target: string
  current: string
  unit: string
  category: 'educational' | 'operational' | 'technical'
}

export interface TechStack {
  category: string
  items: {
    name: string
    description: string
    icon: string
  }[]
}

export interface ProgressUpdate {
  id: string
  date: string
  moduleId: string
  moduleName: string
  description: string
  type: 'completed' | 'started' | 'milestone'
}

export interface Serie {
  id: string
  nome: string
  ordem: number
}

export interface EtapaEnsino {
  id: string
  nome: string
  descricao: string
  series: Serie[]
}

export interface Escola {
  id: string
  nome: string
  codigo: string
  endereco: string
  telefone: string
  email: string
  etapasVinculadas: string[]
  ativa: boolean
}

export interface Matricula {
  id: string
  escolaId: string
  etapaEnsinoId: string
  serieId: string
  turmaId?: string
  nomeAluno: string
  dataNascimento: string
  cpfAluno: string
  nomeResponsavel: string
  cpfResponsavel: string
  telefoneResponsavel: string
  emailResponsavel: string
  endereco: string
  necessidadesEspeciais: boolean
  descricaoNecessidades?: string
  dataMatricula: string
  status: 'ativa' | 'cancelada' | 'concluida'
}

export interface Turma {
  id: string
  escolaId: string
  serieId: string
  nome: string
  turno: 'matutino' | 'vespertino' | 'noturno' | 'integral'
  anoLetivo: string
  capacidadeMaxima: number
  ativa: boolean
}
