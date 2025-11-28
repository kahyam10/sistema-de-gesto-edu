import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, GraduationCap, Users, BookOpen, Calendar, ListChecks, ArrowLeft, Buildings, ListNumbers } from '@phosphor-icons/react'
import { Module } from '@/lib/types'
import { SeriesManager } from '@/components/enrollment/SeriesManager'
import { EtapasManager } from '@/components/enrollment/EtapasManager'
import { EscolasManager } from '@/components/enrollment/EscolasManager'
import { MatriculasManager } from '@/components/enrollment/MatriculasManager'
import { TurmasManager } from '@/components/enrollment/TurmasManager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface DevelopmentTabProps {
  modules: Module[]
}

export function DevelopmentTab({ modules }: DevelopmentTabProps) {
  const [selectedModule, setSelectedModule] = useState<string | null>(null)

  if (selectedModule === 'mod-1') {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedModule(null)}
          className="gap-2"
        >
          <ArrowLeft size={18} />
          Voltar para Desenvolvimento
        </Button>
        
        <Tabs defaultValue="series" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="series" className="gap-2">
              <ListNumbers size={18} />
              Séries
            </TabsTrigger>
            <TabsTrigger value="etapas" className="gap-2">
              <GraduationCap size={18} />
              Etapas
            </TabsTrigger>
            <TabsTrigger value="escolas" className="gap-2">
              <Buildings size={18} />
              Escolas
            </TabsTrigger>
            <TabsTrigger value="turmas" className="gap-2">
              <Users size={18} />
              Turmas
            </TabsTrigger>
            <TabsTrigger value="matriculas" className="gap-2">
              <Users size={18} />
              Matrículas
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="series">
            <SeriesManager />
          </TabsContent>
          
          <TabsContent value="etapas">
            <EtapasManager />
          </TabsContent>
          
          <TabsContent value="escolas">
            <EscolasManager />
          </TabsContent>
          
          <TabsContent value="turmas">
            <TurmasManager />
          </TabsContent>
          
          <TabsContent value="matriculas">
            <MatriculasManager />
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  const priorityModules = modules.filter(m => m.phase === 1 || m.phase === 2)

  const getModuleIcon = (iconName: string) => {
    const icons: Record<string, React.ReactElement> = {
      'UserPlus': <Users size={24} weight="duotone" className="text-primary" />,
      'BookOpen': <BookOpen size={24} weight="duotone" className="text-primary" />,
      'Layout': <ListChecks size={24} weight="duotone" className="text-primary" />,
      'Users': <Users size={24} weight="duotone" className="text-primary" />
    }
    return icons[iconName] || <GraduationCap size={24} weight="duotone" className="text-primary" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Desenvolvimento do Sistema</h2>
          <p className="text-muted-foreground mt-2">
            Comece a construir os módulos funcionais do sistema educacional
          </p>
        </div>
        <Button size="lg" className="gap-2">
          <Plus size={20} weight="bold" />
          Novo Módulo
        </Button>
      </div>

      <Card className="bg-accent/10 border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="text-accent" size={24} weight="duotone" />
            Próximos Passos
          </CardTitle>
          <CardDescription>
            Módulos prioritários para iniciar o desenvolvimento (Fases 1 e 2)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {priorityModules.map((module) => (
              <Card 
                key={module.id}
                className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-1"
                onClick={() => setSelectedModule(module.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getModuleIcon(module.icon)}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{module.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {module.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Fase {module.phase}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Submódulos</span>
                    <span className="font-semibold">{module.subModules.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent transition-all duration-500"
                        style={{ width: `${module.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {module.progress}%
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedModule(module.id)
                    }}
                  >
                    Iniciar Desenvolvimento
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Módulos Ativos</CardTitle>
            <CardDescription>Em desenvolvimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {modules.filter(m => m.status === 'in-progress').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Planejados</CardTitle>
            <CardDescription>Aguardando início</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">
              {modules.filter(m => m.status === 'planning').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Completos</CardTitle>
            <CardDescription>Finalizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              {modules.filter(m => m.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estrutura do Sistema</CardTitle>
          <CardDescription>
            Arquitetura e organização do projeto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Frontend</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Next.js + TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• Componentes Shadcn</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Backend</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Node.js + Fastify</li>
                <li>• PostgreSQL + Prisma</li>
                <li>• API REST</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Segurança</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• JWT Authentication</li>
                <li>• LGPD Compliance</li>
                <li>• Backup Automático</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
