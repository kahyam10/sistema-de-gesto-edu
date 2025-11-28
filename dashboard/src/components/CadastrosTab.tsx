import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Buildings, GraduationCap, Users, UserPlus, Student } from '@phosphor-icons/react'
import { EscolasManager } from '@/components/enrollment/EscolasManager'
import { EtapasManager } from '@/components/enrollment/EtapasManager'
import { TurmasManager } from '@/components/enrollment/TurmasManager'
import { MatriculasManager } from '@/components/enrollment/MatriculasManager'
import { ProfissionaisManager } from '@/components/enrollment/ProfissionaisManager'
import { TurmaDetails } from '@/components/enrollment/TurmaDetails'
import type { Turma } from '@/lib/api'

export function CadastrosTab() {
  const [activeSubTab, setActiveSubTab] = useState('etapas')
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null)

  useEffect(() => {
    setSelectedTurma(null)
  }, [activeSubTab])

  const handleViewTurmaDetails = (turma: Turma) => {
    setSelectedTurma(turma)
  }

  const handleBackToList = () => {
    setSelectedTurma(null)
  }

  if (selectedTurma) {
    return <TurmaDetails turma={selectedTurma} onBack={handleBackToList} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Sistema de Cadastros</h2>
        <p className="text-muted-foreground mt-2">
          Gerencie escolas, etapas de ensino, turmas, profissionais e matrículas de alunos
        </p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="etapas" className="flex items-center gap-2 py-3">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Etapas & Séries</span>
            <span className="sm:hidden">Etapas</span>
          </TabsTrigger>
          <TabsTrigger value="escolas" className="flex items-center gap-2 py-3">
            <Buildings className="h-4 w-4" />
            Escolas
          </TabsTrigger>
          <TabsTrigger value="profissionais" className="flex items-center gap-2 py-3">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Profissionais</span>
            <span className="sm:hidden">Profs</span>
          </TabsTrigger>
          <TabsTrigger value="turmas" className="flex items-center gap-2 py-3">
            <Student className="h-4 w-4" />
            Turmas
          </TabsTrigger>
          <TabsTrigger value="matriculas" className="flex items-center gap-2 py-3">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Matrículas</span>
            <span className="sm:hidden">Matríc.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="etapas" className="mt-6">
          <EtapasManager />
        </TabsContent>

        <TabsContent value="escolas" className="mt-6">
          <EscolasManager />
        </TabsContent>

        <TabsContent value="profissionais" className="mt-6">
          <ProfissionaisManager />
        </TabsContent>

        <TabsContent value="turmas" className="mt-6">
          <TurmasManager onViewDetails={handleViewTurmaDetails} />
        </TabsContent>

        <TabsContent value="matriculas" className="mt-6">
          <MatriculasManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
