"use client";

import { useState, useMemo } from "react";
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
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useTurmas } from "@/hooks/useApi";
import { CalendarCheck, FileText, Users } from "@phosphor-icons/react";
import { pdf } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 15,
    borderBottom: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 2,
  },
  table: {
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 6,
  },
  tableHeader: {
    backgroundColor: '#f1f5f9',
    fontWeight: 'bold',
    paddingVertical: 8,
  },
  col1: { width: '40%', paddingRight: 5 },
  col2: { width: '15%', paddingRight: 5, textAlign: 'center' },
  col3: { width: '15%', paddingRight: 5, textAlign: 'center' },
  col4: { width: '15%', paddingRight: 5, textAlign: 'center' },
  col5: { width: '15%', paddingRight: 5, textAlign: 'center' },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 7,
    color: '#94a3b8',
    borderTop: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  summary: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    border: 1,
    borderColor: '#cbd5e1',
  },
  summaryText: {
    fontSize: 10,
    marginBottom: 4,
  },
  tableFooter: {
    backgroundColor: '#f8fafc',
    fontWeight: 'bold',
    paddingVertical: 8,
  },
});

interface FrequenciaAlunoMensal {
  matriculaId: string;
  nomeAluno: string;
  numeroMatricula: string;
  totalAulas: number;
  presencas: number;
  faltas: number;
  justificadas: number;
  percentualPresenca: number;
}

interface RelatorioFrequenciaPDFProps {
  turmaNome: string;
  mesAno: string;
  alunos: FrequenciaAlunoMensal[];
  totalAulas: number;
}

const MESES = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const RelatorioFrequenciaPDF: React.FC<RelatorioFrequenciaPDFProps> = ({
  turmaNome,
  mesAno,
  alunos,
  totalAulas,
}) => {
  const mediaPresenca = alunos.length > 0
    ? alunos.reduce((sum, a) => sum + a.percentualPresenca, 0) / alunos.length
    : 0;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>RELATÓRIO DE FREQUÊNCIA MENSAL</Text>
          <Text style={styles.subtitle}>Município de Ibirapitanga - Secretaria Municipal de Educação</Text>
          <Text style={styles.subtitle}>Turma: {turmaNome} | Período: {mesAno}</Text>
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryText}>Total de alunos: {alunos.length}</Text>
          <Text style={styles.summaryText}>Total de aulas no período: {totalAulas}</Text>
          <Text style={styles.summaryText}>
            Média de presença da turma: {mediaPresenca.toFixed(1)}%
          </Text>
          <Text style={styles.summaryText}>
            Data do relatório: {new Date().toLocaleDateString('pt-BR')}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.col1}>Aluno</Text>
            <Text style={styles.col2}>Total Aulas</Text>
            <Text style={styles.col3}>Presenças</Text>
            <Text style={styles.col4}>Faltas</Text>
            <Text style={styles.col5}>% Presença</Text>
          </View>

          {alunos.map((aluno, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>{aluno.nomeAluno}</Text>
              <Text style={styles.col2}>{aluno.totalAulas}</Text>
              <Text style={styles.col3}>{aluno.presencas}</Text>
              <Text style={styles.col4}>{aluno.faltas}</Text>
              <Text style={styles.col5}>{aluno.percentualPresenca.toFixed(1)}%</Text>
            </View>
          ))}

          <View style={[styles.tableRow, styles.tableFooter]}>
            <Text style={styles.col1}>MÉDIA DA TURMA</Text>
            <Text style={styles.col2}>{totalAulas}</Text>
            <Text style={styles.col3}>
              {(alunos.reduce((sum, a) => sum + a.presencas, 0) / alunos.length).toFixed(0)}
            </Text>
            <Text style={styles.col4}>
              {(alunos.reduce((sum, a) => sum + a.faltas, 0) / alunos.length).toFixed(0)}
            </Text>
            <Text style={styles.col5}>{mediaPresenca.toFixed(1)}%</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>
            Documento gerado em {new Date().toLocaleString('pt-BR')} - Sistema de Gestão Educacional de Ibirapitanga-BA
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export function RelatorioFrequenciaMensal() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const [turmaId, setTurmaId] = useState<string>("");
  const [mes, setMes] = useState<string>(mesAtual.toString());
  const [ano, setAno] = useState<number>(anoAtual);
  const [frequencias, setFrequencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: turmas = [], isLoading: loadingTurmas } = useTurmas({ anoLetivo: ano });

  const turmaSelecionada = turmas.find((t) => t.id === turmaId);

  const buscarFrequencias = async () => {
    if (!turmaId) {
      toast.error("Selecione uma turma");
      return;
    }

    setLoading(true);
    try {
      // Calcula primeiro e último dia do mês
      const primeiroDia = new Date(ano, parseInt(mes) - 1, 1);
      const ultimoDia = new Date(ano, parseInt(mes), 0);

      const dataInicio = primeiroDia.toISOString().split('T')[0];
      const dataFim = ultimoDia.toISOString().split('T')[0];

      const response = await fetch(
        `${API_BASE_URL}/frequencia?turmaId=${turmaId}&dataInicio=${dataInicio}&dataFim=${dataFim}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Erro ao buscar frequências");

      const data = await response.json();
      setFrequencias(data);
    } catch (error) {
      toast.error("Erro ao buscar frequências");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const dadosRelatorio = useMemo(() => {
    if (!turmaSelecionada || frequencias.length === 0) return [];

    const alunosMap = new Map<string, FrequenciaAlunoMensal>();

    // Inicializa todos os alunos da turma
    turmaSelecionada.matriculas?.forEach((matricula) => {
      alunosMap.set(matricula.id, {
        matriculaId: matricula.id,
        nomeAluno: matricula.nomeAluno,
        numeroMatricula: matricula.numeroMatricula,
        totalAulas: 0,
        presencas: 0,
        faltas: 0,
        justificadas: 0,
        percentualPresenca: 0,
      });
    });

    // Conta as frequências por aluno
    frequencias.forEach((freq) => {
      const aluno = alunosMap.get(freq.matriculaId);
      if (aluno) {
        aluno.totalAulas++;
        if (freq.status === "PRESENTE") {
          aluno.presencas++;
        } else if (freq.status === "FALTA") {
          aluno.faltas++;
        } else if (freq.status === "JUSTIFICADA") {
          aluno.justificadas++;
        }
      }
    });

    // Calcula percentuais
    alunosMap.forEach((aluno) => {
      aluno.percentualPresenca =
        aluno.totalAulas > 0 ? (aluno.presencas / aluno.totalAulas) * 100 : 0;
    });

    return Array.from(alunosMap.values()).sort((a, b) =>
      a.nomeAluno.localeCompare(b.nomeAluno)
    );
  }, [turmaSelecionada, frequencias]);

  // Conta total de dias únicos com registro de frequência
  const totalAulasNoPeriodo = useMemo(() => {
    const datasUnicas = new Set(
      frequencias.map((f) => new Date(f.data).toISOString().split('T')[0])
    );
    return datasUnicas.size;
  }, [frequencias]);

  const handleDownloadPDF = async () => {
    if (dadosRelatorio.length === 0) {
      toast.error("Nenhum dado para gerar relatório");
      return;
    }

    try {
      const mesNome = MESES.find((m) => m.value === mes)?.label || mes;
      const mesAno = `${mesNome}/${ano}`;

      const blob = await pdf(
        <RelatorioFrequenciaPDF
          turmaNome={turmaSelecionada?.nome || ""}
          mesAno={mesAno}
          alunos={dadosRelatorio}
          totalAulas={totalAulasNoPeriodo}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `frequencia-${turmaSelecionada?.nome.replace(/\s+/g, '-')}-${mes}-${ano}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Relatório de frequência gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar relatório');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck size={24} />
            Relatório de Frequência Mensal
          </CardTitle>
          <CardDescription>
            Gere relatórios mensais de frequência por turma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Turma</Label>
              <Select value={turmaId} onValueChange={setTurmaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas
                    .filter((t) => t.ativo)
                    .map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome} - {turma.turno}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mês</Label>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ano</Label>
              <Select value={ano.toString()} onValueChange={(v) => setAno(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[anoAtual, anoAtual - 1, anoAtual - 2].map((a) => (
                    <SelectItem key={a} value={a.toString()}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={buscarFrequencias}
                disabled={loading || !turmaId}
                className="w-full"
              >
                {loading ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {dadosRelatorio.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{turmaSelecionada?.nome}</CardTitle>
                <CardDescription>
                  {MESES.find((m) => m.value === mes)?.label}/{ano} - {dadosRelatorio.length} aluno(s)
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-blue-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total de Aulas</p>
                    <p className="text-3xl font-bold text-blue-600">{totalAulasNoPeriodo}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Média de Presença</p>
                    <p className="text-3xl font-bold text-green-600">
                      {dadosRelatorio.length > 0
                        ? (
                            dadosRelatorio.reduce((sum, a) => sum + a.percentualPresenca, 0) /
                            dadosRelatorio.length
                          ).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Alunos Abaixo de 75%</p>
                    <p className="text-3xl font-bold text-red-600">
                      {dadosRelatorio.filter((a) => a.percentualPresenca < 75).length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead className="text-center">Total Aulas</TableHead>
                    <TableHead className="text-center">Presenças</TableHead>
                    <TableHead className="text-center">Faltas</TableHead>
                    <TableHead className="text-center">Justificadas</TableHead>
                    <TableHead>Percentual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosRelatorio.map((aluno) => (
                    <TableRow key={aluno.matriculaId}>
                      <TableCell className="font-medium">{aluno.nomeAluno}</TableCell>
                      <TableCell className="text-center">{aluno.totalAulas}</TableCell>
                      <TableCell className="text-center text-green-600">
                        {aluno.presencas}
                      </TableCell>
                      <TableCell className="text-center text-red-600">
                        {aluno.faltas}
                      </TableCell>
                      <TableCell className="text-center text-yellow-600">
                        {aluno.justificadas}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={aluno.percentualPresenca}
                            className={`h-2 flex-1 ${
                              aluno.percentualPresenca < 75
                                ? "[&>div]:bg-red-500"
                                : aluno.percentualPresenca < 85
                                  ? "[&>div]:bg-yellow-500"
                                  : ""
                            }`}
                          />
                          <Badge
                            variant={aluno.percentualPresenca >= 75 ? "default" : "destructive"}
                            className="text-xs min-w-[3.5rem]"
                          >
                            {aluno.percentualPresenca.toFixed(1)}%
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">MÉDIA DA TURMA</TableCell>
                    <TableCell className="text-center font-bold">
                      {totalAulasNoPeriodo}
                    </TableCell>
                    <TableCell className="text-center font-bold text-green-600">
                      {(
                        dadosRelatorio.reduce((sum, a) => sum + a.presencas, 0) /
                        dadosRelatorio.length
                      ).toFixed(0)}
                    </TableCell>
                    <TableCell className="text-center font-bold text-red-600">
                      {(
                        dadosRelatorio.reduce((sum, a) => sum + a.faltas, 0) /
                        dadosRelatorio.length
                      ).toFixed(0)}
                    </TableCell>
                    <TableCell className="text-center font-bold text-yellow-600">
                      {(
                        dadosRelatorio.reduce((sum, a) => sum + a.justificadas, 0) /
                        dadosRelatorio.length
                      ).toFixed(0)}
                    </TableCell>
                    <TableCell className="font-bold">
                      {(
                        dadosRelatorio.reduce((sum, a) => sum + a.percentualPresenca, 0) /
                        dadosRelatorio.length
                      ).toFixed(1)}
                      %
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && dadosRelatorio.length === 0 && turmaId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users size={48} className="text-muted-foreground mb-4" weight="duotone" />
            <p className="text-muted-foreground">
              Nenhum registro de frequência encontrado para o período selecionado
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
