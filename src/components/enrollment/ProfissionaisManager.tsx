import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus, ChalkboardTeacher, Pencil, Trash, UserCircle } from '@phosphor-icons/react'
import { ProfissionalEducacao, Escola } from '@/lib/types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

export function ProfissionaisManager() {
  const [profissionais, setProfissionais] = useKV<ProfissionalEducacao[]>('education-professionals', [])
  const [escolas, _] = useKV<Escola[]>('schools', [])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProfissional, setEditingProfissional] = useState<ProfissionalEducacao | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    tipo: 'professor' as 'professor' | 'auxiliar',
    especialidades: '',
    formacao: '',
    dataAdmissao: new Date().toISOString().split('T')[0],
    escolasVinculadas: [] as string[],
    ativo: true
  })

  const escolasAtivas = (escolas || []).filter(e => e.ativa)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome || !formData.cpf || !formData.email) {
      toast.error('Preencha os campos obrigatórios!')
      return
    }

    const especialidadesArray = formData.especialidades
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0)

    if (editingProfissional) {
      setProfissionais((current) => 
        (current || []).map(p => 
          p.id === editingProfissional.id 
            ? { 
                ...p, 
                ...formData,
                especialidades: especialidadesArray
              }
            : p
        )
      )
      toast.success('Profissional atualizado com sucesso!')
    } else {
      const novoProfissional: ProfissionalEducacao = {
        id: `PROF-${Date.now()}`,
        ...formData,
        especialidades: especialidadesArray
      }
      setProfissionais((current) => [...(current || []), novoProfissional])
      toast.success('Profissional cadastrado com sucesso!')
    }

    resetForm()
  }

  const resetForm = () => {
    setFormData({ 
      nome: '',
      cpf: '',
      email: '',
      telefone: '',
      tipo: 'professor',
      especialidades: '',
      formacao: '',
      dataAdmissao: new Date().toISOString().split('T')[0],
      escolasVinculadas: [],
      ativo: true
    })
    setEditingProfissional(null)
    setIsFormOpen(false)
  }

  const handleEdit = (profissional: ProfissionalEducacao) => {
    setEditingProfissional(profissional)
    setFormData({ 
      nome: profissional.nome,
      cpf: profissional.cpf,
      email: profissional.email,
      telefone: profissional.telefone,
      tipo: profissional.tipo,
      especialidades: profissional.especialidades?.join(', ') || '',
      formacao: profissional.formacao,
      dataAdmissao: profissional.dataAdmissao,
      escolasVinculadas: profissional.escolasVinculadas,
      ativo: profissional.ativo
    })
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    setProfissionais((current) => (current || []).filter(p => p.id !== id))
    toast.success('Profissional removido com sucesso!')
  }

  const toggleEscola = (escolaId: string) => {
    setFormData(prev => ({
      ...prev,
      escolasVinculadas: prev.escolasVinculadas.includes(escolaId)
        ? prev.escolasVinculadas.filter(id => id !== escolaId)
        : [...prev.escolasVinculadas, escolaId]
    }))
  }

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const formatTelefone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  const professores = (profissionais || []).filter(p => p.tipo === 'professor')
  const auxiliares = (profissionais || []).filter(p => p.tipo === 'auxiliar')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Profissionais da Educação</h3>
          <p className="text-muted-foreground mt-1">
            Cadastre professores e auxiliares para vincular às turmas
          </p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(true)} 
          size="lg" 
          className="gap-2"
        >
          <Plus size={20} weight="bold" />
          Novo Profissional
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChalkboardTeacher className="text-primary" size={24} weight="duotone" />
              {editingProfissional ? 'Editar Profissional' : 'Novo Profissional'}
            </DialogTitle>
            <DialogDescription>
              {editingProfissional ? 'Atualize os dados do profissional' : 'Cadastre um novo profissional da educação'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome completo do profissional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  required
                  value={formData.cpf}
                  onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, tipo: value }))}
                  required
                >
                  <SelectTrigger id="tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professor">Professor</SelectItem>
                    <SelectItem value="auxiliar">Auxiliar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: formatTelefone(e.target.value) }))}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataAdmissao">Data de Admissão *</Label>
                <Input
                  id="dataAdmissao"
                  type="date"
                  required
                  value={formData.dataAdmissao}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataAdmissao: e.target.value }))}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="formacao">Formação *</Label>
                <Input
                  id="formacao"
                  required
                  value={formData.formacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, formacao: e.target.value }))}
                  placeholder="Ex: Pedagogia, Letras, Educação Especial"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="especialidades">Especialidades</Label>
                <Textarea
                  id="especialidades"
                  value={formData.especialidades}
                  onChange={(e) => setFormData(prev => ({ ...prev, especialidades: e.target.value }))}
                  placeholder="Separe por vírgulas: Matemática, Alfabetização, Educação Inclusiva"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Separe múltiplas especialidades por vírgulas
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Escolas Vinculadas</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
                  {escolasAtivas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma escola ativa cadastrada</p>
                  ) : (
                    escolasAtivas.map(escola => (
                      <div key={escola.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`escola-${escola.id}`}
                          checked={formData.escolasVinculadas.includes(escola.id)}
                          onCheckedChange={() => toggleEscola(escola.id)}
                        />
                        <label
                          htmlFor={`escola-${escola.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {escola.nome}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="ativo">Profissional Ativo</Label>
                <p className="text-sm text-muted-foreground">
                  Disponível para ser vinculado a turmas
                </p>
              </div>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2">
                {editingProfissional ? 'Atualizar' : 'Cadastrar Profissional'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChalkboardTeacher className="text-primary" size={20} weight="duotone" />
              Professores
            </CardTitle>
            <CardDescription>
              {professores.length} professor(es) cadastrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {professores.length === 0 ? (
              <div className="text-center py-12">
                <ChalkboardTeacher className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
                <p className="text-muted-foreground">Nenhum professor cadastrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {professores.map((prof) => (
                  <div 
                    key={prof.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <UserCircle className="text-primary" size={24} weight="duotone" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{prof.nome}</h4>
                            <Badge variant={prof.ativo ? 'default' : 'secondary'}>
                              {prof.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
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
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(prof)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(prof.id)}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="text-primary" size={20} weight="duotone" />
              Auxiliares
            </CardTitle>
            <CardDescription>
              {auxiliares.length} auxiliar(es) cadastrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {auxiliares.length === 0 ? (
              <div className="text-center py-12">
                <UserCircle className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
                <p className="text-muted-foreground">Nenhum auxiliar cadastrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {auxiliares.map((prof) => (
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
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{prof.nome}</h4>
                            <Badge variant={prof.ativo ? 'default' : 'secondary'}>
                              {prof.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
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
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(prof)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(prof.id)}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
