"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEscolas, useMatriculas } from "@/hooks/useApi";
import { Wheelchair, Users, Buildings, FileText } from "@phosphor-icons/react";
import { pdf } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { toast } from "sonner";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 3,
  },
  table: {
    marginTop: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: '#f1f5f9',
    fontWeight: 'bold',
    paddingVertical: 10,
  },
  col1: { width: '40%', paddingRight: 5 },
  col2: { width: '15%', paddingRight: 5 },
  col3: { width: '15%', paddingRight: 5 },
  col4: { width: '30%', paddingRight: 5 },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTop: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  summary: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    border: 1,
    borderColor: '#cbd5e1',
  },
  summaryText: {
    fontSize: 11,
    marginBottom: 5,
  },
});

interface RelatorioPCDPDFProps {
  escolaNome: string;
  alunos: Array<{
    nomeAluno: string;
    numeroMatricula: string;
    turma?: string;
    tipoDeficiencia?: string;
  }>;
  anoLetivo: number;
}

const RelatorioPCDPDF: React.FC<RelatorioPCDPDFProps> = ({ escolaNome, alunos, anoLetivo }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>RELATÓRIO DE ALUNOS PCD</Text>
        <Text style={styles.subtitle}>Município de Ibirapitanga - Secretaria Municipal de Educação</Text>
        <Text style={styles.subtitle}>Escola: {escolaNome}</Text>
        <Text style={styles.subtitle}>Ano Letivo: {anoLetivo}</Text>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>Total de alunos PCD: {alunos.length}</Text>
        <Text style={styles.summaryText}>Data do relatório: {new Date().toLocaleDateString('pt-BR')}</Text>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.col1}>Aluno</Text>
          <Text style={styles.col2}>Matrícula</Text>
          <Text style={styles.col3}>Turma</Text>
          <Text style={styles.col4}>Tipo de Deficiência</Text>
        </View>

        {alunos.map((aluno, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.col1}>{aluno.nomeAluno}</Text>
            <Text style={styles.col2}>{aluno.numeroMatricula}</Text>
            <Text style={styles.col3}>{aluno.turma || '-'}</Text>
            <Text style={styles.col4}>{aluno.tipoDeficiencia || 'Não especificado'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text>
          Documento gerado em {new Date().toLocaleString('pt-BR')} - Sistema de Gestão Educacional de Ibirapitanga-BA
        </Text>
      </View>
    </Page>
  </Document>
);

export function RelatorioPCD() {
  const anoAtual = new Date().getFullYear();
  const [escolaId, setEscolaId] = useState<string>("all");
  const [anoLetivo, setAnoLetivo] = useState<number>(anoAtual);

  const { data: escolas = [], isLoading: loadingEscolas } = useEscolas();
  const { data: matriculas = [], isLoading: loadingMatriculas } = useMatriculas({ anoLetivo });

  // Filtrar alunos PCD
  const alunosPCD = matriculas.filter((m) => {
    const isPCD = m.possuiDeficiencia;
    const matchEscola = escolaId === "all" || m.escolaId === escolaId;
    return isPCD && matchEscola;
  });

  // Agrupar por escola
  const alunosPorEscola = alunosPCD.reduce((acc, aluno) => {
    const escola = escolas.find((e) => e.id === aluno.escolaId);
    const escolaNome = escola?.nome || "Escola não identificada";
    if (!acc[escolaNome]) {
      acc[escolaNome] = [];
    }
    acc[escolaNome].push(aluno);
    return acc;
  }, {} as Record<string, typeof alunosPCD>);

  const handleDownloadPDF = async (escola: string, alunos: typeof alunosPCD) => {
    try {
      const blob = await pdf(
        <RelatorioPCDPDF
          escolaNome={escola}
          alunos={alunos.map((a) => ({
            nomeAluno: a.nomeAluno,
            numeroMatricula: a.numeroMatricula,
            turma: a.turma?.nome,
            tipoDeficiencia: a.tipoDeficiencia,
          }))}
          anoLetivo={anoLetivo}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-pcd-${escola.replace(/\s+/g, '-').toLowerCase()}-${anoLetivo}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Relatório PCD gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar relatório');
    }
  };

  if (loadingEscolas || loadingMatriculas) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wheelchair size={24} />
            Relatório de Alunos PCD
          </CardTitle>
          <CardDescription>
            Visualize e exporte relatórios de alunos com necessidades especiais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Escola</Label>
              <Select value={escolaId} onValueChange={setEscolaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma escola" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as escolas</SelectItem>
                  {escolas
                    .filter((e) => e.ativo)
                    .map((escola) => (
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
                value={anoLetivo.toString()}
                onValueChange={(v) => setAnoLetivo(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[anoAtual, anoAtual - 1, anoAtual - 2].map((ano) => (
                    <SelectItem key={ano} value={ano.toString()}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Alunos PCD</p>
                    <p className="text-3xl font-bold text-blue-600">{alunosPCD.length}</p>
                  </div>
                  <Wheelchair className="h-8 w-8 text-blue-600" weight="fill" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Escolas com PCD</p>
                    <p className="text-3xl font-bold text-green-600">
                      {Object.keys(alunosPorEscola).length}
                    </p>
                  </div>
                  <Buildings className="h-8 w-8 text-green-600" weight="fill" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Percentual PCD</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {matriculas.length > 0
                        ? ((alunosPCD.length / matriculas.length) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" weight="fill" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Tabela por Escola */}
      {Object.entries(alunosPorEscola).length > 0 ? (
        Object.entries(alunosPorEscola).map(([escolaNome, alunos]) => (
          <Card key={escolaNome}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{escolaNome}</CardTitle>
                  <CardDescription>{alunos.length} aluno(s) PCD</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPDF(escolaNome, alunos)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Turma</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tipo de Deficiência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alunos.map((aluno) => (
                      <TableRow key={aluno.id}>
                        <TableCell className="font-medium">{aluno.nomeAluno}</TableCell>
                        <TableCell>{aluno.numeroMatricula}</TableCell>
                        <TableCell>{aluno.turma?.nome || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={aluno.status === "ATIVA" ? "default" : "secondary"}
                          >
                            {aluno.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {aluno.tipoDeficiencia || "Não especificado"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Wheelchair size={48} className="text-muted-foreground mb-4" weight="duotone" />
            <p className="text-muted-foreground">
              Nenhum aluno PCD encontrado para os filtros selecionados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
