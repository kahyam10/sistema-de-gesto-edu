import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus, GraduationCap, Pencil, Trash, ListChecks } from '@phosphor-icons/react'
import { EtapaEnsino, Serie } from '@/lib/types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'

export function EtapasManager() {
  const [etapas, setEtapas] = useKV<EtapaEnsino[]>('school-etapas', [])
  const [series, _] = useKV<Serie[]>('school-series', [])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEtapa, setEditingEtapa] = useState<EtapaEnsino | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    seriesIds: [] as string[]
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.seriesIds.length === 0) {
      toast.error('Selecione pelo menos uma série!')
      return
    }

    const selectedSeries = (series || []).filter(s => formData.seriesIds.includes(s.id))

    if (editingEtapa) {
      setEtapas((current) => 
        (current || []).map(e => 
          e.id === editingEtapa.id 
            ? { 
                ...e, 
                nome: formData.nome, 
                descricao: formData.descricao,
                series: selectedSeries 
              }
            : e
        )
      )
      toast.success('Etapa atualizada com sucesso!')
    } else {
      const newEtapa: EtapaEnsino = {
        id: `ETP-${Date.now()}`,
        nome: formData.nome,
        descricao: formData.descricao,
        series: selectedSeries
      }
      setEtapas((current) => [...(current || []), newEtapa])
      toast.success('Etapa cadastrada com sucesso!')
    }

    resetForm()
  }

  const resetForm = () => {
    setFormData({ nome: '', descricao: '', seriesIds: [] })
    setEditingEtapa(null)
    setIsFormOpen(false)
  }

  const handleEdit = (etapa: EtapaEnsino) => {
    setEditingEtapa(etapa)
    setFormData({ 
      nome: etapa.nome, 
      descricao: etapa.descricao,
      seriesIds: etapa.series.map(s => s.id)
    })
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    setEtapas((current) => (current || []).filter(e => e.id !== id))
    toast.success('Etapa removida com sucesso!')
  }

  const toggleSerie = (serieId: string) => {
    setFormData(prev => ({
      ...prev,
      seriesIds: prev.seriesIds.includes(serieId)
        ? prev.seriesIds.filter(id => id !== serieId)
        : [...prev.seriesIds, serieId]
    }))
  }

  const sortedSeries = [...(series || [])].sort((a, b) => a.ordem - b.ordem)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Cadastro de Etapas de Ensino</h3>
          <p className="text-muted-foreground mt-1">
            Gerencie as etapas escolares e suas séries
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} size="lg" className="gap-2">
          <Plus size={20} weight="bold" />
          Nova Etapa
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="text-primary" size={24} weight="duotone" />
              {editingEtapa ? 'Editar Etapa' : 'Nova Etapa'}
            </DialogTitle>
            <DialogDescription>
              {editingEtapa ? 'Atualize os dados da etapa de ensino' : 'Cadastre uma nova etapa de ensino'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Etapa *</Label>
              <Input
                id="nome"
                required
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Ensino Fundamental I, Ensino Médio..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição da etapa de ensino"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Séries vinculadas *</Label>
              {sortedSeries.length === 0 ? (
                <div className="p-4 border rounded-lg bg-muted/30 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma série cadastrada. Cadastre séries primeiro para poder vinculá-las.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-48 border rounded-lg p-4">
                  <div className="space-y-3">
                    {sortedSeries.map((serie) => (
                      <div key={serie.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`serie-${serie.id}`}
                          checked={formData.seriesIds.includes(serie.id)}
                          onCheckedChange={() => toggleSerie(serie.id)}
                        />
                        <Label 
                          htmlFor={`serie-${serie.id}`} 
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <span className="text-xs font-bold text-primary bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center">
                            {serie.ordem}
                          </span>
                          {serie.nome}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2" disabled={sortedSeries.length === 0}>
                {editingEtapa ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Etapas Cadastradas</CardTitle>
          <CardDescription>
            {(etapas || []).length} etapa(s) no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(!etapas || etapas.length === 0) ? (
            <div className="text-center py-12">
              <GraduationCap className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
              <p className="text-muted-foreground">
                Nenhuma etapa cadastrada ainda
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em "Nova Etapa" para começar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {etapas.map((etapa) => (
                <div 
                  key={etapa.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="text-primary" size={20} weight="duotone" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{etapa.nome}</h4>
                        {etapa.descricao && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {etapa.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(etapa)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(etapa.id)}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </div>
                  <div className="pl-13">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <ListChecks size={16} />
                      <span className="font-medium">{etapa.series.length} série(s):</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {etapa.series.sort((a, b) => a.ordem - b.ordem).map((serie) => (
                        <div 
                          key={serie.id}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium flex items-center gap-1"
                        >
                          <span className="font-bold">{serie.ordem}.</span> {serie.nome}
                        </div>
                      ))}
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
