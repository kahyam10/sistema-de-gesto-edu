import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, GraduationCap, ChalkboardTeacher, UserCircle, UsersThree, Plus, X } from '@phosphor-icons/react'
import { Turma, Matricula, ProfissionalEducacao, Escola, EtapaEnsino } from '@/lib/types'
import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface TurmaDetailsProps {
  turma: Turma
  onBack: () => void
}

export function TurmaDetails({ turma, onBack }: TurmaDetailsProps) {
  const [turmas, setTurmas] = useKV<Turma[]>('school-turmas', [])
  const [matriculas, _] = useKV<Matricula[]>('student-enrollments', [])
  const [profissionais, __] = useKV<ProfissionalEducacao[]>('education-professionals', [])
  const [escolas, ___] = useKV<Escola[]>('schools', [])
  const [etapas, ____] = useKV<EtapaEnsino[]>('school-etapas', [])
  const [isProfessoresDialogOpen, setIsProfessoresDialogOpen] = useState(false)
  const [isAuxiliaresDialogOpen, setIsAuxiliaresDialogOpen] = useState(false)

  const currentTurma = (turmas || []).find(t => t.id === turma.id) || turma

  const alunosNaTurma = (matriculas || []).filter(
    m => m.turmaId === turma.id && m.status === 'ativa'
  )

  const professoresVinculados = (profissionais || []).filter(
    p => currentTurma.professoresIds?.includes(p.id) && p.tipo === 'professor'
  )

  const auxiliaresVinculados = (profissionais || []).filter(
    p => currentTurma.auxiliaresIds?.includes(p.id) && p.tipo === 'auxiliar'
  )

  const professoresDisponiveis = (profissionais || []).filter(
    p => p.tipo === 'professor' && 
        p.ativo && 
        p.escolasVinculadas.includes(turma.escolaId) &&
        !currentTurma.professoresIds?.includes(p.id)
  )

  const auxiliaresDisponiveis = (profissionais || []).filter(
    p => p.tipo === 'auxiliar' && 
        p.ativo && 
        p.escolasVinculadas.includes(turma.escolaId) &&
        !currentTurma.auxiliaresIds?.includes(p.id)
  )

  const escola = (escolas || []).find(e => e.id === turma.escolaId)
  
  const getSeriNome = (serieId: string) => {
    for (const etapa of (etapas || [])) {
      const serie = etapa.series.find(s => s.id === serieId)
      if (serie) return `${etapa.nome} - ${serie.nome}`
    }
    return 'N/A'
  }

  const handleToggleProfessor = (profissionalId: string) => {
    setTurmas((current) => 
      (current || []).map(t => {
        if (t.id !== turma.id) return t
        
        const currentIds = t.professoresIds || []
        const isAdding = !currentIds.includes(profissionalId)
        
        return {
          ...t,
          professoresIds: isAdding
            ? [...currentIds, profissionalId]
            : currentIds.filter(id => id !== profissionalId)
        }
      })
    )

    toast.success(
      currentTurma.professoresIds?.includes(profissionalId)
        ? 'Professor removido da turma!'
        : 'Professor adicionado à turma!'
    )
  }

  const handleToggleAuxiliar = (profissionalId: string) => {
    setTurmas((current) => 
      (current || []).map(t => {
        if (t.id !== turma.id) return t
        
        const currentIds = t.auxiliaresIds || []
        const isAdding = !currentIds.includes(profissionalId)
        
        return {
          ...t,
          auxiliaresIds: isAdding
            ? [...currentIds, profissionalId]
            : currentIds.filter(id => id !== profissionalId)
        }
      })
    )

    toast.success(
      currentTurma.auxiliaresIds?.includes(profissionalId)
        ? 'Auxiliar removido da turma!'
        : 'Auxiliar adicionado à turma!'
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold">{turma.nome}</h2>
          <p className="text-muted-foreground mt-1">
            {escola?.nome} - {getSeriNome(turma.serieId)}
          </p>
        </div>
        <Badge variant={turma.ativa ? 'default' : 'secondary'} className="text-sm px-3 py-1">
          {turma.ativa ? 'Ativa' : 'Inativa'}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Turno</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">{turma.turno}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ano Letivo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{turma.anoLetivo}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Capacidade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{alunosNaTurma.length}/{turma.capacidadeMaxima}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Limite PCD</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {alunosNaTurma.filter(a => a.necessidadesEspeciais).length}/{turma.limitePCD}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alunos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alunos" className="gap-2">
            <GraduationCap size={18} />
            Alunos ({alunosNaTurma.length})
          </TabsTrigger>
          <TabsTrigger value="professores" className="gap-2">
            <ChalkboardTeacher size={18} />
            Professores ({professoresVinculados.length})
          </TabsTrigger>
          <TabsTrigger value="auxiliares" className="gap-2">
            <UserCircle size={18} />
            Auxiliares ({auxiliaresVinculados.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alunos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Alunos Matriculados</CardTitle>
              <CardDescription>
                {alunosNaTurma.length} aluno(s) nesta turma
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alunosNaTurma.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
                  <p className="text-muted-foreground">Nenhum aluno nesta turma</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alunosNaTurma.map((matricula) => (
                    <div 
                      key={matricula.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="text-primary" size={24} weight="duotone" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{matricula.nomeAluno}</h4>
                            {matricula.necessidadesEspeciais && (
                              <Badge variant="secondary" className="text-xs">PCD</Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>📅 Nascimento: {new Date(matricula.dataNascimento).toLocaleDateString('pt-BR')}</p>
                            <p>👤 Responsável: {matricula.nomeResponsavel}</p>
                            <p>📧 {matricula.emailResponsavel}</p>
                            <p>📱 {matricula.telefoneResponsavel}</p>
                            {matricula.necessidadesEspeciais && matricula.descricaoNecessidades && (
                              <p className="pt-2 text-xs bg-muted p-2 rounded">
                                ⚕️ {matricula.descricaoNecessidades}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professores" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Professores da Turma</CardTitle>
                  <CardDescription>
                    {professoresVinculados.length} professor(es) vinculado(s)
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setIsProfessoresDialogOpen(true)}
                  className="gap-2"
                >
                  <Plus size={18} />
                  Adicionar Professor
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {professoresVinculados.length === 0 ? (
                <div className="text-center py-12">
                  <ChalkboardTeacher className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
                  <p className="text-muted-foreground">Nenhum professor vinculado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {professoresVinculados.map((prof) => (
                    <div 
                      key={prof.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <ChalkboardTeacher className="text-primary" size={24} weight="duotone" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{prof.nome}</h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>📧 {prof.email}</p>
                              {prof.telefone && <p>📱 {prof.telefone}</p>}
                              <p>🎓 {prof.formacao}</p>
                              {prof.especialidades && prof.especialidades.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {prof.especialidades.map((esp, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {esp}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleToggleProfessor(prof.id)}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auxiliares" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Auxiliares da Turma</CardTitle>
                  <CardDescription>
                    {auxiliaresVinculados.length} auxiliar(es) vinculado(s)
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setIsAuxiliaresDialogOpen(true)}
                  className="gap-2"
                >
                  <Plus size={18} />
                  Adicionar Auxiliar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {auxiliaresVinculados.length === 0 ? (
                <div className="text-center py-12">
                  <UserCircle className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
                  <p className="text-muted-foreground">Nenhum auxiliar vinculado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auxiliaresVinculados.map((prof) => (
                    <div 
                      key={prof.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                            <UserCircle className="text-secondary" size={24} weight="duotone" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{prof.nome}</h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>📧 {prof.email}</p>
                              {prof.telefone && <p>📱 {prof.telefone}</p>}
                              <p>🎓 {prof.formacao}</p>
                              {prof.especialidades && prof.especialidades.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {prof.especialidades.map((esp, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {esp}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleToggleAuxiliar(prof.id)}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isProfessoresDialogOpen} onOpenChange={setIsProfessoresDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChalkboardTeacher className="text-primary" size={24} weight="duotone" />
              Adicionar Professores
            </DialogTitle>
            <DialogDescription>
              Selecione os professores para vincular a esta turma
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            {professoresDisponiveis.length === 0 ? (
              <div className="text-center py-12">
                <ChalkboardTeacher className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
                <p className="text-muted-foreground">Nenhum professor disponível</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Todos os professores desta escola já estão vinculados
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {professoresDisponiveis.map((prof) => (
                  <div 
                    key={prof.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleToggleProfessor(prof.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <ChalkboardTeacher className="text-primary" size={20} weight="duotone" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium">{prof.nome}</h5>
                        <p className="text-xs text-muted-foreground">{prof.formacao}</p>
                      </div>
                    </div>
                    <Button variant="default" size="sm">
                      <Plus size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setIsProfessoresDialogOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAuxiliaresDialogOpen} onOpenChange={setIsAuxiliaresDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="text-primary" size={24} weight="duotone" />
              Adicionar Auxiliares
            </DialogTitle>
            <DialogDescription>
              Selecione os auxiliares para vincular a esta turma
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            {auxiliaresDisponiveis.length === 0 ? (
              <div className="text-center py-12">
                <UserCircle className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
                <p className="text-muted-foreground">Nenhum auxiliar disponível</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Todos os auxiliares desta escola já estão vinculados
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {auxiliaresDisponiveis.map((prof) => (
                  <div 
                    key={prof.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleToggleAuxiliar(prof.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <UserCircle className="text-secondary" size={20} weight="duotone" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium">{prof.nome}</h5>
                        <p className="text-xs text-muted-foreground">{prof.formacao}</p>
                      </div>
                    </div>
                    <Button variant="default" size="sm">
                      <Plus size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setIsAuxiliaresDialogOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
