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
