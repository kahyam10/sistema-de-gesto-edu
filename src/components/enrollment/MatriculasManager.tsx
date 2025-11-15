import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { UserPlus, X, Buildings, GraduationCap, ListNumbers, User, Phone, Envelope, MapPin } from '@phosphor-icons/react'
import { Matricula, Escola, EtapaEnsino, Serie } from '@/lib/types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

export function MatriculasManager() {
  const [matriculas, setMatriculas] = useKV<Matricula[]>('student-enrollments', [])
  const [escolas, _] = useKV<Escola[]>('schools', [])
  const [etapas, __] = useKV<EtapaEnsino[]>('school-etapas', [])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState({
    escolaId: '',
    etapaEnsinoId: '',
    serieId: '',
    nomeAluno: '',
    dataNascimento: '',
    cpfAluno: '',
    nomeResponsavel: '',
    cpfResponsavel: '',
    telefoneResponsavel: '',
    emailResponsavel: '',
    endereco: '',
    necessidadesEspeciais: false,
    descricaoNecessidades: ''
  })

  const escolasAtivas = (escolas || []).filter(e => e.ativa)
  const escolaSelecionada = escolasAtivas.find(e => e.id === formData.escolaId)
  const etapasDisponiveis = (etapas || []).filter(e => 
    escolaSelecionada?.etapasVinculadas.includes(e.id)
  )
  const etapaSelecionada = etapasDisponiveis.find(e => e.id === formData.etapaEnsinoId)
  const seriesDisponiveis = etapaSelecionada?.series || []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.escolaId || !formData.etapaEnsinoId || !formData.serieId) {
      toast.error('Selecione escola, etapa e série!')
      return
    }

    const novaMatricula: Matricula = {
      id: `MAT-${Date.now()}`,
      ...formData,
      dataMatricula: new Date().toISOString(),
      status: 'ativa'
    }

    setMatriculas((current) => [...(current || []), novaMatricula])
    
    toast.success('Matrícula realizada com sucesso!', {
      description: `${formData.nomeAluno} foi matriculado(a).`
    })

    resetForm()
  }

  const resetForm = () => {
    setFormData({
      escolaId: '',
      etapaEnsinoId: '',
      serieId: '',
      nomeAluno: '',
      dataNascimento: '',
      cpfAluno: '',
      nomeResponsavel: '',
      cpfResponsavel: '',
      telefoneResponsavel: '',
      emailResponsavel: '',
      endereco: '',
      necessidadesEspeciais: false,
      descricaoNecessidades: ''
    })
    setIsFormOpen(false)
  }

  const handleEscolaChange = (escolaId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      escolaId, 
      etapaEnsinoId: '', 
      serieId: '' 
    }))
  }

  const handleEtapaChange = (etapaId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      etapaEnsinoId: etapaId, 
      serieId: '' 
    }))
  }

  const getEscolaNome = (escolaId: string) => {
    return escolas?.find(e => e.id === escolaId)?.nome || 'N/A'
  }

  const getEtapaNome = (etapaId: string) => {
    return etapas?.find(e => e.id === etapaId)?.nome || 'N/A'
  }

  const getSeriNome = (serieId: string, etapaId: string) => {
    const etapa = etapas?.find(e => e.id === etapaId)
    return etapa?.series.find(s => s.id === serieId)?.nome || 'N/A'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Sistema de Matrículas</h3>
          <p className="text-muted-foreground mt-1">
            Realize matrículas de alunos nas escolas
          </p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(true)} 
          size="lg" 
          className="gap-2"
          disabled={escolasAtivas.length === 0}
        >
          <UserPlus size={20} weight="bold" />
          Nova Matrícula
        </Button>
      </div>

      {escolasAtivas.length === 0 && (
        <Card className="border-yellow-500/50 bg-yellow-50/50">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800">
              ⚠️ Nenhuma escola ativa cadastrada. Cadastre escolas, etapas e séries antes de realizar matrículas.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="text-primary" size={24} weight="duotone" />
              Formulário de Matrícula
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do aluno para realizar a matrícula
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Buildings size={16} />
                  Informações Escolares
                </h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="escolaId">Escola *</Label>
                    <Select 
                      value={formData.escolaId} 
                      onValueChange={handleEscolaChange}
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
                  <div className="space-y-2">
                    <Label htmlFor="etapaEnsinoId">Etapa de Ensino *</Label>
                    <Select 
                      value={formData.etapaEnsinoId} 
                      onValueChange={handleEtapaChange}
                      disabled={!formData.escolaId || etapasDisponiveis.length === 0}
                      required
                    >
                      <SelectTrigger id="etapaEnsinoId">
                        <SelectValue placeholder="Selecione a etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {etapasDisponiveis.map(etapa => (
                          <SelectItem key={etapa.id} value={etapa.id}>
                            {etapa.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serieId">Série/Ano *</Label>
                    <Select 
                      value={formData.serieId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, serieId: value }))}
                      disabled={!formData.etapaEnsinoId || seriesDisponiveis.length === 0}
                      required
                    >
                      <SelectTrigger id="serieId">
                        <SelectValue placeholder="Selecione a série" />
                      </SelectTrigger>
                      <SelectContent>
                        {seriesDisponiveis.sort((a, b) => a.ordem - b.ordem).map(serie => (
                          <SelectItem key={serie.id} value={serie.id}>
                            {serie.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <User size={16} />
                  Dados do Aluno
                </h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="nomeAluno">Nome Completo *</Label>
                    <Input
                      id="nomeAluno"
                      required
                      value={formData.nomeAluno}
                      onChange={(e) => setFormData(prev => ({ ...prev, nomeAluno: e.target.value }))}
                      placeholder="Nome completo do aluno"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                    <Input
                      id="dataNascimento"
                      type="date"
                      required
                      value={formData.dataNascimento}
                      onChange={(e) => setFormData(prev => ({ ...prev, dataNascimento: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpfAluno">CPF do Aluno</Label>
                    <Input
                      id="cpfAluno"
                      value={formData.cpfAluno}
                      onChange={(e) => setFormData(prev => ({ ...prev, cpfAluno: e.target.value }))}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <User size={16} />
                  Dados do Responsável
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nomeResponsavel">Nome do Responsável *</Label>
                    <Input
                      id="nomeResponsavel"
                      required
                      value={formData.nomeResponsavel}
                      onChange={(e) => setFormData(prev => ({ ...prev, nomeResponsavel: e.target.value }))}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpfResponsavel">CPF do Responsável *</Label>
                    <Input
                      id="cpfResponsavel"
                      required
                      value={formData.cpfResponsavel}
                      onChange={(e) => setFormData(prev => ({ ...prev, cpfResponsavel: e.target.value }))}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefoneResponsavel">Telefone *</Label>
                    <Input
                      id="telefoneResponsavel"
                      required
                      value={formData.telefoneResponsavel}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefoneResponsavel: e.target.value }))}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailResponsavel">E-mail</Label>
                    <Input
                      id="emailResponsavel"
                      type="email"
                      value={formData.emailResponsavel}
                      onChange={(e) => setFormData(prev => ({ ...prev, emailResponsavel: e.target.value }))}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <MapPin size={16} />
                  Endereço
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço Completo *</Label>
                  <Input
                    id="endereco"
                    required
                    value={formData.endereco}
                    onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                    placeholder="Rua, número, bairro, cidade"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Necessidades Especiais
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="necessidadesEspeciais"
                      checked={formData.necessidadesEspeciais}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, necessidadesEspeciais: checked as boolean }))
                      }
                    />
                    <Label htmlFor="necessidadesEspeciais" className="cursor-pointer">
                      Aluno possui necessidades especiais (PCD)
                    </Label>
                  </div>
                  {formData.necessidadesEspeciais && (
                    <div className="space-y-2 pl-6">
                      <Label htmlFor="descricaoNecessidades">Descrição das Necessidades</Label>
                      <Input
                        id="descricaoNecessidades"
                        value={formData.descricaoNecessidades}
                        onChange={(e) => setFormData(prev => ({ ...prev, descricaoNecessidades: e.target.value }))}
                        placeholder="Descreva as necessidades especiais do aluno"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="gap-2">
                  <UserPlus size={18} weight="bold" />
                  Realizar Matrícula
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Matrículas Realizadas</CardTitle>
          <CardDescription>
            {(matriculas || []).length} matrícula(s) no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(!matriculas || matriculas.length === 0) ? (
            <div className="text-center py-12">
              <UserPlus className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
              <p className="text-muted-foreground">
                Nenhuma matrícula realizada ainda
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em "Nova Matrícula" para começar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {matriculas.map((matricula) => (
                <div 
                  key={matricula.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <UserPlus className="text-primary" size={24} weight="duotone" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{matricula.nomeAluno}</h4>
                          <Badge variant={
                            matricula.status === 'ativa' ? 'default' : 
                            matricula.status === 'cancelada' ? 'destructive' : 
                            'secondary'
                          }>
                            {matricula.status === 'ativa' ? 'Ativa' : 
                             matricula.status === 'cancelada' ? 'Cancelada' : 'Concluída'}
                          </Badge>
                          {matricula.necessidadesEspeciais && (
                            <Badge variant="outline">PCD</Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Buildings size={14} />
                            {getEscolaNome(matricula.escolaId)}
                          </div>
                          <div className="flex items-center gap-2">
                            <GraduationCap size={14} />
                            {getEtapaNome(matricula.etapaEnsinoId)} - {getSeriNome(matricula.serieId, matricula.etapaEnsinoId)}
                          </div>
                          <div className="flex items-center gap-2">
                            <User size={14} />
                            Responsável: {matricula.nomeResponsavel}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone size={14} />
                            {matricula.telefoneResponsavel}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
