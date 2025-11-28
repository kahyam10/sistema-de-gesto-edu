'use client'

import { useState } from 'react'
import { Phase as ApiPhase, Module as ApiModule } from '@/lib/api'
import { usePhases, useCreatePhase, useUpdatePhase, useDeletePhase, useModules } from '@/hooks/useApi'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash, ArrowRight, Spinner, Calendar, Clock } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

const statusLabels = { planning: 'Planejamento', 'in-progress': 'Em Progresso', completed: 'Concluido', blocked: 'Bloqueado' }
const statusColors = { planning: 'bg-slate-500', 'in-progress': 'bg-blue-500', completed: 'bg-green-500', blocked: 'bg-red-500' }

interface PhaseFormData {
  name: string
  description: string
  monthRange: string
  duration: string
  status: string
  ordem: number
  moduleIds: string[]
}

export function TimelineTab() {
  const { data: phases = [], isLoading: phasesLoading } = usePhases()
  const { data: modules = [], isLoading: modulesLoading } = useModules()
  const createPhase = useCreatePhase()
  const updatePhase = useUpdatePhase()
  const deletePhase = useDeletePhase()

  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false)
  const [editingPhase, setEditingPhase] = useState<ApiPhase | null>(null)
  const [phaseForm, setPhaseForm] = useState<PhaseFormData>({ name: '', description: '', monthRange: '', duration: '', status: 'planning', ordem: 0, moduleIds: [] })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [phaseToDelete, setPhaseToDelete] = useState<ApiPhase | null>(null)

  const isLoading = phasesLoading || modulesLoading

  const handleOpenPhaseDialog = (phase?: ApiPhase) => {
    if (phase) {
      setEditingPhase(phase)
      setPhaseForm({ name: phase.name, description: phase.description, monthRange: phase.monthRange, duration: phase.duration, status: phase.status, ordem: phase.ordem, moduleIds: phase.moduleIds || [] })
    } else {
      setEditingPhase(null)
      setPhaseForm({ name: '', description: '', monthRange: '', duration: '', status: 'planning', ordem: phases.length, moduleIds: [] })
    }
    setPhaseDialogOpen(true)
  }

  const handleSavePhase = async () => {
    if (!phaseForm.name.trim() || !phaseForm.description.trim()) return
    try {
      if (editingPhase) { await updatePhase.mutateAsync({ id: editingPhase.id, data: phaseForm }) }
      else { await createPhase.mutateAsync(phaseForm) }
      setPhaseDialogOpen(false)
    } catch (error) { console.error('Erro ao salvar fase:', error) }
  }

  const handleDeletePhase = async () => {
    if (!phaseToDelete) return
    try {
      await deletePhase.mutateAsync(phaseToDelete.id)
      setDeleteDialogOpen(false)
      setPhaseToDelete(null)
    } catch (error) { console.error('Erro ao excluir fase:', error) }
  }

  const handleToggleModule = (moduleId: string) => {
    const newModuleIds = phaseForm.moduleIds.includes(moduleId) ? phaseForm.moduleIds.filter(id => id !== moduleId) : [...phaseForm.moduleIds, moduleId]
    setPhaseForm({ ...phaseForm, moduleIds: newModuleIds })
  }

  const getModulesForPhase = (phase: ApiPhase): ApiModule[] => {
    if (!phase.moduleIds || phase.moduleIds.length === 0) return []
    return modules.filter(m => phase.moduleIds.includes(m.id))
  }

  if (isLoading) { return (<div className="flex items-center justify-center py-12"><Spinner className="w-8 h-8 animate-spin" /><span className="ml-2">Carregando cronograma...</span></div>) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Cronograma de Implementacao</h2><p className="text-muted-foreground">Gerencie as fases do projeto e seus modulos associados</p></div>
        <Button onClick={() => handleOpenPhaseDialog()}><Plus className="w-4 h-4 mr-2" />Nova Fase</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {phases.map((phase, index) => {
          const phaseModules = getModulesForPhase(phase)
          return (
            <motion.div key={phase.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="relative">
              {index < phases.length - 1 && (<div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border"><ArrowRight className="absolute -right-2 -top-2 w-5 h-5 text-muted-foreground" /></div>)}
              <Card className="p-6 h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${statusColors[phase.status as keyof typeof statusColors]}`}>{index + 1}</div>
                    <div>
                      <h3 className="font-semibold text-lg">{phase.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" /><span>{phase.monthRange}</span><Clock className="w-4 h-4 ml-2" /><span>{phase.duration}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenPhaseDialog(phase)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { setPhaseToDelete(phase); setDeleteDialogOpen(true) }}><Trash className="w-4 h-4" /></Button>
                  </div>
                </div>
                <Badge className={`${statusColors[phase.status as keyof typeof statusColors]} mb-4`}>{statusLabels[phase.status as keyof typeof statusLabels]}</Badge>
                <p className="text-sm text-muted-foreground mb-4">{phase.description}</p>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Modulos nesta fase:</h4>
                  {phaseModules.length > 0 ? (<div className="flex flex-wrap gap-2">{phaseModules.map(module => (<Badge key={module.id} variant="secondary">{module.name}</Badge>))}</div>) : (<p className="text-xs text-muted-foreground">Nenhum modulo associado</p>)}
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {phases.length === 0 && (<div className="text-center py-12 text-muted-foreground"><p>Nenhuma fase cadastrada.</p><Button className="mt-4" onClick={() => handleOpenPhaseDialog()}><Plus className="w-4 h-4 mr-2" />Adicionar primeira fase</Button></div>)}

      {phases.length > 0 && (
        <Card className="p-6 bg-muted/50">
          <h3 className="font-semibold text-lg mb-4">Notas sobre Implementacao</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span><span><strong>Fase 1 (Fundacao):</strong> Estabelece a base com matriculas e RH, essencial para operacao basica</span></li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span><span><strong>Fase 2 (Nucleo Pedagogico):</strong> Implementa o coracao do sistema com gestao pedagogica e portais</span></li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span><span><strong>Fase 3 (Gestao):</strong> Adiciona ferramentas de gestao democratica e administrativa</span></li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span><span><strong>Fase 4 (Otimizacao):</strong> Inteligencia artificial e relatorios avancados para decisoes estrategicas</span></li>
          </ul>
        </Card>
      )}

      <Dialog open={phaseDialogOpen} onOpenChange={setPhaseDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPhase ? 'Editar Fase' : 'Nova Fase'}</DialogTitle><DialogDescription>{editingPhase ? 'Atualize as informacoes da fase.' : 'Preencha as informacoes da nova fase.'}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label htmlFor="name">Nome</Label><Input id="name" value={phaseForm.name} onChange={e => setPhaseForm({ ...phaseForm, name: e.target.value })} placeholder="Ex: Fase 1 - Fundacao" /></div>
            <div><Label htmlFor="description">Descricao</Label><Textarea id="description" value={phaseForm.description} onChange={e => setPhaseForm({ ...phaseForm, description: e.target.value })} placeholder="Descricao da fase" rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="monthRange">Periodo</Label><Input id="monthRange" value={phaseForm.monthRange} onChange={e => setPhaseForm({ ...phaseForm, monthRange: e.target.value })} placeholder="Ex: Meses 1-3" /></div>
              <div><Label htmlFor="duration">Duracao</Label><Input id="duration" value={phaseForm.duration} onChange={e => setPhaseForm({ ...phaseForm, duration: e.target.value })} placeholder="Ex: 3 meses" /></div>
            </div>
            <div><Label htmlFor="status">Status</Label><Select value={phaseForm.status} onValueChange={v => setPhaseForm({ ...phaseForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="planning">Planejamento</SelectItem><SelectItem value="in-progress">Em Progresso</SelectItem><SelectItem value="completed">Concluido</SelectItem><SelectItem value="blocked">Bloqueado</SelectItem></SelectContent></Select></div>
            <div><Label>Modulos Associados</Label><div className="border rounded-md p-4 mt-2 max-h-48 overflow-y-auto space-y-2">{modules.length > 0 ? modules.map(module => (<div key={module.id} className="flex items-center space-x-2"><Checkbox id={`module-${module.id}`} checked={phaseForm.moduleIds.includes(module.id)} onCheckedChange={() => handleToggleModule(module.id)} /><label htmlFor={`module-${module.id}`} className="text-sm cursor-pointer">{module.name}</label></div>)) : (<p className="text-sm text-muted-foreground">Nenhum modulo disponivel</p>)}</div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPhaseDialogOpen(false)}>Cancelar</Button><Button onClick={handleSavePhase} disabled={createPhase.isPending || updatePhase.isPending}>{(createPhase.isPending || updatePhase.isPending) && <Spinner className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir Fase</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir a fase "{phaseToDelete?.name}"? Esta acao nao pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeletePhase}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
