"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, GraduationCap, ChalkboardTeacher, UserCircle, Plus, X, Spinner } from '@phosphor-icons/react';
import type { Turma, Matricula, ProfissionalEducacao } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useTurma,
  useMatriculas,
  useProfissionais,
  useEscolas,
  useEtapas,
  useSeries,
  useAddProfessorToTurma,
  useRemoveProfessorFromTurma,
} from '@/hooks/useApi';

interface TurmaDetailsProps {
  turma: Turma;
  onBack: () => void;
}

export function TurmaDetails({ turma, onBack }: TurmaDetailsProps) {
  const { data: currentTurma, isLoading: loadingTurma } = useTurma(turma.id);
  const { data: matriculas = [] } = useMatriculas({ turmaId: turma.id });
  const { data: profissionais = [] } = useProfissionais();
  const { data: escolas = [] } = useEscolas();
  const { data: etapas = [] } = useEtapas();
  const { data: series = [] } = useSeries();

  const addProfessor = useAddProfessorToTurma();
  const removeProfessor = useRemoveProfessorFromTurma();

  const [isProfessoresDialogOpen, setIsProfessoresDialogOpen] = useState(false);
  const [isAuxiliaresDialogOpen, setIsAuxiliaresDialogOpen] = useState(false);

  const turmaData = currentTurma || turma;

  const alunosNaTurma = matriculas.filter(
    (m: Matricula) => m.turmaId === turma.id && m.status === 'ATIVA'
  );

  const professoresIds = turmaData.professores
    ?.filter(p => p.tipo === 'PROFESSOR')
    .map(p => p.profissional.id) || [];

  const auxiliaresIds = turmaData.professores
    ?.filter(p => p.tipo === 'AUXILIAR')
    .map(p => p.profissional.id) || [];

  const professoresVinculados = turmaData.professores
    ?.filter(p => p.tipo === 'PROFESSOR')
    .map(p => p.profissional) || [];

  const auxiliaresVinculados = turmaData.professores
    ?.filter(p => p.tipo === 'AUXILIAR')
    .map(p => p.profissional) || [];

  const professoresDisponiveis = profissionais.filter(
    (p: ProfissionalEducacao) => p.tipo === 'PROFESSOR' && p.ativo && !professoresIds.includes(p.id)
  );

  const auxiliaresDisponiveis = profissionais.filter(
    (p: ProfissionalEducacao) => p.tipo === 'AUXILIAR' && p.ativo && !auxiliaresIds.includes(p.id)
  );

  const escola = escolas.find(e => e.id === turma.escolaId);

  const getSeriNome = (serieId: string) => {
    const serie = series.find(s => s.id === serieId);
    if (!serie) return 'N/A';
    const etapa = etapas.find(e => e.id === serie.etapaId);
    return etapa ? etapa.nome + ' - ' + serie.nome : serie.nome;
  };

  const handleAddProfessor = async (profissionalId: string, tipo: string) => {
    try {
      await addProfessor.mutateAsync({ turmaId: turma.id, data: { profissionalId, tipo } });
      toast.success(tipo === 'PROFESSOR' ? 'Professor adicionado!' : 'Auxiliar adicionado!');
    } catch {
      toast.error('Erro ao adicionar profissional');
    }
  };

  const handleRemoveProfessor = async (profissionalId: string) => {
    try {
      await removeProfessor.mutateAsync({ turmaId: turma.id, profissionalId });
      toast.success('Profissional removido da turma!');
    } catch {
      toast.error('Erro ao remover profissional');
    }
  };

  if (loadingTurma) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold">{turmaData.nome}</h2>
          <p className="text-muted-foreground mt-1">
            {escola?.nome} - {getSeriNome(turmaData.serieId)}
          </p>
        </div>
        <Badge variant={turmaData.ativo ? 'default' : 'secondary'} className="text-sm px-3 py-1">
          {turmaData.ativo ? 'Ativa' : 'Inativa'}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Turno</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">{turmaData.turno.toLowerCase()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ano Letivo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{turmaData.anoLetivo}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Capacidade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{alunosNaTurma.length}/{turmaData.capacidadeMaxima}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Limite PCD</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {alunosNaTurma.filter((a: Matricula) => a.possuiDeficiencia).length}/{turmaData.limitePCD}
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
              <CardDescription>{alunosNaTurma.length} aluno(s) nesta turma</CardDescription>
            </CardHeader>
            <CardContent>
              {alunosNaTurma.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="mx-auto mb-4 text-muted-foreground" size={48} weight="duotone" />
                  <p className="text-muted-foreground">Nenhum aluno nesta turma</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alunosNaTurma.map((matricula: Matricula) => (
                    <div key={matricula.id} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{matricula.nomeAluno}</h4>
                        {matricula.possuiDeficiencia && <Badge variant="secondary">PCD</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">Responsavel: {matricula.nomeResponsavel}</p>
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
                  <CardDescription>{professoresVinculados.length} professor(es)</CardDescription>
                </div>
                <Button onClick={() => setIsProfessoresDialogOpen(true)}><Plus size={18} /> Adicionar</Button>
              </div>
            </CardHeader>
            <CardContent>
              {professoresVinculados.length === 0 ? (
                <div className="text-center py-12">
                  <ChalkboardTeacher className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <p className="text-muted-foreground">Nenhum professor vinculado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {professoresVinculados.map((prof) => (
                    <div key={prof.id} className="p-4 border rounded-lg flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{prof.nome}</h4>
                        <p className="text-sm text-muted-foreground">{prof.formacao || ''}</p>
                      </div>
                      <Button variant="outline" size="icon" onClick={() => handleRemoveProfessor(prof.id)} disabled={removeProfessor.isPending}>
                        {removeProfessor.isPending ? <Spinner className="animate-spin" size={16} /> : <X size={16} />}
                      </Button>
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
                  <CardDescription>{auxiliaresVinculados.length} auxiliar(es)</CardDescription>
                </div>
                <Button onClick={() => setIsAuxiliaresDialogOpen(true)}><Plus size={18} /> Adicionar</Button>
              </div>
            </CardHeader>
            <CardContent>
              {auxiliaresVinculados.length === 0 ? (
                <div className="text-center py-12">
                  <UserCircle className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <p className="text-muted-foreground">Nenhum auxiliar vinculado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auxiliaresVinculados.map((prof) => (
                    <div key={prof.id} className="p-4 border rounded-lg flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{prof.nome}</h4>
                        <p className="text-sm text-muted-foreground">{prof.formacao || ''}</p>
                      </div>
                      <Button variant="outline" size="icon" onClick={() => handleRemoveProfessor(prof.id)} disabled={removeProfessor.isPending}>
                        {removeProfessor.isPending ? <Spinner className="animate-spin" size={16} /> : <X size={16} />}
                      </Button>
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
            <DialogTitle>Adicionar Professores</DialogTitle>
            <DialogDescription>Selecione os professores para vincular</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            {professoresDisponiveis.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">Nenhum professor disponivel</p>
            ) : (
              <div className="space-y-2">
                {professoresDisponiveis.map((prof) => (
                  <div key={prof.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div><h5 className="font-medium">{prof.nome}</h5></div>
                    <Button size="sm" onClick={() => handleAddProfessor(prof.id, 'PROFESSOR')} disabled={addProfessor.isPending}>
                      {addProfessor.isPending ? <Spinner className="animate-spin" size={16} /> : <Plus size={16} />}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setIsProfessoresDialogOpen(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAuxiliaresDialogOpen} onOpenChange={setIsAuxiliaresDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Auxiliares</DialogTitle>
            <DialogDescription>Selecione os auxiliares para vincular</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            {auxiliaresDisponiveis.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">Nenhum auxiliar disponivel</p>
            ) : (
              <div className="space-y-2">
                {auxiliaresDisponiveis.map((prof) => (
                  <div key={prof.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div><h5 className="font-medium">{prof.nome}</h5></div>
                    <Button size="sm" onClick={() => handleAddProfessor(prof.id, 'AUXILIAR')} disabled={addProfessor.isPending}>
                      {addProfessor.isPending ? <Spinner className="animate-spin" size={16} /> : <Plus size={16} />}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setIsAuxiliaresDialogOpen(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
