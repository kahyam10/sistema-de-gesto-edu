"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, UserCircle, GraduationCap, Building2 } from "lucide-react";
import { useEscolas, useProfissionais } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuestionarioGestorPage() {
  const { data: escolas, isLoading: loadingEscolas } = useEscolas();
  const { data: profissionais, isLoading: loadingProfissionais } = useProfissionais();

  // Filtrar escolas que possuem diretor atribuído
  const escolasComDiretor = escolas?.filter((e) => e.diretorId) || [];

  // Buscar dados do diretor para cada escola
  const getDiretor = (diretorId: string) => {
    return profissionais?.find((p) => p.id === diretorId);
  };

  if (loadingEscolas || loadingProfissionais) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Questionário do Gestor Escolar</h1>
          <p className="text-muted-foreground mt-2">
            Censo Escolar 2025 - Dados do Gestor
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <UserCircle className="h-8 w-8 text-primary" />
          Questionário do Gestor Escolar
        </h1>
        <p className="text-muted-foreground mt-2">
          Censo Escolar 2025 - Selecione uma escola para preencher os dados do gestor
        </p>
      </div>

      {escolasComDiretor.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <UserCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma escola com gestor atribuído
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Para preencher o questionário do gestor escolar, primeiro atribua um
              diretor/gestor a uma escola na página de cadastro de escolas.
            </p>
            <Button asChild>
              <Link href="/cadastros/escolas">
                <Building2 className="h-4 w-4 mr-2" />
                Ir para Cadastro de Escolas
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {escolasComDiretor.map((escola) => {
            const diretor = getDiretor(escola.diretorId!);
            return (
              <Card key={escola.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    {escola.nome}
                  </CardTitle>
                  <CardDescription>Código: {escola.codigo}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Gestor Escolar:</p>
                    <p className="font-medium">{diretor?.nome || "Não encontrado"}</p>
                    {diretor?.email && (
                      <p className="text-sm text-muted-foreground">{diretor.email}</p>
                    )}
                  </div>
                  <Button asChild className="w-full">
                    <Link href={`/questionario-gestor/${escola.id}`}>
                      Preencher Questionário
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
