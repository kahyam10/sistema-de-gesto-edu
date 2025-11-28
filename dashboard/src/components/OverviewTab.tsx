'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useModules, usePhases } from '@/hooks/useApi'
import { CheckCircle, Clock, Rocket, WarningCircle, Spinner } from '@phosphor-icons/react'

export function OverviewTab() {
  const { data: modules = [], isLoading: modulesLoading } = useModules()
  const { data: phases = [], isLoading: phasesLoading } = usePhases()

  const isLoading = modulesLoading || phasesLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dados...</span>
      </div>
    )
  }

  const totalModules = modules.length
  const completedModules = modules.filter(m => m.status === 'completed').length
  const inProgressModules = modules.filter(m => m.status === 'in-progress').length
  const planningModules = modules.filter(m => m.status === 'planning').length
  const blockedModules = modules.filter(m => m.status === 'blocked').length

  const totalSubModules = modules.reduce((sum, m) => sum + (m.subModules?.length || 0), 0)
  const completedSubModules = modules.reduce(
    (sum, m) => sum + (m.subModules?.filter(sm => sm.status === 'completed').length || 0),
    0
  )

  const overallProgress = totalModules > 0
    ? Math.round(modules.reduce((sum, m) => sum + m.progress, 0) / totalModules)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Sistema de Gestao Educacional</h2>
        <p className="text-muted-foreground text-lg">Municipio de Ibirapitanga - Progresso do Desenvolvimento</p>
      </div>

      <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Progresso Geral</h3>
              <p className="text-muted-foreground">{completedModules} de {totalModules} modulos concluidos</p>
            </div>
            <div className="text-5xl font-bold text-primary">{overallProgress}%</div>
          </div>
          <Progress value={overallProgress} className="h-4" />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" weight="fill" />
            </div>
            <div><p className="text-sm text-muted-foreground">Concluidos</p><p className="text-2xl font-bold">{completedModules}</p></div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Rocket className="h-6 w-6 text-blue-600" />
            </div>
            <div><p className="text-sm text-muted-foreground">Em Progresso</p><p className="text-2xl font-bold">{inProgressModules}</p></div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
              <Clock className="h-6 w-6 text-slate-600" />
            </div>
            <div><p className="text-sm text-muted-foreground">Planejamento</p><p className="text-2xl font-bold">{planningModules}</p></div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <WarningCircle className="h-6 w-6 text-red-600" />
            </div>
            <div><p className="text-sm text-muted-foreground">Bloqueados</p><p className="text-2xl font-bold">{blockedModules}</p></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Submodulos</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Total de Submodulos</span><span className="font-bold">{totalSubModules}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Concluidos</span><span className="font-bold text-green-600">{completedSubModules}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Pendentes</span><span className="font-bold text-orange-600">{totalSubModules - completedSubModules}</span></div>
            <Progress value={totalSubModules > 0 ? (completedSubModules / totalSubModules) * 100 : 0} className="h-2" />
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Fases do Projeto</h3>
          <div className="space-y-3">
            {phases.map((phase, index) => (
              <div key={phase.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${phase.status === 'completed' ? 'bg-green-500' : phase.status === 'in-progress' ? 'bg-blue-500' : phase.status === 'blocked' ? 'bg-red-500' : 'bg-slate-400'}`}>{index + 1}</div>
                  <span className="text-sm">{phase.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{phase.duration}</span>
              </div>
            ))}
            {phases.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma fase cadastrada</p>}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Modulos por Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.slice(0, 6).map(module => (
            <div key={module.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium truncate">{module.name}</h4>
                <span className={`w-2 h-2 rounded-full ${module.status === 'completed' ? 'bg-green-500' : module.status === 'in-progress' ? 'bg-blue-500' : module.status === 'blocked' ? 'bg-red-500' : 'bg-slate-400'}`} />
              </div>
              <Progress value={module.progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">{module.progress}% completo</p>
            </div>
          ))}
        </div>
        {modules.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum modulo cadastrado. Acesse a aba "Modulos" para adicionar.</p>}
      </Card>
    </div>
  )
}
