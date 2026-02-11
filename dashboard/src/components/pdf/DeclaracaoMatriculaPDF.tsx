import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Matricula } from '@/lib/api';

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.6,
  },
  header: {
    textAlign: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    textDecoration: 'underline',
    marginTop: 20,
  },
  body: {
    marginTop: 30,
    textAlign: 'justify',
    lineHeight: 1.8,
  },
  paragraph: {
    marginBottom: 15,
  },
  highlight: {
    fontWeight: 'bold',
  },
  signature: {
    marginTop: 60,
    textAlign: 'center',
  },
  signatureLine: {
    borderTop: 1,
    borderTopColor: '#000',
    width: 300,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 60,
    paddingTop: 5,
  },
  signatureText: {
    fontSize: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 9,
    color: '#64748b',
  },
  infoBox: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 4,
    border: 1,
    borderColor: '#cbd5e1',
    marginVertical: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontWeight: 'bold',
    marginRight: 10,
  },
});

interface DeclaracaoMatriculaPDFProps {
  matricula: Matricula;
  escolaNome?: string;
  etapaNome?: string;
  serieName?: string;
  turmaNome?: string;
  turnoNome?: string;
}

export const DeclaracaoMatriculaPDF: React.FC<DeclaracaoMatriculaPDFProps> = ({
  matricula,
  escolaNome,
  etapaNome,
  serieName,
  turmaNome,
  turnoNome,
}) => {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const hoje = new Date();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.logo}>PREFEITURA MUNICIPAL DE IBIRAPITANGA</Text>
          <Text style={styles.subtitle}>SECRETARIA MUNICIPAL DE EDUCAÇÃO</Text>
          <Text style={styles.subtitle}>Estado da Bahia</Text>
          <Text style={styles.title}>DECLARAÇÃO DE MATRÍCULA</Text>
        </View>

        {/* Informações da Matrícula */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Matrícula Nº:</Text>
            <Text>{matricula.numeroMatricula}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ano Letivo:</Text>
            <Text>{matricula.anoLetivo}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text>{matricula.status === 'ATIVA' ? 'ATIVA' : matricula.status}</Text>
          </View>
        </View>

        {/* Corpo da Declaração */}
        <View style={styles.body}>
          <Text style={styles.paragraph}>
            A Secretaria Municipal de Educação de Ibirapitanga, Estado da Bahia, declara para os devidos fins que{' '}
            <Text style={styles.highlight}>{matricula.nomeAluno}</Text>, nascido(a) em{' '}
            <Text style={styles.highlight}>{formatDate(matricula.dataNascimento)}</Text>
            {(matricula as any).cpf && (
              <>
                , portador(a) do CPF nº <Text style={styles.highlight}>{(matricula as any).cpf}</Text>
              </>
            )}
            , está devidamente matriculado(a) nesta rede municipal de ensino.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.highlight}>Dados Escolares:</Text>
          </Text>

          <View style={{ marginLeft: 20 }}>
            {escolaNome && (
              <Text style={styles.paragraph}>• Escola: {escolaNome}</Text>
            )}
            {etapaNome && (
              <Text style={styles.paragraph}>• Etapa de Ensino: {etapaNome}</Text>
            )}
            {serieName && (
              <Text style={styles.paragraph}>• Série: {serieName}</Text>
            )}
            {turmaNome && (
              <Text style={styles.paragraph}>• Turma: {turmaNome}</Text>
            )}
            {turnoNome && (
              <Text style={styles.paragraph}>• Turno: {turnoNome}</Text>
            )}
          </View>

          <Text style={styles.paragraph}>
            O(a) aluno(a) encontra-se regularmente matriculado(a) no ano letivo de{' '}
            <Text style={styles.highlight}>{matricula.anoLetivo}</Text>, com matrícula sob o número{' '}
            <Text style={styles.highlight}>{matricula.numeroMatricula}</Text>.
          </Text>

          {matricula.possuiDeficiencia && (
            <Text style={styles.paragraph}>
              <Text style={styles.highlight}>Observação:</Text> O(a) aluno(a) possui necessidades educacionais especiais
              {matricula.tipoDeficiencia && `: ${matricula.tipoDeficiencia}`}.
            </Text>
          )}

          <Text style={styles.paragraph}>
            Por ser verdade, firmamos a presente declaração.
          </Text>
        </View>

        {/* Assinatura */}
        <View style={styles.signature}>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureText}>Secretaria Municipal de Educação</Text>
            <Text style={styles.signatureText}>Ibirapitanga - BA</Text>
          </View>
        </View>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text>
            Ibirapitanga-BA, {formatDate(hoje)}
          </Text>
          <Text style={{ marginTop: 5 }}>
            Documento gerado eletronicamente pelo Sistema de Gestão Educacional
          </Text>
        </View>
      </Page>
    </Document>
  );
};
