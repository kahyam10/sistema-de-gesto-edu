import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GraduationCap, ListChecks, Calendar, ChartBar, Code } from '@phosphor-icons/react'
import { Module, Phase, KPI, TechStack } from '@/lib/types'
import { modules as initialModules, phases, kpis, techStack } from '@/lib/data'
import { OverviewTab } from '@/components/OverviewTab'
import { ModulesTab } from '@/components/ModulesTab'
import { TimelineTab } from '@/components/TimelineTab'
import { KPITab } from '@/components/KPITab'
import { TechStackTab } from '@/components/TechStackTab'
import { toast, Toaster } from 'sonner'

function App() {
  const [modules, setModules] = useKV<Module[]>('educational-system-modules', initialModules)
  const [activeTab, setActiveTab] = useState('overview')

  const handleToggleSubModule = (moduleId: string, subModuleId: string) => {
    setModules((currentModules) => {
      if (!currentModules) return initialModules

      const updatedModules = currentModules.map(module => {
        if (module.id !== moduleId) return module

        const updatedSubModules = module.subModules.map(subModule => {
          if (subModule.id !== subModuleId) return subModule
          
          const newStatus: Module['status'] = subModule.status === 'completed' ? 'planning' : 'completed'
          
          if (newStatus === 'completed') {
            toast.success('Recurso concluído!', {
              description: subModule.name
            })
          }
          
          return { ...subModule, status: newStatus }
        })

        const completedCount = updatedSubModules.filter(sm => sm.status === 'completed').length
        const progress = Math.round((completedCount / updatedSubModules.length) * 100)
        
        let moduleStatus: Module['status'] = module.status
        if (progress === 100) {
          moduleStatus = 'completed'
        } else if (progress > 0) {
          moduleStatus = 'in-progress'
        } else {
          moduleStatus = 'planning'
        }

        return {
          ...module,
          subModules: updatedSubModules,
          progress,
          status: moduleStatus
        }
      })

      return updatedModules
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="text-primary" size={32} weight="fill" />
            <div>
              <h1 className="text-xl font-bold">Sistema de Gestão Educacional</h1>
              <p className="text-xs text-muted-foreground">Ibirapitanga - Dashboard de Progresso</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-8 h-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2 py-3">
              <ChartBar size={18} />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="modules" className="flex items-center gap-2 py-3">
              <ListChecks size={18} />
              <span className="hidden sm:inline">Módulos</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2 py-3">
              <Calendar size={18} />
              <span className="hidden sm:inline">Cronograma</span>
            </TabsTrigger>
            <TabsTrigger value="kpis" className="flex items-center gap-2 py-3">
              <ChartBar size={18} />
              <span className="hidden sm:inline">KPIs</span>
            </TabsTrigger>
            <TabsTrigger value="tech" className="flex items-center gap-2 py-3">
              <Code size={18} />
              <span className="hidden sm:inline">Tech Stack</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab modules={modules || []} />
          </TabsContent>

          <TabsContent value="modules">
            <ModulesTab modules={modules || []} onToggleSubModule={handleToggleSubModule} />
          </TabsContent>

          <TabsContent value="timeline">
            <TimelineTab phases={phases} modules={modules || []} />
          </TabsContent>

          <TabsContent value="kpis">
            <KPITab kpis={kpis} />
          </TabsContent>

          <TabsContent value="tech">
            <TechStackTab techStack={techStack} />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t mt-16 py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">KSsoft - Soluções Tecnológicas</p>
              <p className="text-xs text-muted-foreground">Autor: Kahyam Souza Santos</p>
            </div>
            <div className="text-sm text-muted-foreground">
              Dashboard de Progresso do Projeto
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App