"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  usePEIs,
  useCreatePEI,
  useEstatisticasAEE,
  useEscolas,
  useMatriculas,
} from "@/hooks/useApi";
import { Student, Plus, FileText } from "@phosphor-icons/react";

export function EducacaoEspecialManager() {
  const [selectedEscola, setSelectedEscola] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    matriculaId: "",
    anoLetivo: new Date().getFullYear(),
    deficiencia: "",
    cid: "",
    laudoMedico: false,
    necessitaAEE: true,
    frequenciaAEE: "",
    objetivosGerais: "",
    estrategias: "",
  });

  const { data: escolas = [], isLoading: loadingEscolas } = useEscolas();
  const { data: matriculas = [] } = useMatriculas();

  const filters: any = { anoLetivo: formData.anoLetivo };
  if (selectedEscola) filters.escolaId = selectedEscola;

  const { data: peis = [], isLoading } = usePEIs(filters);
  const { data: estatisticas } = useEstatisticasAEE(selectedEscola);
  const createMutation = useCreatePEI();

  const handleCreate = () => {
    if (!formData.matriculaId || !formData.deficiencia) return;

    createMutation.mutate(formData, {
      onSuccess: () => {
        setDialogOpen(false);
        setFormData({
          matriculaId: "",
          anoLetivo: new Date().getFullYear(),
          deficiencia: "",
          cid: "",
          laudoMedico: false,
          necessitaAEE: true,
          frequenciaAEE: "",
          objetivosGerais: "",
          estrategias: "",
        });
      },
    });
  };

  if (loadingEscolas) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Student size={24} />
                Educação Especial / AEE
              </CardTitle>
              <CardDescription>
                Planos Educacionais Individualizados e Atendimento Especializado
              </CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo PEI
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Escola (Opcional)</Label>
              <Select value={selectedEscola} onValueChange={setSelectedEscola}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as escolas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {escolas.map((escola) => (
                    <SelectItem key={escola.id} value={escola.id}>
                      {escola.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ano Letivo</Label>
              <Select
                value={formData.anoLetivo.toString()}
                onValueChange={(v) =>
                  setFormData({ ...formData, anoLetivo: parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((ano) => (
                    <SelectItem key={ano} value={ano.toString()}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Total de PEIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{estatisticas.totalPEIs || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Alunos Atendidos (AEE)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {estatisticas.alunosAtendidos || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Salas de Recursos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {estatisticas.totalSalasRecursos || 0}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle>Planos Educacionais Individualizados</CardTitle>
          <CardDescription>{peis.length} PEI(s) encontrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : peis.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Deficiência</TableHead>
                  <TableHead>CID</TableHead>
                  <TableHead>AEE</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atendimentos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {peis.map((pei) => (
                  <TableRow key={pei.id}>
                    <TableCell className="font-medium">
                      {pei.matricula?.nomeAluno || "Desconhecido"}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {pei.matricula?.turma?.nome || "-"}
                      </span>
                    </TableCell>
                    <TableCell>{pei.deficiencia}</TableCell>
                    <TableCell>{pei.cid || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={pei.necessitaAEE ? "default" : "outline"}>
                        {pei.necessitaAEE ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={pei.status === "ATIVO" ? "default" : "secondary"}
                      >
                        {pei.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {pei._count?.atendimentos || 0}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText
                size={48}
                className="text-muted-foreground mb-4"
                weight="duotone"
              />
              <p className="text-lg font-medium text-muted-foreground">
                Nenhum PEI encontrado
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Criar */}
      <Dialog open={dialogOpen} onValueChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Plano Educacional Individualizado</DialogTitle>
            <DialogDescription>
              Crie um PEI para aluno com necessidades especiais
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Matrícula *</Label>
                <Select
                  value={formData.matriculaId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, matriculaId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {matriculas.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nomeAluno} - {m.numeroMatricula}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ano Letivo</Label>
                <Input
                  type="number"
                  value={formData.anoLetivo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      anoLetivo: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Deficiência *</Label>
                <Input
                  value={formData.deficiencia}
                  onChange={(e) =>
                    setFormData({ ...formData, deficiencia: e.target.value })
                  }
                  placeholder="Ex: Deficiência Intelectual"
                />
              </div>

              <div className="space-y-2">
                <Label>CID (Opcional)</Label>
                <Input
                  value={formData.cid}
                  onChange={(e) =>
                    setFormData({ ...formData, cid: e.target.value })
                  }
                  placeholder="Ex: F70"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.laudoMedico}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, laudoMedico: checked })
                }
              />
              <Label>Possui Laudo Médico</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.necessitaAEE}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, necessitaAEE: checked })
                }
              />
              <Label>Necessita Atendimento AEE</Label>
            </div>

            {formData.necessitaAEE && (
              <div className="space-y-2">
                <Label>Frequência AEE</Label>
                <Input
                  value={formData.frequenciaAEE}
                  onChange={(e) =>
                    setFormData({ ...formData, frequenciaAEE: e.target.value })
                  }
                  placeholder="Ex: 2x por semana"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Objetivos Gerais</Label>
              <Textarea
                value={formData.objetivosGerais}
                onChange={(e) =>
                  setFormData({ ...formData, objetivosGerais: e.target.value })
                }
                rows={3}
                placeholder="Descreva os objetivos gerais do PEI..."
              />
            </div>

            <div className="space-y-2">
              <Label>Estratégias Pedagógicas</Label>
              <Textarea
                value={formData.estrategias}
                onChange={(e) =>
                  setFormData({ ...formData, estrategias: e.target.value })
                }
                rows={3}
                placeholder="Descreva as estratégias que serão utilizadas..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !formData.matriculaId ||
                !formData.deficiencia ||
                createMutation.isPending
              }
            >
              Criar PEI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
