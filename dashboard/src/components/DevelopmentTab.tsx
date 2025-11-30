"use client";

import { useState } from "react";
import { useModules, useUpdateSubModule } from "@/hooks/useApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  ListChecks,
  ArrowLeft,
  Buildings,
  ListNumbers,
  Spinner,
  Wrench,
  CaretRight,
  CheckCircle,
  Circle,
  Clock,
  Warning,
  ArrowSquareOut,
  Code,
} from "@phosphor-icons/react";
import { SeriesManager } from "@/components/enrollment/SeriesManager";
import { EtapasManager } from "@/components/enrollment/EtapasManager";
import { EscolasManager } from "@/components/enrollment/EscolasManager";
import { MatriculasManager } from "@/components/enrollment/MatriculasManager";
import { TurmasManager } from "@/components/enrollment/TurmasManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Module, SubModule } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const moduleIcons: Record<string, React.ReactNode> = {
  Matriculas: <GraduationCap size={24} />,
  "Gestao de RH": <Users size={24} />,
  Pedagogico: <BookOpen size={24} />,
  Calendario: <Calendar size={24} />,
  Planejamento: <ListChecks size={24} />,
};

const statusConfig = {
  planning: {
    label: "Planejamento",
    color: "bg-slate-100 text-slate-700",
    icon: <Circle size={16} weight="duotone" />,
    badgeVariant: "outline" as const,
  },
  "in-progress": {
    label: "Em Progresso",
    color: "bg-blue-100 text-blue-700",
    icon: <Clock size={16} weight="duotone" />,
    badgeVariant: "secondary" as const,
  },
  completed: {
    label: "Concluido",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle size={16} weight="duotone" />,
    badgeVariant: "default" as const,
  },
  blocked: {
    label: "Bloqueado",
    color: "bg-red-100 text-red-700",
    icon: <Warning size={16} weight="duotone" />,
    badgeVariant: "destructive" as const,
  },
};

const subModuleRoutes: Record<string, { tab: string }> = {
  "Cadastro de Alunos": { tab: "matriculas" },
  "Cadastro de Escolas": { tab: "escolas" },
  "Cadastro de Turmas": { tab: "turmas" },
  "Cadastro de Series": { tab: "series" },
  "Cadastro de Etapas": { tab: "etapas" },
  "Gestao de Matriculas": { tab: "matriculas" },
  "Alocacao em Turmas": { tab: "turmas" },
  "Historico do Aluno": { tab: "matriculas" },
};

export function DevelopmentTab() {
  const { data: modules = [], isLoading } = useModules();
  const updateSubModule = useUpdateSubModule();

  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [activeResourceTab, setActiveResourceTab] = useState<string>("etapas");

  const handleStatusChange = async (
    subModule: SubModule,
    newStatus: SubModule["status"]
  ) => {
    await updateSubModule.mutateAsync({
      id: subModule.id,
      data: { status: newStatus },
    });
  };

  const navigateToResource = (subModuleName: string) => {
    const route = subModuleRoutes[subModuleName];
    if (route) {
      setActiveResourceTab(route.tab);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando modulos...</span>
      </div>
    );
  }

  if (selectedModule) {
    const completedCount =
      selectedModule.subModules?.filter((s) => s.status === "completed").length || 0;
    const totalCount = selectedModule.subModules?.length || 0;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedModule(null)} className="gap-2">
            <ArrowLeft size={18} />
            Voltar
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                {moduleIcons[selectedModule.name] || <Wrench size={24} />}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedModule.name}</h2>
                <p className="text-muted-foreground">{selectedModule.description}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">Progresso Geral</div>
            <div className="flex items-center gap-2">
              <Progress value={progress} className="w-32 h-2" />
              <span className="font-bold">{progress}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Code size={20} />
                Submodulos
              </CardTitle>
              <CardDescription>
                {completedCount} de {totalCount} concluidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {selectedModule.subModules
                    ?.sort((a, b) => a.ordem - b.ordem)
                    .map((subModule) => {
                      const config = statusConfig[subModule.status];
                      const hasRoute = subModuleRoutes[subModule.name];

                      return (
                        <div
                          key={subModule.id}
                          className={`p-3 rounded-lg border transition-all ${
                            subModule.status === "completed"
                              ? "bg-green-50 border-green-200"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`p-1 rounded ${config.color}`}>
                                {config.icon}
                              </span>
                              <span className="font-medium text-sm">{subModule.name}</span>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {subModule.description}
                          </p>

                          <div className="flex items-center gap-2">
                            <Select
                              value={subModule.status}
                              onValueChange={(value) =>
                                handleStatusChange(subModule, value as SubModule["status"])
                              }
                            >
                              <SelectTrigger className="h-8 text-xs flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="planning">
                                  <div className="flex items-center gap-2">
                                    {statusConfig.planning.icon}
                                    Planejamento
                                  </div>
                                </SelectItem>
                                <SelectItem value="in-progress">
                                  <div className="flex items-center gap-2">
                                    {statusConfig["in-progress"].icon}
                                    Em Progresso
                                  </div>
                                </SelectItem>
                                <SelectItem value="completed">
                                  <div className="flex items-center gap-2">
                                    {statusConfig.completed.icon}
                                    Concluido
                                  </div>
                                </SelectItem>
                                <SelectItem value="blocked">
                                  <div className="flex items-center gap-2">
                                    {statusConfig.blocked.icon}
                                    Bloqueado
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            {hasRoute && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2"
                                onClick={() => navigateToResource(subModule.name)}
                                title="Ir para o recurso"
                              >
                                <ArrowSquareOut size={14} />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {(!selectedModule.subModules || selectedModule.subModules.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum submodulo cadastrado</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Area de Trabalho</CardTitle>
              <CardDescription>Acesse e gerencie os recursos do modulo</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeResourceTab} onValueChange={setActiveResourceTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-4">
                  <TabsTrigger value="etapas" className="gap-1 text-xs">
                    <GraduationCap size={16} />
                    Etapas
                  </TabsTrigger>
                  <TabsTrigger value="series" className="gap-1 text-xs">
                    <ListNumbers size={16} />
                    Series
                  </TabsTrigger>
                  <TabsTrigger value="escolas" className="gap-1 text-xs">
                    <Buildings size={16} />
                    Escolas
                  </TabsTrigger>
                  <TabsTrigger value="turmas" className="gap-1 text-xs">
                    <Users size={16} />
                    Turmas
                  </TabsTrigger>
                  <TabsTrigger value="matriculas" className="gap-1 text-xs">
                    <BookOpen size={16} />
                    Matriculas
                  </TabsTrigger>
                </TabsList>
                <div className="border rounded-lg p-4 min-h-[450px] overflow-auto">
                  <TabsContent value="etapas" className="m-0">
                    <EtapasManager />
                  </TabsContent>
                  <TabsContent value="series" className="m-0">
                    <SeriesManager />
                  </TabsContent>
                  <TabsContent value="escolas" className="m-0">
                    <EscolasManager />
                  </TabsContent>
                  <TabsContent value="turmas" className="m-0">
                    <TurmasManager />
                  </TabsContent>
                  <TabsContent value="matriculas" className="m-0">
                    <MatriculasManager />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Ambiente de Desenvolvimento</h2>
        <p className="text-muted-foreground">
          Selecione um modulo para visualizar e gerenciar seus submodulos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const icon = moduleIcons[module.name] || <Wrench size={24} />;
          const config = statusConfig[module.status];
          const completedCount =
            module.subModules?.filter((s) => s.status === "completed").length || 0;
          const totalCount = module.subModules?.length || 0;

          return (
            <Card
              key={module.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
              onClick={() => setSelectedModule(module)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                    {icon}
                  </div>
                  <Badge variant={config.badgeVariant}>{config.label}</Badge>
                </div>
                <CardTitle className="text-lg mt-4 flex items-center justify-between">
                  {module.name}
                  <CaretRight
                    size={20}
                    className="text-muted-foreground group-hover:text-primary transition-colors"
                  />
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {module.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{module.progress}%</span>
                    </div>
                    <Progress value={module.progress} className="h-2" />
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Submodulos</span>
                    <span className="font-medium">
                      {completedCount}/{totalCount} concluidos
                    </span>
                  </div>

                  {module.subModules && module.subModules.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {module.subModules.slice(0, 5).map((sub) => (
                        <div
                          key={sub.id}
                          className={`w-2 h-2 rounded-full ${
                            sub.status === "completed"
                              ? "bg-green-500"
                              : sub.status === "in-progress"
                              ? "bg-blue-500"
                              : sub.status === "blocked"
                              ? "bg-red-500"
                              : "bg-slate-300"
                          }`}
                          title={`${sub.name}: ${statusConfig[sub.status].label}`}
                        />
                      ))}
                      {module.subModules.length > 5 && (
                        <span className="text-xs text-muted-foreground">
                          +{module.subModules.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <Button size="sm" variant="outline" className="w-full mt-4 gap-2">
                  <Wrench size={14} />
                  Desenvolver
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {modules.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum modulo cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Acesse a aba Modulos para criar os modulos do sistema.
            </p>
          </div>
        </Card>
      )}

      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-4">Sobre o Ambiente de Desenvolvimento</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Clique em um modulo</strong> para ver todos os seus submodulos e alterar o
            status de desenvolvimento.
          </p>
          <p>
            <strong>Altere o status</strong> de cada submodulo conforme o progresso: Planejamento,
            Em Progresso, Concluido.
          </p>
          <p>
            <strong>Navegue para o recurso</strong> clicando no icone de seta para acessar
            diretamente a funcionalidade.
          </p>
          <p>Use a aba Modulos para gerenciar a estrutura dos modulos e submodulos.</p>
        </div>
      </Card>
    </div>
  );
}
