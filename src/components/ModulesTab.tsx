import { useState } from 'react'
import { Module } from '@/lib/types'
import { ModuleCard } from './ModuleCard'
import { ModuleDialog } from './ModuleDialog'

interface ModulesTabProps {
  modules: Module[]
  onToggleSubModule: (moduleId: string, subModuleId: string) => void
}

export function ModulesTab({ modules, onToggleSubModule }: ModulesTabProps) {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleModuleClick = (module: Module) => {
    setSelectedModule(module)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Módulos do Sistema</h2>
        <p className="text-muted-foreground">
          Explore os 9 módulos principais e seus submódulos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            onClick={() => handleModuleClick(module)}
          />
        ))}
      </div>

      <ModuleDialog
        module={selectedModule}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onToggleSubModule={onToggleSubModule}
      />
    </div>
  )
}
