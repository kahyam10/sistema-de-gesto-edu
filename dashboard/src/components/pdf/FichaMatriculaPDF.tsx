import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { Matricula } from '@/lib/api';

// Estilos para o PDF
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
    borderBottom: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
    color: '#475569',
  },
  value: {
    width: '60%',
    color: '#1e293b',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  gridItem: {
    width: '48%',
  },
  badge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: 3,
    borderRadius: 3,
    fontSize: 9,
    marginTop: 2,
  },
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
  infoBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 4,
    border: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  alertBox: {
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 4,
    border: 1,
    borderColor: '#fbbf24',
    marginTop: 10,
  },
});

interface FichaMatriculaPDFProps {
  matricula: Matricula;
  escolaNome?: string;
  etapaNome?: string;
  serieName?: string;
  turmaNome?: string;
}

export const FichaMatriculaPDF: React.FC<FichaMatriculaPDFProps> = ({
  matricula,
  escolaNome,
  etapaNome,
  serieName,
  turmaNome,
}) => {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.title}>FICHA DE MATRÍCULA</Text>
          <Text style={styles.subtitle}>
            Município de Ibirapitanga - Secretaria Municipal de Educação
          </Text>
        </View>

        {/* Informações da Matrícula */}
        <View style={styles.infoBox}>
          <View style={styles.row}>
            <Text style={styles.label}>Número de Matrícula:</Text>
            <Text style={styles.value}>{matricula.numeroMatricula}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Ano Letivo:</Text>
            <Text style={styles.value}>{matricula.anoLetivo}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{matricula.status}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Data de Matrícula:</Text>
            <Text style={styles.value}>{formatDate(matricula.createdAt)}</Text>
          </View>
        </View>

        {/* Dados do Aluno */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DADOS DO ALUNO</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nome Completo:</Text>
            <Text style={styles.value}>{matricula.nomeAluno}</Text>
          </View>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <View style={styles.row}>
                <Text style={styles.label}>Data de Nascimento:</Text>
                <Text style={styles.value}>{formatDate(matricula.dataNascimento)}</Text>
              </View>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.row}>
                <Text style={styles.label}>Sexo:</Text>
                <Text style={styles.value}>{matricula.sexo === 'M' ? 'Masculino' : 'Feminino'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>CPF:</Text>
            <Text style={styles.value}>{(matricula as any).cpf || 'Não informado'}</Text>
          </View>
          {matricula.endereco && (
            <View style={styles.row}>
              <Text style={styles.label}>Endereço:</Text>
              <Text style={styles.value}>{matricula.endereco}</Text>
            </View>
          )}
          {matricula.possuiDeficiencia && (
            <View style={styles.alertBox}>
              <Text style={{ fontWeight: 'bold', marginBottom: 3 }}>PCD - Necessidades Especiais</Text>
              <Text>{matricula.tipoDeficiencia || 'Tipo não especificado'}</Text>
            </View>
          )}
        </View>

        {/* Dados Escolares */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DADOS ESCOLARES</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Escola:</Text>
            <Text style={styles.value}>{escolaNome || 'Não informada'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Etapa de Ensino:</Text>
            <Text style={styles.value}>{etapaNome || 'Não informada'}</Text>
          </View>
          {serieName && (
            <View style={styles.row}>
              <Text style={styles.label}>Série:</Text>
              <Text style={styles.value}>{serieName}</Text>
            </View>
          )}
          {turmaNome && (
            <View style={styles.row}>
              <Text style={styles.label}>Turma:</Text>
              <Text style={styles.value}>{turmaNome}</Text>
            </View>
          )}
        </View>

        {/* Dados do Responsável */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DADOS DO RESPONSÁVEL</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nome:</Text>
            <Text style={styles.value}>{matricula.nomeResponsavel}</Text>
          </View>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <View style={styles.row}>
                <Text style={styles.label}>CPF:</Text>
                <Text style={styles.value}>{matricula.cpfResponsavel || 'Não informado'}</Text>
              </View>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.row}>
                <Text style={styles.label}>Telefone:</Text>
                <Text style={styles.value}>{matricula.telefoneResponsavel || 'Não informado'}</Text>
              </View>
            </View>
          </View>
          {matricula.emailResponsavel && (
            <View style={styles.row}>
              <Text style={styles.label}>E-mail:</Text>
              <Text style={styles.value}>{matricula.emailResponsavel}</Text>
            </View>
          )}
        </View>

        {/* Dados de Saúde */}
        {(matricula.tipoSanguineo || matricula.alergias || matricula.medicamentos || matricula.condicoesSaude) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DADOS DE SAÚDE</Text>
            {matricula.tipoSanguineo && (
              <View style={styles.row}>
                <Text style={styles.label}>Tipo Sanguíneo:</Text>
                <Text style={styles.value}>{matricula.tipoSanguineo}</Text>
              </View>
            )}
            {matricula.planoSaude && (
              <View style={styles.row}>
                <Text style={styles.label}>Plano de Saúde:</Text>
                <Text style={styles.value}>{matricula.planoSaude}</Text>
              </View>
            )}
            {matricula.numeroCartaoSUS && (
              <View style={styles.row}>
                <Text style={styles.label}>Cartão SUS:</Text>
                <Text style={styles.value}>{matricula.numeroCartaoSUS}</Text>
              </View>
            )}
            {matricula.alergias && (
              <View style={styles.row}>
                <Text style={styles.label}>Alergias:</Text>
                <Text style={styles.value}>{matricula.alergias}</Text>
              </View>
            )}
            {matricula.medicamentos && (
              <View style={styles.row}>
                <Text style={styles.label}>Medicamentos:</Text>
                <Text style={styles.value}>{matricula.medicamentos}</Text>
              </View>
            )}
            {matricula.condicoesSaude && (
              <View style={styles.row}>
                <Text style={styles.label}>Condições de Saúde:</Text>
                <Text style={styles.value}>{matricula.condicoesSaude}</Text>
              </View>
            )}
          </View>
        )}

        {/* Contato de Emergência */}
        {matricula.contatoEmergenciaNome && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CONTATO DE EMERGÊNCIA</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Nome:</Text>
              <Text style={styles.value}>{matricula.contatoEmergenciaNome}</Text>
            </View>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <View style={styles.row}>
                  <Text style={styles.label}>Telefone:</Text>
                  <Text style={styles.value}>{matricula.contatoEmergenciaTelefone || 'Não informado'}</Text>
                </View>
              </View>
              <View style={styles.gridItem}>
                <View style={styles.row}>
                  <Text style={styles.label}>Parentesco:</Text>
                  <Text style={styles.value}>{matricula.contatoEmergenciaParentesco || 'Não informado'}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text>
            Documento gerado em {new Date().toLocaleString('pt-BR')} - Sistema de Gestão Educacional de Ibirapitanga-BA
          </Text>
        </View>
      </Page>
    </Document>
  );
};
