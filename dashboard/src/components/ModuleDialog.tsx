import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Circle } from '@phosphor-icons/react'
import { Module } from '@/lib/types'
import { Button } from '@/components/ui/button'

interface ModuleDialogProps {
  module: Module | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggleSubModule: (moduleId: string, subModuleId: string) => void
}

const statusLabels = {
  planning: 'Planejamento',
  'in-progress': 'Em Progresso',
  completed: 'Concluído',
  blocked: 'Bloqueado'
}

const statusColors = {
  planning: 'bg-muted text-muted-foreground',
  'in-progress': 'bg-secondary text-secondary-foreground',
  completed: 'bg-accent text-accent-foreground',
  blocked: 'bg-destructive text-destructive-foreground'
}

export function ModuleDialog({ module, open, onOpenChange, onToggleSubModule }: ModuleDialogProps) {
  if (!module) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{module.name}</DialogTitle>
          <DialogDescription className="text-base">
            {module.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="flex items-center gap-3">
            <Badge className={statusColors[module.status]}>
              {statusLabels[module.status]}
            </Badge>
            <Badge variant="outline">Fase {module.phase}</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progresso Geral</span>
              <span className="text-sm font-bold">{module.progress}%</span>
            </div>
            <Progress value={module.progress} className="h-3" />
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold text-lg mb-4">
              Submódulos ({module.subModules.length})
            </h4>
            <div className="space-y-3">
              {module.subModules.map((subModule) => (
                <div
                  key={subModule.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 mt-0.5"
                    onClick={() => onToggleSubModule(module.id, subModule.id)}
                  >
                    {subModule.status === 'completed' ? (
                      <CheckCircle className="text-accent" size={20} weight="fill" />
                    ) : (
                      <Circle className="text-muted-foreground" size={20} />
                    )}
                  </Button>
                  <div className="flex-1">
                    <h5 className="font-medium text-sm mb-1">{subModule.name}</h5>
                    <p className="text-xs text-muted-foreground">
                      {subModule.description}
                    </p>
                    <Badge
                      className={`${statusColors[subModule.status]} mt-2`}
                      variant="secondary"
                    >
                      {statusLabels[subModule.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
