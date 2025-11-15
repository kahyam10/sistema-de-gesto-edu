import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { UserPlus, X } from '@phosphor-icons/react'

interface Student {
  id: string
  name: string
  birthDate: string
  cpf: string
  responsibleName: string
  responsibleCPF: string
  responsiblePhone: string
  responsibleEmail: string
  address: string
  neighborhood: string
  city: string
  school: string
  grade: string
  shift: string
  hasPCD: boolean
  pcdDescription?: string
  enrollmentDate: string
  status: 'pending' | 'approved' | 'rejected'
}

export function EnrollmentForm() {
  const [students, setStudents] = useKV<Student[]>('enrolled-students', [])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    cpf: '',
    responsibleName: '',
    responsibleCPF: '',
    responsiblePhone: '',
    responsibleEmail: '',
    address: '',
    neighborhood: '',
    city: 'Ibirapitanga',
    school: '',
    grade: '',
    shift: '',
    hasPCD: false,
    pcdDescription: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newStudent: Student = {
      id: `STD-${Date.now()}`,
      ...formData,
      enrollmentDate: new Date().toISOString(),
      status: 'pending'
    }

    setStudents((current) => [...(current || []), newStudent])
    
    toast.success('Matrícula realizada com sucesso!', {
      description: `${formData.name} foi cadastrado(a) no sistema.`
    })

    setFormData({
      name: '',
      birthDate: '',
      cpf: '',
      responsibleName: '',
      responsibleCPF: '',
      responsiblePhone: '',
      responsibleEmail: '',
      address: '',
      neighborhood: '',
      city: 'Ibirapitanga',
      school: '',
      grade: '',
      shift: '',
      hasPCD: false,
      pcdDescription: ''
    })
    setIsFormOpen(false)
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Sistema de Matrículas</h3>
          <p className="text-muted-foreground mt-1">
            Gerencie matrículas online e presenciais
          </p>
        </div>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)} size="lg" className="gap-2">
            <UserPlus size={20} weight="bold" />
            Nova Matrícula
          </Button>
        )}
      </div>

      {isFormOpen && (
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="text-primary" size={24} weight="duotone" />
                  Formulário de Matrícula
                </CardTitle>
                <CardDescription>
                  Preencha os dados do aluno para realizar a matrícula
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsFormOpen(false)}
              >
                <X size={20} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Dados do Aluno
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Nome do aluno"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Data de Nascimento *</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      required
                      value={formData.birthDate}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Dados do Responsável
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="responsibleName">Nome do Responsável *</Label>
                    <Input
                      id="responsibleName"
                      required
                      value={formData.responsibleName}
                      onChange={(e) => handleInputChange('responsibleName', e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsibleCPF">CPF do Responsável *</Label>
                    <Input
                      id="responsibleCPF"
                      required
                      value={formData.responsibleCPF}
                      onChange={(e) => handleInputChange('responsibleCPF', e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsiblePhone">Telefone *</Label>
                    <Input
                      id="responsiblePhone"
                      required
                      value={formData.responsiblePhone}
                      onChange={(e) => handleInputChange('responsiblePhone', e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsibleEmail">E-mail</Label>
                    <Input
                      id="responsibleEmail"
                      type="email"
                      value={formData.responsibleEmail}
                      onChange={(e) => handleInputChange('responsibleEmail', e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Endereço
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Endereço Completo *</Label>
                    <Input
                      id="address"
                      required
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Rua, número, complemento"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro *</Label>
                    <Input
                      id="neighborhood"
                      required
                      value={formData.neighborhood}
                      onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                      placeholder="Nome do bairro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      required
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Informações Escolares
                </h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="school">Escola *</Label>
                    <Select 
                      value={formData.school} 
                      onValueChange={(value) => handleInputChange('school', value)}
                    >
                      <SelectTrigger id="school">
                        <SelectValue placeholder="Selecione a escola" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="escola-municipal-1">Escola Municipal 1</SelectItem>
                        <SelectItem value="escola-municipal-2">Escola Municipal 2</SelectItem>
                        <SelectItem value="escola-municipal-3">Escola Municipal 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade">Série/Ano *</Label>
                    <Select 
                      value={formData.grade} 
                      onValueChange={(value) => handleInputChange('grade', value)}
                    >
                      <SelectTrigger id="grade">
                        <SelectValue placeholder="Selecione a série" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-ano">1º Ano</SelectItem>
                        <SelectItem value="2-ano">2º Ano</SelectItem>
                        <SelectItem value="3-ano">3º Ano</SelectItem>
                        <SelectItem value="4-ano">4º Ano</SelectItem>
                        <SelectItem value="5-ano">5º Ano</SelectItem>
                        <SelectItem value="6-ano">6º Ano</SelectItem>
                        <SelectItem value="7-ano">7º Ano</SelectItem>
                        <SelectItem value="8-ano">8º Ano</SelectItem>
                        <SelectItem value="9-ano">9º Ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shift">Turno *</Label>
                    <Select 
                      value={formData.shift} 
                      onValueChange={(value) => handleInputChange('shift', value)}
                    >
                      <SelectTrigger id="shift">
                        <SelectValue placeholder="Selecione o turno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="matutino">Matutino</SelectItem>
                        <SelectItem value="vespertino">Vespertino</SelectItem>
                        <SelectItem value="integral">Integral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Necessidades Especiais
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hasPCD"
                      checked={formData.hasPCD}
                      onCheckedChange={(checked) => handleInputChange('hasPCD', checked as boolean)}
                    />
                    <Label htmlFor="hasPCD" className="cursor-pointer">
                      Aluno possui necessidades especiais (PCD)
                    </Label>
                  </div>
                  {formData.hasPCD && (
                    <div className="space-y-2 pl-6">
                      <Label htmlFor="pcdDescription">Descrição das Necessidades</Label>
                      <Input
                        id="pcdDescription"
                        value={formData.pcdDescription}
                        onChange={(e) => handleInputChange('pcdDescription', e.target.value)}
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
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="gap-2">
                  <UserPlus size={18} weight="bold" />
                  Realizar Matrícula
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Matrículas Realizadas</CardTitle>
          <CardDescription>
            {students?.length || 0} matrícula(s) no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(!students || students.length === 0) ? (
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
              {students.map((student) => (
                <div 
                  key={student.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserPlus className="text-primary" size={20} weight="duotone" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{student.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {student.grade} - {student.shift} • {student.school}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Responsável</p>
                      <p className="text-sm font-medium">{student.responsibleName}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      student.status === 'approved' ? 'bg-green-100 text-green-700' :
                      student.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {student.status === 'approved' ? 'Aprovada' :
                       student.status === 'rejected' ? 'Rejeitada' : 'Pendente'}
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
