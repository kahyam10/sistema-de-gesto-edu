import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Buildings, GraduationCap, ChalkboardTeacher, UserPlus, ListNumbers } from '@phosphor-icons/react'
import { EscolasManager } from '@/components/enrollment/EscolasManager'
import { EtapasManager } from '@/components/enrollment/EtapasManager'
import { TurmasManager } from '@/components/enrollment/TurmasManager'
import { MatriculasManager } from '@/components/enrollment/MatriculasManager'

export function CadastrosTab() {
  const [activeSubTab, setActiveSubTab] = useState('etapas')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Sistema de Cadastros</h2>
        <p className="text-muted-foreground mt-2">
          Gerencie escolas, etapas de ensino, turmas e matrículas de alunos
        </p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="etapas" className="flex items-center gap-2">
            <GraduationCap size={18} />
            <span className="hidden sm:inline">Etapas & Séries</span>
            <span className="sm:hidden">Etapas</span>
          </TabsTrigger>
          <TabsTrigger value="escolas" className="flex items-center gap-2">
            <Buildings size={18} />
            Escolas
          </TabsTrigger>
          <TabsTrigger value="turmas" className="flex items-center gap-2">
            <ChalkboardTeacher size={18} />
            Turmas
          </TabsTrigger>
          <TabsTrigger value="matriculas" className="flex items-center gap-2">
            <UserPlus size={18} />
            Matrículas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="etapas" className="mt-6">
          <EtapasManager />
        </TabsContent>

        <TabsContent value="escolas" className="mt-6">
          <EscolasManager />
        </TabsContent>

        <TabsContent value="turmas" className="mt-6">
          <TurmasManager />
        </TabsContent>

        <TabsContent value="matriculas" className="mt-6">
          <MatriculasManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
