import { pdf } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { toast } from "sonner";
import { Printer } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { GradeHorario } from "@/lib/api";

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
    textAlign: 'center',
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
  diaSection: {
    marginTop: 12,
    marginBottom: 8,
  },
  diaTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
    backgroundColor: '#f1f5f9',
    padding: 6,
    marginBottom: 4,
  },
  table: {
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 5,
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    fontWeight: 'bold',
    paddingVertical: 6,
  },
  col1: { width: '20%', paddingRight: 5 },
  col2: { width: '40%', paddingRight: 5 },
  col3: { width: '40%', paddingRight: 5 },
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
  emptyState: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 9,
    paddingVertical: 8,
    fontStyle: 'italic',
  },
});

interface GradeHorariaPDFProps {
  turmaNome: string;
  turno: string;
  escolaNome: string;
  gradeByDia: Record<string, GradeHorario[]>;
  diasSemana: readonly { value: string; label: string }[];
  getProfissionalNome: (id?: string | null) => string;
}

const DIAS_SEMANA = [
  { value: "SEGUNDA", label: "Segunda-feira" },
  { value: "TERCA", label: "Terça-feira" },
  { value: "QUARTA", label: "Quarta-feira" },
  { value: "QUINTA", label: "Quinta-feira" },
  { value: "SEXTA", label: "Sexta-feira" },
  { value: "SABADO", label: "Sábado" },
] as const;

const GradeHorariaPDF: React.FC<GradeHorariaPDFProps> = ({
  turmaNome,
  turno,
  escolaNome,
  gradeByDia,
  getProfissionalNome,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>GRADE HORÁRIA</Text>
          <Text style={styles.subtitle}>Município de Ibirapitanga - Secretaria Municipal de Educação</Text>
          <Text style={styles.subtitle}>{escolaNome}</Text>
          <Text style={styles.subtitle}>
            Turma: {turmaNome} | Turno: {turno}
          </Text>
        </View>

        {DIAS_SEMANA.map((dia) => {
          const aulas = gradeByDia[dia.value] || [];

          return (
            <View key={dia.value} style={styles.diaSection}>
              <Text style={styles.diaTitle}>{dia.label}</Text>
              {aulas.length === 0 ? (
                <Text style={styles.emptyState}>Nenhuma aula cadastrada</Text>
              ) : (
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={styles.col1}>Horário</Text>
                    <Text style={styles.col2}>Disciplina</Text>
                    <Text style={styles.col3}>Professor</Text>
                  </View>
                  {aulas.map((aula, index) => (
                    <View key={index} style={styles.tableRow}>
                      <Text style={styles.col1}>
                        {aula.horaInicio} - {aula.horaFim}
                      </Text>
                      <Text style={styles.col2}>{aula.disciplina}</Text>
                      <Text style={styles.col3}>{getProfissionalNome(aula.profissionalId)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.footer}>
          <Text>
            Documento gerado em {new Date().toLocaleString('pt-BR')} - Sistema de Gestão Educacional de Ibirapitanga-BA
          </Text>
        </View>
      </Page>
    </Document>
  );
};

interface ImpressaoGradeHorariaProps {
  turmaNome: string;
  turno: string;
  escolaNome: string;
  gradeHoraria: GradeHorario[];
  gradeByDia: Record<string, GradeHorario[]>;
  getProfissionalNome: (id?: string | null) => string;
  disabled?: boolean;
}

export function ImpressaoGradeHoraria({
  turmaNome,
  turno,
  escolaNome,
  gradeHoraria,
  gradeByDia,
  getProfissionalNome,
  disabled = false,
}: ImpressaoGradeHorariaProps) {
  const handlePrint = async () => {
    if (gradeHoraria.length === 0) {
      toast.error("Nenhuma grade horária para imprimir");
      return;
    }

    try {
      const blob = await pdf(
        <GradeHorariaPDF
          turmaNome={turmaNome}
          turno={turno}
          escolaNome={escolaNome}
          gradeByDia={gradeByDia}
          diasSemana={DIAS_SEMANA}
          getProfissionalNome={getProfissionalNome}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `grade-horaria-${turmaNome.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Grade horária gerada com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar grade horária');
      console.error(error);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      disabled={disabled || gradeHoraria.length === 0}
    >
      <Printer className="h-4 w-4 mr-2" />
      Imprimir Grade
    </Button>
  );
}
