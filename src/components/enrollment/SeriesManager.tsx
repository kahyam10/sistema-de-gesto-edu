import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, X, ListNumbers, Pencil, Trash } from '@phosphor-icons/react'
import { Serie } from '@/lib/types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function SeriesManager() {
  const [series, setSeries] = useKV<Serie[]>('school-series', [])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSerie, setEditingSerie] = useState<Serie | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    ordem: 1
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingSerie) {
      setSeries((current) => 
        (current || []).map(s => 
          s.id === editingSerie.id 
            ? { ...s, nome: formData.nome, ordem: formData.ordem }
            : s
        )
      )
      toast.success('Série atualizada com sucesso!')
    } else {
      const newSerie: Serie = {
        id: `SER-${Date.now()}`,
        nome: formData.nome,
        ordem: formData.ordem
      }
      setSeries((current) => [...(current || []), newSerie])
      toast.success('Série cadastrada com sucesso!')
    }

    resetForm()
  }

  const resetForm = () => {
    setFormData({ nome: '', ordem: 1 })
    setEditingSerie(null)
    setIsFormOpen(false)
  }

  const handleEdit = (serie: Serie) => {
    setEditingSerie(serie)
    setFormData({ nome: serie.nome, ordem: serie.ordem })
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    setSeries((current) => (current || []).filter(s => s.id !== id))
    toast.success('Série removida com sucesso!')
  }

  const sortedSeries = [...(series || [])].sort((a, b) => a.ordem - b.ordem)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Cadastro de Séries Escolares</h3>
          <p className="text-muted-foreground mt-1">
            Gerencie as séries/anos escolares disponíveis
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} size="lg" className="gap-2">
          <Plus size={20} weight="bold" />
          Nova Série
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListNumbers className="text-primary" size={24} weight="duotone" />
              {editingSerie ? 'Editar Série' : 'Nova Série'}
            </DialogTitle>
            <DialogDescription>
              {editingSerie ? 'Atualize os dados da série' : 'Cadastre uma nova série escolar'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Série *</Label>
              <Input
                id="nome"
                required
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: 1º Ano, 2º Ano..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ordem">Ordem *</Label>
              <Input
                id="ordem"
                type="number"
                min="1"
                required
                value={formData.ordem}
                onChange={(e) => setFormData(prev => ({ ...prev, ordem: parseInt(e.target.value) }))}
                placeholder="1"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2">
                {editingSerie ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Séries Cadastradas</CardTitle>
          <CardDescription>
            {sortedSeries.length} série(s) no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedSeries.length === 0 ? (
            <div className="text-center py-12">
              <ListNumbers className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
              <p className="text-muted-foreground">
                Nenhuma série cadastrada ainda
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em "Nova Série" para começar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedSeries.map((serie) => (
                <div 
                  key={serie.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold">{serie.ordem}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">{serie.nome}</h4>
                      <p className="text-sm text-muted-foreground">
                        Ordem: {serie.ordem}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(serie)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(serie.id)}
                    >
                      <Trash size={16} />
                    </Button>
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
