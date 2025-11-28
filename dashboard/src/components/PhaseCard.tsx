import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phase, Module } from '@/lib/types'
import { ArrowRight } from '@phosphor-icons/react'

interface PhaseCardProps {
  phase: Phase
  modules: Module[]
  isLast: boolean
}

const statusColors = {
  planning: 'bg-muted text-muted-foreground',
  'in-progress': 'bg-secondary text-secondary-foreground',
  completed: 'bg-accent text-accent-foreground',
  blocked: 'bg-destructive text-destructive-foreground'
}

export function PhaseCard({ phase, modules, isLast }: PhaseCardProps) {
  const phaseModules = modules.filter(m => phase.modules.includes(m.id))
  const avgProgress = phaseModules.length > 0
    ? Math.round(phaseModules.reduce((sum, m) => sum + m.progress, 0) / phaseModules.length)
    : 0

  return (
    <div className="relative">
      <Card className="p-6 border-2">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-xl mb-1">{phase.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{phase.monthRange}</p>
              <p className="text-sm text-foreground">{phase.description}</p>
            </div>
            <Badge className={statusColors[phase.status]}>
              {avgProgress}% completo
            </Badge>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Módulos Incluídos
            </h4>
            <div className="space-y-2">
              {phaseModules.map(module => (
                <div
                  key={module.id}
                  className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50"
                >
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="flex-1">{module.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {module.progress}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Duração: {phase.duration}</span>
          </div>
        </div>
      </Card>

      {!isLast && (
        <div className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center">
          <ArrowRight className="text-primary" size={32} weight="bold" />
        </div>
      )}
    </div>
  )
}
