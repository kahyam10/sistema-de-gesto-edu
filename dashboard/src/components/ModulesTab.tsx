'use client'

import { useState } from 'react'
import { Module as ApiModule, SubModule as ApiSubModule } from '@/lib/api'
import {
  useModules,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
  useCreateSubModule,
  useUpdateSubModule,
  useDeleteSubModule,
  useToggleSubModuleStatus
} from '@/hooks/useApi'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash, CheckCircle, Circle, Spinner } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

const statusLabels = {
  planning: 'Planejamento',
  'in-progress': 'Em Progresso',
  completed: 'Concluido',
  blocked: 'Bloqueado'
}

const statusColors = {
  planning: 'bg-slate-500',
  'in-progress': 'bg-blue-500',
  completed: 'bg-green-500',
  blocked: 'bg-red-500'
}

interface ModuleFormData {
  name: string
  description: string
  icon: string
  phase: number
  status: string
  progress: number
  ordem: number
}

interface SubModuleFormData {
  name: string
  description: string
  status: string
  ordem: number
}

export function ModulesTab() {
  const { data: modules = [], isLoading } = useModules()
  const createModule = useCreateModule()
  const updateModule = useUpdateModule()
  const deleteModule = useDeleteModule()
  const createSubModule = useCreateSubModule()
  const updateSubModule = useUpdateSubModule()
  const deleteSubModule = useDeleteSubModule()
  const toggleSubModuleStatus = useToggleSubModuleStatus()

  const [moduleDialogOpen, setModuleDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<ApiModule | null>(null)
  const [moduleForm, setModuleForm] = useState<ModuleFormData>({
    name: '', description: '', icon: 'GraduationCap', phase: 1,
    status: 'planning', progress: 0, ordem: 0
  })

  const [subModuleDialogOpen, setSubModuleDialogOpen] = useState(false)
  const [editingSubModule, setEditingSubModule] = useState<ApiSubModule | null>(null)
  const [currentModuleIdForSubModule, setCurrentModuleIdForSubModule] = useState<string | null>(null)
  const [subModuleForm, setSubModuleForm] = useState<SubModuleFormData>({
    name: '', description: '', status: 'planning', ordem: 0
  })

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [deleteModuleDialogOpen, setDeleteModuleDialogOpen] = useState(false)
  const [moduleToDelete, setModuleToDelete] = useState<ApiModule | null>(null)
  const [deleteSubModuleDialogOpen, setDeleteSubModuleDialogOpen] = useState(false)
  const [subModuleToDelete, setSubModuleToDelete] = useState<ApiSubModule | null>(null)

  // Deriva o módulo selecionado dos dados atualizados do React Query
  const selectedModule = selectedModuleId 
    ? modules.find(m => m.id === selectedModuleId) || null 
    : null

  const handleOpenModuleDialog = (module?: ApiModule) => {
    if (module) {
      setEditingModule(module)
      setModuleForm({
        name: module.name, description: module.description, icon: module.icon,
        phase: module.phase, status: module.status, progress: module.progress, ordem: module.ordem
      })
    } else {
      setEditingModule(null)
      setModuleForm({
        name: '', description: '', icon: 'GraduationCap', phase: 1,
        status: 'planning', progress: 0, ordem: modules.length
      })
    }
    setModuleDialogOpen(true)
  }

  const handleSaveModule = async () => {
    if (!moduleForm.name.trim()) return
    try {
      if (editingModule) {
        await updateModule.mutateAsync({ id: editingModule.id, data: moduleForm })
      } else {
        await createModule.mutateAsync(moduleForm)
      }
      setModuleDialogOpen(false)
    } catch (error) { console.error('Erro ao salvar modulo:', error) }
  }

  const handleDeleteModule = async () => {
    if (!moduleToDelete) return
    try {
      await deleteModule.mutateAsync(moduleToDelete.id)
      setDeleteModuleDialogOpen(false)
      setModuleToDelete(null)
    } catch (error) { console.error('Erro ao excluir modulo:', error) }
  }

  const handleOpenSubModuleDialog = (moduleId: string, subModule?: ApiSubModule) => {
    setCurrentModuleIdForSubModule(moduleId)
    if (subModule) {
      setEditingSubModule(subModule)
      setSubModuleForm({
        name: subModule.name, description: subModule.description,
        status: subModule.status, ordem: subModule.ordem
      })
    } else {
      setEditingSubModule(null)
      const module = modules.find(m => m.id === moduleId)
      setSubModuleForm({ name: '', description: '', status: 'planning', ordem: module?.subModules?.length || 0 })
    }
    setSubModuleDialogOpen(true)
  }

  const handleSaveSubModule = async () => {
    if (!subModuleForm.name.trim() || !currentModuleIdForSubModule) return
    try {
      if (editingSubModule) {
        await updateSubModule.mutateAsync({ id: editingSubModule.id, data: subModuleForm })
      } else {
        await createSubModule.mutateAsync({ moduleId: currentModuleIdForSubModule, data: subModuleForm })
      }
      setSubModuleDialogOpen(false)
    } catch (error) { console.error('Erro ao salvar submodulo:', error) }
  }

  const handleDeleteSubModule = async () => {
    if (!subModuleToDelete) return
    try {
      await deleteSubModule.mutateAsync(subModuleToDelete.id)
      setDeleteSubModuleDialogOpen(false)
      setSubModuleToDelete(null)
    } catch (error) { console.error('Erro ao excluir submodulo:', error) }
  }

  const handleToggleSubModule = async (subModuleId: string) => {
    try { await toggleSubModuleStatus.mutateAsync(subModuleId) }
    catch (error) { console.error('Erro ao alternar status:', error) }
  }

  const handleOpenDetails = (module: ApiModule) => {
    setSelectedModuleId(module.id)
    setDetailsDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando modulos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Modulos do Sistema</h2>
          <p className="text-muted-foreground">Gerencie os modulos e submodulos do sistema educacional</p>
        </div>
        <Button onClick={() => handleOpenModuleDialog()}>
          <Plus className="w-4 h-4 mr-2" />Novo Modulo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, index) => (
          <motion.div key={module.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleOpenDetails(module)}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${statusColors[module.status as keyof typeof statusColors]} bg-opacity-20`}>
                    <span className="text-2xl">📚</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{module.name}</h3>
                    <Badge variant="outline" className="mt-1">Fase {module.phase}</Badge>
                  </div>
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModuleDialog(module)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { setModuleToDelete(module); setDeleteModuleDialogOpen(true) }}><Trash className="w-4 h-4" /></Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{module.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">{module.progress}%</span>
                </div>
                <Progress value={module.progress} className="h-2" />
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <Badge className={statusColors[module.status as keyof typeof statusColors]}>{statusLabels[module.status as keyof typeof statusLabels]}</Badge>
                <span className="text-sm text-muted-foreground">{module.subModules?.length || 0} submodulos</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {modules.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum modulo cadastrado.</p>
          <Button className="mt-4" onClick={() => handleOpenModuleDialog()}><Plus className="w-4 h-4 mr-2" />Adicionar primeiro modulo</Button>
        </div>
      )}

      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingModule ? 'Editar Modulo' : 'Novo Modulo'}</DialogTitle>
            <DialogDescription>{editingModule ? 'Atualize as informacoes do modulo.' : 'Preencha as informacoes do novo modulo.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label htmlFor="name">Nome</Label><Input id="name" value={moduleForm.name} onChange={e => setModuleForm({ ...moduleForm, name: e.target.value })} placeholder="Nome do modulo" /></div>
            <div><Label htmlFor="description">Descricao</Label><Textarea id="description" value={moduleForm.description} onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })} placeholder="Descricao do modulo" rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="phase">Fase</Label><Select value={String(moduleForm.phase)} onValueChange={v => setModuleForm({ ...moduleForm, phase: parseInt(v) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Fase 1</SelectItem><SelectItem value="2">Fase 2</SelectItem><SelectItem value="3">Fase 3</SelectItem><SelectItem value="4">Fase 4</SelectItem></SelectContent></Select></div>
              <div><Label htmlFor="status">Status</Label><Select value={moduleForm.status} onValueChange={v => setModuleForm({ ...moduleForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="planning">Planejamento</SelectItem><SelectItem value="in-progress">Em Progresso</SelectItem><SelectItem value="completed">Concluido</SelectItem><SelectItem value="blocked">Bloqueado</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label htmlFor="progress">Progresso ({moduleForm.progress}%)</Label><Input id="progress" type="range" min="0" max="100" value={moduleForm.progress} onChange={e => setModuleForm({ ...moduleForm, progress: parseInt(e.target.value) })} className="w-full" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveModule} disabled={createModule.isPending || updateModule.isPending}>{(createModule.isPending || updateModule.isPending) && <Spinner className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedModule && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl">{selectedModule.name}</DialogTitle>
                  <Badge className={statusColors[selectedModule.status as keyof typeof statusColors]}>{statusLabels[selectedModule.status as keyof typeof statusLabels]}</Badge>
                </div>
                <DialogDescription>{selectedModule.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Progresso Geral</span><span className="font-medium">{selectedModule.progress}%</span></div>
                <Progress value={selectedModule.progress} className="h-2" />
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Submodulos</h4>
                  <Button size="sm" onClick={() => handleOpenSubModuleDialog(selectedModule.id)}><Plus className="w-4 h-4 mr-2" />Adicionar</Button>
                </div>
                <div className="space-y-2">
                  {selectedModule.subModules?.map(subModule => (
                    <div key={subModule.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleToggleSubModule(subModule.id)} className="hover:scale-110 transition-transform">
                          {subModule.status === 'completed' ? <CheckCircle className="w-5 h-5 text-green-500" weight="fill" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                        </button>
                        <div>
                          <p className={`font-medium ${subModule.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{subModule.name}</p>
                          <p className="text-xs text-muted-foreground">{subModule.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenSubModuleDialog(selectedModule.id, subModule)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setSubModuleToDelete(subModule); setDeleteSubModuleDialogOpen(true) }}><Trash className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                  {(!selectedModule.subModules || selectedModule.subModules.length === 0) && <p className="text-center text-muted-foreground py-4">Nenhum submodulo cadastrado.</p>}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={subModuleDialogOpen} onOpenChange={setSubModuleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSubModule ? 'Editar Submodulo' : 'Novo Submodulo'}</DialogTitle>
            <DialogDescription>{editingSubModule ? 'Atualize as informacoes do submodulo.' : 'Preencha as informacoes do novo submodulo.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label htmlFor="subName">Nome</Label><Input id="subName" value={subModuleForm.name} onChange={e => setSubModuleForm({ ...subModuleForm, name: e.target.value })} placeholder="Nome do submodulo" /></div>
            <div><Label htmlFor="subDescription">Descricao</Label><Textarea id="subDescription" value={subModuleForm.description} onChange={e => setSubModuleForm({ ...subModuleForm, description: e.target.value })} placeholder="Descricao do submodulo" rows={3} /></div>
            <div><Label htmlFor="subStatus">Status</Label><Select value={subModuleForm.status} onValueChange={v => setSubModuleForm({ ...subModuleForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="planning">Planejamento</SelectItem><SelectItem value="in-progress">Em Progresso</SelectItem><SelectItem value="completed">Concluido</SelectItem><SelectItem value="blocked">Bloqueado</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubModuleDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveSubModule} disabled={createSubModule.isPending || updateSubModule.isPending}>{(createSubModule.isPending || updateSubModule.isPending) && <Spinner className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteModuleDialogOpen} onOpenChange={setDeleteModuleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir Modulo</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir o modulo "{moduleToDelete?.name}"? Esta acao nao pode ser desfeita e todos os submodulos serao excluidos.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteModule}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteSubModuleDialogOpen} onOpenChange={setDeleteSubModuleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir Submodulo</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir o submodulo "{subModuleToDelete?.name}"? Esta acao nao pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteSubModule}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
