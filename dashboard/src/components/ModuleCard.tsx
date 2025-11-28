import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Circle } from '@phosphor-icons/react'
import { Module } from '@/lib/types'
import { motion } from 'framer-motion'

interface ModuleCardProps {
  module: Module
  onClick: () => void
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

export function ModuleCard({ module, onClick }: ModuleCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/50"
        onClick={onClick}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2 text-foreground">
                {module.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {module.description}
              </p>
            </div>
            {module.status === 'completed' ? (
              <CheckCircle className="text-accent flex-shrink-0" size={24} weight="fill" />
            ) : (
              <Circle className="text-muted-foreground flex-shrink-0" size={24} />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium text-foreground">{module.progress}%</span>
            </div>
            <Progress value={module.progress} className="h-2" />
          </div>

          <div className="flex items-center justify-between gap-2">
            <Badge className={statusColors[module.status]}>
              {statusLabels[module.status]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Fase {module.phase}
            </Badge>
          </div>

          <div className="text-xs text-muted-foreground">
            {module.subModules.length} submódulos
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
