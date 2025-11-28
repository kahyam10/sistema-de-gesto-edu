'use client'

import { useState } from 'react'
import { useModules } from '@/hooks/useApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Plus, GraduationCap, Users, BookOpen, Calendar, ListChecks, ArrowLeft, Buildings, ListNumbers, Spinner, Wrench } from '@phosphor-icons/react'
import { SeriesManager } from '@/components/enrollment/SeriesManager'
import { EtapasManager } from '@/components/enrollment/EtapasManager'
import { EscolasManager } from '@/components/enrollment/EscolasManager'
import { MatriculasManager } from '@/components/enrollment/MatriculasManager'
import { TurmasManager } from '@/components/enrollment/TurmasManager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const moduleIcons: Record<string, React.ReactNode> = {
  'Matriculas': <GraduationCap size={24} />,
  'Gestao de RH': <Users size={24} />,
  'Pedagogico': <BookOpen size={24} />,
  'Calendario': <Calendar size={24} />,
  'Planejamento': <ListChecks size={24} />,
}

export function DevelopmentTab() {
  const { data: modules = [], isLoading } = useModules()
  const [selectedModule, setSelectedModule] = useState<string | null>(null)

  if (isLoading) { return (<div className="flex items-center justify-center py-12"><Spinner className="h-8 w-8 animate-spin text-primary" /><span className="ml-2">Carregando modulos...</span></div>) }

  const matriculasModule = modules.find(m => m.name.toLowerCase().includes('matricula') || m.name.toLowerCase().includes('aluno'))

  if (selectedModule === matriculasModule?.id || selectedModule === 'matriculas') {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedModule(null)} className="gap-2"><ArrowLeft size={18} />Voltar para Desenvolvimento</Button>
        <Tabs defaultValue="series" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="series" className="gap-2"><ListNumbers size={18} />Series</TabsTrigger>
            <TabsTrigger value="etapas" className="gap-2"><GraduationCap size={18} />Etapas</TabsTrigger>
            <TabsTrigger value="escolas" className="gap-2"><Buildings size={18} />Escolas</TabsTrigger>
            <TabsTrigger value="turmas" className="gap-2"><Users size={18} />Turmas</TabsTrigger>
            <TabsTrigger value="matriculas" className="gap-2"><BookOpen size={18} />Matriculas</TabsTrigger>
          </TabsList>
          <TabsContent value="series"><SeriesManager /></TabsContent>
          <TabsContent value="etapas"><EtapasManager /></TabsContent>
          <TabsContent value="escolas"><EscolasManager /></TabsContent>
          <TabsContent value="turmas"><TurmasManager /></TabsContent>
          <TabsContent value="matriculas"><MatriculasManager /></TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold mb-2">Ambiente de Desenvolvimento</h2><p className="text-muted-foreground">Selecione um modulo para acessar as ferramentas de desenvolvimento</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(module => {
          const icon = moduleIcons[module.name] || <Wrench size={24} />
          const isMatriculas = module.name.toLowerCase().includes('matricula') || module.name.toLowerCase().includes('aluno')
          return (
            <Card key={module.id} className={`cursor-pointer transition-all hover:shadow-lg ${isMatriculas ? 'border-primary/50 bg-primary/5' : ''}`} onClick={() => { if (isMatriculas) { setSelectedModule(module.id) } }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-muted rounded-lg">{icon}</div>
                  <Badge variant={module.status === 'completed' ? 'default' : module.status === 'in-progress' ? 'secondary' : module.status === 'blocked' ? 'destructive' : 'outline'}>{module.status === 'completed' ? 'Concluido' : module.status === 'in-progress' ? 'Em Progresso' : module.status === 'blocked' ? 'Bloqueado' : 'Planejamento'}</Badge>
                </div>
                <CardTitle className="text-lg mt-4">{module.name}</CardTitle>
                <CardDescription className="line-clamp-2">{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Progresso</span><span className="font-medium">{module.progress}%</span></div>
                  <Progress value={module.progress} className="h-2" />
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{module.subModules?.length || 0} submodulos</span>
                  {isMatriculas && <Button size="sm" variant="outline">Desenvolver</Button>}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      {modules.length === 0 && (<Card className="p-12"><div className="text-center"><Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-semibold mb-2">Nenhum modulo cadastrado</h3><p className="text-muted-foreground mb-4">Acesse a aba "Modulos" para criar os modulos do sistema.</p></div></Card>)}
      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-4">Sobre o Ambiente de Desenvolvimento</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Modulo de Matriculas:</strong> Clique para acessar o gerenciamento completo de series, etapas, escolas, turmas e matriculas.</p>
          <p>• <strong>Outros Modulos:</strong> Estao em fase de planejamento e serao habilitados conforme o cronograma.</p>
          <p>• Use a aba "Modulos" para gerenciar todos os modulos e submodulos do sistema.</p>
        </div>
      </Card>
    </div>
  )
}
