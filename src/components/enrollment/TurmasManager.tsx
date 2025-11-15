import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Plus, UsersThree, Pencil, Trash, Buildings, GraduationCap, UserPlus, X } from '@phosphor-icons/react'
import { Turma, Escola, EtapaEnsino, Matricula } from '@/lib/types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'

export function TurmasManager() {
  const [turmas, setTurmas] = useKV<Turma[]>('school-turmas', [])
  const [escolas, _] = useKV<Escola[]>('schools', [])
  const [etapas, __] = useKV<EtapaEnsino[]>('school-etapas', [])
  const [matriculas, setMatriculas] = useKV<Matricula[]>('student-enrollments', [])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null)
  const [isAssignStudentsOpen, setIsAssignStudentsOpen] = useState(false)
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null)
  const [formData, setFormData] = useState({
    escolaId: '',
    serieId: '',
    nome: '',
    turno: 'matutino' as 'matutino' | 'vespertino' | 'noturno' | 'integral',
    anoLetivo: new Date().getFullYear().toString(),
    capacidadeMaxima: 30,
    ativa: true
  })

  const escolasAtivas = (escolas || []).filter(e => e.ativa)
  const escolaSelecionada = escolasAtivas.find(e => e.id === formData.escolaId)
  const etapasDisponiveis = (etapas || []).filter(e => 
    escolaSelecionada?.etapasVinculadas.includes(e.id)
  )
  const todasSeries = etapasDisponiveis.flatMap(e => 
    e.series.map(s => ({ ...s, etapaId: e.id, etapaNome: e.nome }))
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.escolaId || !formData.serieId) {
      toast.error('Selecione escola e série!')
      return
    }

    if (editingTurma) {
      setTurmas((current) => 
        (current || []).map(t => 
          t.id === editingTurma.id 
            ? { ...t, ...formData }
            : t
        )
      )
      toast.success('Turma atualizada com sucesso!')
    } else {
      const novaTurma: Turma = {
        id: `TUR-${Date.now()}`,
        ...formData
      }
      setTurmas((current) => [...(current || []), novaTurma])
      toast.success('Turma criada com sucesso!')
    }

    resetForm()
  }

  const resetForm = () => {
    setFormData({ 
      escolaId: '',
      serieId: '',
      nome: '',
      turno: 'matutino',
      anoLetivo: new Date().getFullYear().toString(),
      capacidadeMaxima: 30,
      ativa: true
    })
    setEditingTurma(null)
    setIsFormOpen(false)
  }

  const handleEdit = (turma: Turma) => {
    setEditingTurma(turma)
    setFormData({ 
      escolaId: turma.escolaId,
      serieId: turma.serieId,
      nome: turma.nome,
      turno: turma.turno,
      anoLetivo: turma.anoLetivo,
      capacidadeMaxima: turma.capacidadeMaxima,
      ativa: turma.ativa
    })
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    setMatriculas((current) => 
      (current || []).map(m => 
        m.turmaId === id ? { ...m, turmaId: undefined } : m
      )
    )
    setTurmas((current) => (current || []).filter(t => t.id !== id))
    toast.success('Turma removida com sucesso!')
  }

  const getEscolaNome = (escolaId: string) => {
    return escolas?.find(e => e.id === escolaId)?.nome || 'N/A'
  }

  const getSeriNome = (serieId: string) => {
    for (const etapa of (etapas || [])) {
      const serie = etapa.series.find(s => s.id === serieId)
      if (serie) return `${etapa.nome} - ${serie.nome}`
    }
    return 'N/A'
  }

  const getAlunosNaTurma = (turmaId: string) => {
    return (matriculas || []).filter(m => m.turmaId === turmaId && m.status === 'ativa')
  }

  const getAlunosSemTurma = (turmaId: string) => {
    const turma = turmas?.find(t => t.id === turmaId)
    if (!turma) return []
    
    return (matriculas || []).filter(m => 
      m.status === 'ativa' && 
      m.escolaId === turma.escolaId && 
      m.serieId === turma.serieId &&
      !m.turmaId
    )
  }

  const handleOpenAssignStudents = (turma: Turma) => {
    setSelectedTurma(turma)
    setIsAssignStudentsOpen(true)
  }

  const handleToggleAlunoNaTurma = (matriculaId: string) => {
    if (!selectedTurma) return
    
    setMatriculas((current) => 
      (current || []).map(m => 
        m.id === matriculaId 
          ? { ...m, turmaId: m.turmaId === selectedTurma.id ? undefined : selectedTurma.id }
          : m
      )
    )
  }

  const handleRemoveAlunoFromTurma = (matriculaId: string) => {
    setMatriculas((current) => 
      (current || []).map(m => 
        m.id === matriculaId ? { ...m, turmaId: undefined } : m
      )
    )
    toast.success('Aluno removido da turma!')
  }

  const turmasPorEscola = (turmas || []).reduce((acc, turma) => {
    if (!acc[turma.escolaId]) acc[turma.escolaId] = []
    acc[turma.escolaId].push(turma)
    return acc
  }, {} as Record<string, Turma[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Gestão de Turmas</h3>
          <p className="text-muted-foreground mt-1">
            Crie turmas e atribua alunos matriculados
          </p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(true)} 
          size="lg" 
          className="gap-2"
          disabled={escolasAtivas.length === 0}
        >
          <Plus size={20} weight="bold" />
          Nova Turma
        </Button>
      </div>

      {escolasAtivas.length === 0 && (
        <Card className="border-yellow-500/50 bg-yellow-50/50">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800">
              ⚠️ Nenhuma escola ativa cadastrada. Cadastre escolas antes de criar turmas.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersThree className="text-primary" size={24} weight="duotone" />
              {editingTurma ? 'Editar Turma' : 'Nova Turma'}
            </DialogTitle>
            <DialogDescription>
              {editingTurma ? 'Atualize os dados da turma' : 'Crie uma nova turma para agrupar alunos'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="escolaId">Escola *</Label>
                <Select 
                  value={formData.escolaId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, escolaId: value, serieId: '' }))}
                  required
                >
                  <SelectTrigger id="escolaId">
                    <SelectValue placeholder="Selecione a escola" />
                  </SelectTrigger>
                  <SelectContent>
                    {escolasAtivas.map(escola => (
                      <SelectItem key={escola.id} value={escola.id}>
                        {escola.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="serieId">Série *</Label>
                <Select 
                  value={formData.serieId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, serieId: value }))}
                  disabled={!formData.escolaId || todasSeries.length === 0}
                  required
                >
                  <SelectTrigger id="serieId">
                    <SelectValue placeholder="Selecione a série" />
                  </SelectTrigger>
                  <SelectContent>
                    {todasSeries.map(serie => (
                      <SelectItem key={serie.id} value={serie.id}>
                        {serie.etapaNome} - {serie.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Turma *</Label>
                <Input
                  id="nome"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Turma A, Turma B"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="turno">Turno *</Label>
                <Select 
                  value={formData.turno} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, turno: value }))}
                  required
                >
                  <SelectTrigger id="turno">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matutino">Matutino</SelectItem>
                    <SelectItem value="vespertino">Vespertino</SelectItem>
                    <SelectItem value="noturno">Noturno</SelectItem>
                    <SelectItem value="integral">Integral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="anoLetivo">Ano Letivo *</Label>
                <Input
                  id="anoLetivo"
                  type="number"
                  required
                  value={formData.anoLetivo}
                  onChange={(e) => setFormData(prev => ({ ...prev, anoLetivo: e.target.value }))}
                  placeholder="2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacidadeMaxima">Capacidade Máxima *</Label>
                <Input
                  id="capacidadeMaxima"
                  type="number"
                  required
                  min="1"
                  value={formData.capacidadeMaxima}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacidadeMaxima: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="ativa">Turma Ativa</Label>
                <p className="text-sm text-muted-foreground">
                  Turma disponível para receber alunos
                </p>
              </div>
              <Switch
                id="ativa"
                checked={formData.ativa}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativa: checked }))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2">
                {editingTurma ? 'Atualizar' : 'Criar Turma'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignStudentsOpen} onOpenChange={setIsAssignStudentsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="text-primary" size={24} weight="duotone" />
              Gerenciar Alunos - {selectedTurma?.nome}
            </DialogTitle>
            <DialogDescription>
              Atribua ou remova alunos da turma
            </DialogDescription>
          </DialogHeader>
          {selectedTurma && (
            <Tabs defaultValue="enrolled" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="enrolled">
                  Alunos na Turma ({getAlunosNaTurma(selectedTurma.id).length}/{selectedTurma.capacidadeMaxima})
                </TabsTrigger>
                <TabsTrigger value="available">
                  Alunos Disponíveis ({getAlunosSemTurma(selectedTurma.id).length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="enrolled" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {getAlunosNaTurma(selectedTurma.id).length === 0 ? (
                    <div className="text-center py-12">
                      <UsersThree className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
                      <p className="text-muted-foreground">Nenhum aluno na turma ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getAlunosNaTurma(selectedTurma.id).map((matricula) => (
                        <div 
                          key={matricula.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <GraduationCap className="text-primary" size={20} weight="duotone" />
                            </div>
                            <div>
                              <h5 className="font-medium">{matricula.nomeAluno}</h5>
                              <p className="text-xs text-muted-foreground">
                                Responsável: {matricula.nomeResponsavel}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveAlunoFromTurma(matricula.id)}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="available" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {getAlunosSemTurma(selectedTurma.id).length === 0 ? (
                    <div className="text-center py-12">
                      <UsersThree className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
                      <p className="text-muted-foreground">Nenhum aluno disponível</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Todos os alunos desta série já estão em turmas
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getAlunosSemTurma(selectedTurma.id).map((matricula) => (
                        <div 
                          key={matricula.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <GraduationCap className="text-primary" size={20} weight="duotone" />
                            </div>
                            <div>
                              <h5 className="font-medium">{matricula.nomeAluno}</h5>
                              <p className="text-xs text-muted-foreground">
                                Responsável: {matricula.nomeResponsavel}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleToggleAlunoNaTurma(matricula.id)}
                            disabled={getAlunosNaTurma(selectedTurma.id).length >= selectedTurma.capacidadeMaxima}
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setIsAssignStudentsOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {Object.keys(turmasPorEscola).length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Turmas Cadastradas</CardTitle>
              <CardDescription>0 turma(s) no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <UsersThree className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
                <p className="text-muted-foreground">Nenhuma turma cadastrada ainda</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em "Nova Turma" para começar
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(turmasPorEscola).map(([escolaId, turmasEscola]) => (
            <Card key={escolaId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Buildings className="text-primary" size={20} weight="duotone" />
                  {getEscolaNome(escolaId)}
                </CardTitle>
                <CardDescription>
                  {turmasEscola.length} turma(s) cadastrada(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {turmasEscola.map((turma) => {
                    const alunosNaTurma = getAlunosNaTurma(turma.id)
                    const percentualOcupacao = (alunosNaTurma.length / turma.capacidadeMaxima) * 100
                    
                    return (
                      <div 
                        key={turma.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <UsersThree className="text-primary" size={24} weight="duotone" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{turma.nome}</h4>
                                <Badge variant={turma.ativa ? 'default' : 'secondary'}>
                                  {turma.ativa ? 'Ativa' : 'Inativa'}
                                </Badge>
                                <Badge variant="outline">
                                  {turma.turno.charAt(0).toUpperCase() + turma.turno.slice(1)}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <GraduationCap size={14} />
                                  {getSeriNome(turma.serieId)}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Ano Letivo:</span> {turma.anoLetivo}
                                </div>
                                <div className="flex items-center gap-2">
                                  <UsersThree size={14} />
                                  <span>{alunosNaTurma.length}/{turma.capacidadeMaxima} alunos</span>
                                  <span className={`ml-2 text-xs ${
                                    percentualOcupacao >= 90 ? 'text-red-500' :
                                    percentualOcupacao >= 70 ? 'text-yellow-500' :
                                    'text-green-500'
                                  }`}>
                                    ({percentualOcupacao.toFixed(0)}% ocupado)
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenAssignStudents(turma)}
                              className="gap-2"
                            >
                              <UserPlus size={16} />
                              Gerenciar Alunos
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(turma)}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(turma.id)}
                            >
                              <Trash size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
