import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Module } from '@/lib/types'
import { CheckCircle, Clock, Rocket, WarningCircle } from '@phosphor-icons/react'

interface OverviewTabProps {
  modules: Module[]
}

export function OverviewTab({ modules }: OverviewTabProps) {
  const totalModules = modules.length
  const completedModules = modules.filter(m => m.status === 'completed').length
  const inProgressModules = modules.filter(m => m.status === 'in-progress').length
  const planningModules = modules.filter(m => m.status === 'planning').length
  const blockedModules = modules.filter(m => m.status === 'blocked').length

  const totalSubModules = modules.reduce((sum, m) => sum + m.subModules.length, 0)
  const completedSubModules = modules.reduce(
    (sum, m) => sum + m.subModules.filter(sm => sm.status === 'completed').length,
    0
  )

  const overallProgress = Math.round(
    modules.reduce((sum, m) => sum + m.progress, 0) / modules.length
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">
          Sistema de Gestão Educacional
        </h2>
        <p className="text-muted-foreground text-lg">
          Município de Ibirapitanga - Progresso do Desenvolvimento
        </p>
      </div>

      <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Progresso Geral do Projeto</h3>
            <span className="text-4xl font-bold text-primary">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-4" />
          <p className="text-sm text-muted-foreground">
            {completedSubModules} de {totalSubModules} recursos implementados
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Concluídos</p>
              <p className="text-3xl font-bold text-accent">{completedModules}</p>
            </div>
            <CheckCircle className="text-accent" size={32} weight="fill" />
          </div>
          <p className="text-xs text-muted-foreground">módulos finalizados</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Em Progresso</p>
              <p className="text-3xl font-bold text-secondary">{inProgressModules}</p>
            </div>
            <Rocket className="text-secondary" size={32} weight="fill" />
          </div>
          <p className="text-xs text-muted-foreground">em desenvolvimento</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Planejamento</p>
              <p className="text-3xl font-bold text-primary">{planningModules}</p>
            </div>
            <Clock className="text-primary" size={32} weight="fill" />
          </div>
          <p className="text-xs text-muted-foreground">aguardando início</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Bloqueados</p>
              <p className="text-3xl font-bold text-destructive">{blockedModules}</p>
            </div>
            <WarningCircle className="text-destructive" size={32} weight="fill" />
          </div>
          <p className="text-xs text-muted-foreground">necessitam atenção</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Informações do Projeto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Objetivo</h4>
            <p className="text-sm">
              Centralizar toda gestão educacional do município em uma plataforma única,
              automatizando processos administrativos e pedagógicos.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Escopo</h4>
            <p className="text-sm">
              9 módulos principais cobrindo matrículas, gestão pedagógica, portais de acesso,
              RH, programas especiais, alimentação, transporte, gestão democrática e comunicação.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Cronograma</h4>
            <p className="text-sm">
              Implementação em 4 fases ao longo de 12 meses, priorizando funcionalidades
              essenciais nas fases iniciais.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Autor</h4>
            <p className="text-sm font-medium">Kahyam Souza Santos</p>
            <p className="text-xs text-muted-foreground">KSsoft - Soluções Tecnológicas</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
