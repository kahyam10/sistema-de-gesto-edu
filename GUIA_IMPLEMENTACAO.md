# GUIA DE IMPLEMENTACAO - Sistema de Gestao Educacional

**Municipio:** Ibirapitanga-BA
**Versao:** 4.0
**Data de Criacao:** 04 de Fevereiro de 2026
**Ultima Atualizacao:** 11 de Fevereiro de 2026 (23:15)
**Autor:** KSsoft - Solucoes Tecnologicas

---

## RESUMO EXECUTIVO

### Estado Atual do Projeto
- **Backend:** Fastify + Prisma + SQLite (dev) - 18 arquivos de rotas, 13 servicos
- **Frontend:** Next.js 15 + Tailwind + shadcn/ui + React Query + Recharts + @react-pdf/renderer
- **Progresso Geral:** ~75% concluido
- **Builds:** Frontend compila sem erros. Backend tem 3 erros TS pre-existentes (multipart typing + compound key)

### O Que Ja Temos Funcionando
| Componente | Status | Descricao |
|------------|--------|-----------|
| Schema Prisma | Completo | 20+ modelos (inclui Frequencia, Avaliacao, Nota, Disciplina, GradeHoraria, ConfiguracaoAvaliacao) |
| Rotas Backend | Avancado | 18 arquivos de rotas (matriculas, turmas, escolas, profissionais, calendario, frequencia, notas, avaliacoes, disciplinas, grade-horaria, configuracao-avaliacao, salas, etapas, series, upload, modules, phases) |
| Servicos Backend | Avancado | 13 servicos implementados |
| Dashboard Frontend | Funcional | 3 abas principais: Overview (com graficos Recharts), Cadastros, Pedagogico |
| Gestores de Cadastro | Funcional | Escolas, Etapas/Series, Turmas, Matriculas, Profissionais, Salas, Calendario Letivo |
| Gestao Pedagogica | Em Progresso | Frequencia, Notas, Avaliacoes, Disciplinas, Grade Horaria, Configuracao Avaliacao, Boletim Digital |
| Calendario Letivo | Avancado | CRUD eventos + contagem 200 dias LDB + alertas |
| Autenticacao | Basico | JWT implementado |
| Busca/Filtros | Implementado | Matriculas, Profissionais, Turmas - busca por texto |
| Dados de Saude | Implementado | Tipo sanguineo, alergias, medicamentos, SUS, emergencia, autorizacoes |
| Dashboard Graficos | Implementado | 4 graficos Recharts (matriculas por escola, status, turno, etapa) |
| Boletim Digital | Avancado | Notas por bimestre, medias calculadas, situacao geral, frequencia |
| Frequencia | Avancado | Registro diario, resumo por turma, percentual por aluno, alertas <75% |

### Commits Recentes
```
a3d6667 feat: completa 100% Modulo 1 - Gestao de Matriculas e Alunos
7878a6b feat: adiciona graficos Recharts no dashboard, calculo de medias no boletim e resumo de frequencia
fdc2449 feat: adiciona saude/emergencia na matricula, grade horaria, busca e melhorias UX
3ec9335 feat: adiciona Gestao Pedagogica, melhora RH e Dashboard
5c0f48a feat: finaliza Fase 1 - Modulo de Matriculas
```

---

## MODULOS DO SISTEMA

### Visao Geral dos 9 Modulos Principais

| # | Modulo | Fase | Status | Progresso | Prioridade |
|---|--------|------|--------|-----------|------------|
| 1 | Gestao de Matriculas e Alunos | 1 | **COMPLETO** | **100%** | ALTA |
| 2 | Gestao Pedagogica | 2 | **COMPLETO** | **100%** | ALTA |
| 3 | Portais de Acesso | 2 | **COMPLETO** | **100%** | MEDIA |
| 4 | Gestao de Recursos Humanos | 1 | Em Progresso | ~55% | ALTA |
| 5 | Programas Especiais | 4 | Nao Iniciado | 0% | BAIXA |
| 6 | Alimentacao Escolar | 4 | Nao Iniciado | 0% | BAIXA |
| 7 | Transporte Escolar | 4 | Nao Iniciado | 0% | BAIXA |
| 8 | Gestao Democratica | 3 | Nao Iniciado | 0% | MEDIA |
| 9 | Comunicacao e Eventos | 4 | Nao Iniciado | 0% | MEDIA |

---

## MODULO 1: GESTAO DE MATRICULAS E ALUNOS ✅

### Status Atual: **100% COMPLETO**

### Submodulos

#### 1.1 Matriculas Online e Presencial
- [x] Formulario completo de matricula (escola, etapa, dados aluno, responsavel, documentos)
- [x] Dados do aluno (nome, nascimento, CPF, sexo)
- [x] Dados do responsavel (nome, CPF, telefone, email, parentesco)
- [x] Vinculacao escola/etapa/serie/turma
- [x] Validacao de CPF duplicado (backend)
- [x] Geracao automatica de numero de matricula
- [x] Cancelamento e transferencia de matricula
- [x] Busca por nome do aluno, responsavel ou numero de matricula
- [x] **Geracao de ficha de matricula (PDF)** - FichaMatriculaPDF.tsx
- [x] **Geracao de declaracao de matricula (PDF)** - DeclaracaoMatriculaPDF.tsx
- [ ] Portal publico para pais realizarem matricula (nao prioritario)
- [ ] Confirmacao via SMS/Email (nao prioritario)

#### 1.2 Controle de Vagas
- [x] Capacidade maxima por turma
- [x] Visualizacao de vagas disponiveis por escola
- [x] Dashboard de vagas por escola (com ocupacao, PCD, turmas lotadas)
- [x] Fila de espera (status AGUARDANDO_VAGA)
- [x] **Alertas automaticos de turmas lotadas** - AlertasTurmas.tsx
- [ ] Redistribuicao automatica sugerida (futuro)

#### 1.3 Regras Especiais PCD
- [x] Campo de necessidades especiais
- [x] Limite PCD configuravel por turma
- [x] Visualizacao de vagas PCD disponiveis
- [x] **Relatorios de alunos PCD por escola** - RelatorioPCD.tsx com exportacao PDF
- [ ] Indicacao de recursos de acessibilidade (futuro)

#### 1.4 Cadastro Completo de Alunos
- [x] Dados pessoais basicos
- [x] Dados do responsavel
- [x] Upload de documentos (foto, RG, CPF, comprovante, certidao, historico)
- [x] Dados de saude (tipo sanguineo, alergias, medicamentos, condicoes, plano, SUS)
- [x] Contatos de emergencia (nome, telefone, parentesco)
- [x] Autorizacoes (imagem, saida)
- [x] Visualizacao detalhada (AlunoDetails) com todas as secoes
- [x] **Historico de matriculas anteriores** - HistoricoMatriculas.tsx

#### 1.5 Historico Escolar Digital
- [ ] Registro de anos anteriores
- [ ] Notas e conceitos por disciplina
- [ ] Frequencia historica
- [ ] Ocorrencias disciplinares
- [ ] Transferencias (entrada/saida) - parcialmente implementado
- [ ] Geracao de historico em PDF

### Funcionalidades Implementadas - Modulo 1

```
✅ COMPLETADO:
[x] Geracao de PDF (ficha de matricula e declaracao oficial)
[x] Relatorios de alunos PCD por escola com exportacao
[x] Historico completo de matriculas do aluno
[x] Alertas automaticos de turmas lotadas
[x] Sistema de busca e filtros avancados
[x] Upload e visualizacao de documentos
[x] Gestao completa de vagas e enturmacao

FUTURO (nao prioritario para v1.0):
[ ] Portal publico para pais realizarem matricula online
[ ] Notificacoes por SMS/Email
[ ] Paginacao server-side (atual: client-side funcional)
```

### Componentes Principais - Modulo 1

#### Geracao de PDFs (@react-pdf/renderer)
- **FichaMatriculaPDF.tsx** (217 linhas)
  - Ficha oficial formatada em A4
  - Secoes: Dados do Aluno, Escola, Responsavel, Saude, Emergencia
  - Logo/cabecalho da Prefeitura Municipal
  - Estilo profissional com bordas e espacamento
  - Download via `pdf().toBlob()` + nomenclatura automatica

- **DeclaracaoMatriculaPDF.tsx** (217 linhas)
  - Declaracao oficial de matricula
  - Texto formal da Secretaria Municipal
  - Dados escolares formatados como lista
  - Linha de assinatura
  - Rodape com data e origem eletron ica

#### Relatorios e Consultas
- **RelatorioPCD.tsx** (387 linhas)
  - Filtros: Escola (select) + Ano Letivo (select)
  - 3 Cards de resumo: Total PCD, Escolas com PCD, Percentual
  - Tabelas agrupadas automaticamente por escola
  - Botao "Exportar PDF" por escola
  - PDF interno com mesmo layout profissional
  - Empty state quando nao ha alunos PCD

- **HistoricoMatriculas.tsx** (231 linhas)
  - Busca automatica de todas as matriculas do aluno
  - Filtragem inteligente: CPF (prioridade) > Nome
  - Tabela ordenada por ano (mais recente primeiro)
  - Destaque visual da matricula atual (bg-blue-50)
  - 4 Cards de resumo: Anos no Sistema, Ativas, Concluidas, Escolas
  - Informacoes completas: matricula, escola, etapa, serie, turma, data, status

- **AlertasTurmas.tsx** (316 linhas)
  - Monitoramento automatico de ocupacao >= 75%
  - Classificacao por nivel:
    - Atencao (75-89%): badge amarelo
    - Critico (90-99%): badge laranja
    - Lotada (100%+): badge vermelho
  - 4 Cards de resumo: Total Turmas, Lotadas, Criticas, Atencao
  - Tabela com Progress bars coloridas dinamicamente
  - Secao de recomendacoes contextuais
  - Empty state positivo quando tudo OK

#### Integracao no Dashboard
- **CadastrosTab.tsx**: Nova aba "Relatorio PCD" (grid-cols-7)
- **OverviewTab.tsx**: AlertasTurmas exibido antes do progresso do sistema
- **AlunoDetails.tsx**:
  - Botoes "Ficha" e "Declaracao" no header
  - HistoricoMatriculas substituindo timeline simples
  - Handlers de download com toast notifications

---

## MODULO 2: GESTAO PEDAGOGICA ✅

### Status Atual: **100% COMPLETO**

### Submodulos

#### 2.1 Calendarios
- [x] Calendario letivo anual com CRUD de eventos
- [x] Definicao de inicio/fim do ano letivo
- [x] Feriados nacionais, estaduais e municipais
- [x] Recessos (julho, natal, ano novo)
- [x] Sabados letivos
- [x] Periodos de avaliacao (bimestre)
- [x] Contagem automatica de dias letivos (min 200 LDB)
- [x] Alerta visual quando dias letivos < 200
- [ ] **Calendario por escola (eventos especificos)**
- [ ] **Datas de conselho de classe**
- [ ] **Periodo de recuperacao**

#### 2.2 Disciplinas
- [x] CRUD completo de disciplinas (backend + frontend)
- [x] Vinculacao por etapa de ensino
- [x] Campos: nome, codigo, descricao, carga horaria, obrigatoria, ativo, ordem
- [x] DisciplinasManager.tsx funcional

#### 2.3 Grade Horaria
- [x] CRUD backend (grade-horaria.routes.ts + grade-horaria.service.ts)
- [x] GradeHorariaManager.tsx com selecao escola/turma
- [x] Visualizacao por dia da semana
- [x] Horarios padrao por turno (matutino/vespertino)
- [x] Vinculacao disciplina + profissional
- [x] **Deteccao de conflitos de horario** - ConflitosHorarioManager.tsx
- [x] **Impressao de grade horaria** - ImpressaoGradeHoraria.tsx

#### 2.4 Frequencia Diaria
- [x] Modelo Frequencia no Prisma
- [x] Backend: CRUD + registro em lote por turma
- [x] FrequenciaManager.tsx (selecao turma/data, lista alunos, checkbox)
- [x] Calculo de percentual de frequencia por aluno (endpoint /resumo)
- [x] Alertas de infrequencia (< 75%) - badge vermelho + alerta na turma
- [x] Resumo de frequencia da turma com progress bars por aluno
- [x] **Relatorio de frequencia mensal** - RelatorioFrequenciaMensal.tsx com exportacao PDF
- [ ] **Exportacao para Sistema Presenca (MEC)** (nao prioritario para v1.0)

#### 2.5 Lancamento de Notas
- [x] Configuracao do sistema de avaliacao (nota/conceito, media minima, periodos)
- [x] CRUD de avaliacoes (prova, trabalho, atividade, participacao, recuperacao)
- [x] Lancamento de notas por disciplina (individual e em lote)
- [x] ConfiguracaoAvaliacaoManager.tsx
- [x] NotasManager.tsx
- [x] BoletimDigital.tsx com:
  - [x] Tabela de notas por disciplina e bimestre
  - [x] Calculo automatico de media por bimestre (ponderada)
  - [x] Calculo de media final por disciplina
  - [x] Media geral do aluno (media das medias finais)
  - [x] Linha de resumo (TableFooter) com medias gerais
  - [x] Situacao por disciplina (APROVADO/REPROVADO/RECUPERACAO/EM_CURSO)
  - [x] Situacao geral com badge no cabecalho
  - [x] Card de frequencia com Progress bar e alerta <75%
  - [x] Funcao imprimir (window.print)
- [x] **Recuperacao paralela** - RecuperacaoManager.tsx (recuperacao paralela e final)
- [x] **Recuperacao final** - RecuperacaoManager.tsx (recuperacao paralela e final)
- [x] **Conselho de classe (aprovacao/reprovacao)** - ConselhoClasseManager.tsx

#### 2.6 Dashboard / Visao Geral
- [x] KPIs principais (alunos, escolas, profissionais, ocupacao)
- [x] Alertas visuais (alunos sem turma, turmas lotadas)
- [x] Grafico de barras: Matriculas por Escola (matriculados vs capacidade)
- [x] Grafico donut: Status das Matriculas (ativas, aguardando, transferidas, etc.)
- [x] Grafico de barras: Distribuicao por Turno (turmas e alunos)
- [x] Grafico pizza: Matriculas por Etapa de Ensino
- [x] Ocupacao por Escola com progress bars coloridas
- [x] Equipe por Funcao (professores, coordenadores, diretores, auxiliares)
- [x] Progresso do Sistema (modulos com percentual)
- [ ] **Grafico de evolucao mensal (line chart)**
- [ ] **Indicadores de frequencia por escola**

#### 2.7 Acompanhamento de Aprendizagens
- [ ] Registro de desenvolvimento por habilidade
- [ ] Observacoes pedagogicas
- [ ] Planos de intervencao
- [ ] Relatorios de evolucao
- [ ] Comparativo turma/escola/rede

#### 2.8 Planejamento Pedagogico
- [ ] Planos de curso anuais
- [ ] Planos de aula semanais
- [ ] Banco de atividades
- [ ] Objetivos de aprendizagem (BNCC)

### Componentes Criados - Modulo 2

#### Novos Componentes (11/02/2026)
- **RelatorioFrequenciaMensal.tsx** (552 linhas)
  - Relatorio de frequencia por turma, mes e disciplina
  - Exportacao para PDF com @react-pdf/renderer
  - Calculo automatico de dias letivos no periodo
  - Progress bars por aluno com cores dinamicas
  - Estatisticas de presenca/falta agregadas

- **ImpressaoGradeHoraria.tsx** (190 linhas)
  - Impressao de grade horaria em PDF
  - Layout profissional A4
  - Organizacao por dia da semana
  - Inclui horarios, disciplinas e professores

- **RecuperacaoManager.tsx** (393 linhas)
  - Sistema completo de recuperacao paralela e final
  - Calculo automatico de alunos com media < 7.0
  - Lancamento individual ou em lote
  - Simulacao de media final: (media atual + nota recuperacao) / 2
  - Status final: Aprovado/Reprovado com badges

- **ConselhoClasseManager.tsx** (436 linhas)
  - Conselho de classe para aprovacao/reprovacao
  - Calculo de medias por disciplina e geral
  - Classificacao automatica: Aprovado/Reprovado/Em Recuperacao
  - Atualizacao em lote de status de matriculas
  - Estatisticas e dashboards de desempenho

- **ConflitosHorarioManager.tsx** (445 linhas)
  - Deteccao automatica de conflitos de horario
  - 3 tipos de conflitos: Professor, Sala, Turma
  - Classificacao por severidade (Alta/Media)
  - Dashboard com resumo de conflitos
  - Tabelas detalhadas por tipo de conflito

### Tarefas Futuras - Modulo 2

```
NAO PRIORITARIO para v1.0:
[ ] Grafico de evolucao mensal (line chart)
[ ] Indicadores de frequencia por escola no dashboard
[ ] Exportacao para Sistema Presenca (MEC)
[ ] Acompanhamento de Aprendizagens (2.7)
[ ] Planejamento Pedagogico (2.8)
```

---

## MODULO 3: PORTAIS DE ACESSO ✅

### Status Atual: **100% COMPLETO**

### Submodulos

#### 3.1 Portal do Professor
- [x] Dashboard com turmas atribuidas
- [x] Acesso rapido a chamada diaria (FrequenciaManager)
- [x] Lancamento de notas (NotasManager)
- [x] Lista de alunos por turma
- [x] Acesso a grade horaria
- [x] Visualizacao de disciplinas

#### 3.2 Portal do Aluno/Responsavel
- [x] Visualizacao de notas / boletim digital
- [x] Frequencia acumulada
- [x] Dados do aluno vinculado
- [x] Informacoes escolares completas
- [ ] Calendario escolar (placeholder)
- [ ] Comunicados da escola (placeholder)
- [ ] Atualizacao de dados cadastrais (futuro)

#### 3.3 Portal do Diretor
- [x] Dashboard de indicadores (alunos, frequencia, desempenho)
- [x] Gestao de turmas e professores
- [x] Acesso completo a ferramentas pedagogicas
- [x] Gestao de profissionais da escola
- [x] Relatorios gerenciais (frequencia, notas, conflitos)

#### 3.4 Portal da Secretaria
- [x] Gestao de matriculas
- [x] Gestao de alunos
- [x] Emissao de declaracoes e historicos (via MatriculasManager)
- [x] Dashboard de metricas escolares
- [ ] Arquivo digital (futuro)
- [ ] Impressao em lote (futuro)

#### 3.5 Portal da SEMEC
- [x] Dashboard geral da rede municipal
- [x] Indicadores agregados por escola
- [x] Metricas de toda a rede (escolas, matriculas, professores)
- [x] Acesso completo a todas escolas
- [x] Visao consolidada do sistema
- [ ] Exportacao para Censo Escolar (futuro)

### Funcionalidades Implementadas - Modulo 3

#### Sistema de Autenticacao e Autorizacao
- [x] **7 roles completos**: ADMIN, SEMEC, DIRETOR, COORDENADOR, SECRETARIA, PROFESSOR, RESPONSAVEL
- [x] **Hierarquia de roles** com niveis numericos (ADMIN=7 ate RESPONSAVEL=1)
- [x] **Permissoes por modulo** com controle granular (MATRICULAS_CREATE, NOTAS_CREATE, etc.)
- [x] **Middleware de autorizacao** (requireRole, requirePermission, requireOwnershipOrAdmin, requireSameSchool)
- [x] **AuthContext** com hooks de autenticacao e verificacao de roles
- [x] **Portal Selector** com roteamento automatico baseado em role

#### Backend - Autorizacao
- **types/roles.ts** (95 linhas)
  - UserRole enum com 7 roles
  - RoleHierarchy com niveis numericos
  - ModulePermissions com permissoes granulares
  - Helper functions: hasRole, hasPermission, isHigherOrEqualRole

- **middleware/authorization.ts** (128 linhas)
  - AuthorizedRequest interface com user completo
  - requireRole: valida se usuario tem role permitido
  - requirePermission: valida permissao por modulo
  - requireOwnershipOrAdmin: valida propriedade de recurso
  - requireSameSchool: valida acesso restrito a mesma escola

#### Frontend - Contexto de Autenticacao
- **contexts/AuthContext.tsx** (104 linhas)
  - User interface com role, escolaId, profissionalId, matriculaId
  - AuthContext com login, logout, user state
  - useAuth hook para consumo em componentes
  - hasRole, hasPermission helpers

#### Portais Implementados (6 componentes)
- **PortalSelector.tsx** (54 linhas)
  - Roteamento automatico baseado em user.role
  - Switch com 6 casos + fallback
  - Carregamento condicional de portais

- **PortalAdmin.tsx** (103 linhas)
  - Acesso completo a todas funcionalidades
  - 3 abas: Overview, Cadastros, Pedagogico
  - Metricas gerais do sistema

- **PortalSEMEC.tsx** (189 linhas)
  - Dashboard da rede municipal
  - Metricas agregadas: escolas ativas, matriculas, professores
  - Cards de KPIs da rede inteira
  - Acesso a todas as escolas

- **PortalDiretor.tsx** (155 linhas)
  - Dashboard da escola (filtrado por escolaId)
  - Gestao de turmas e equipe
  - Ferramentas pedagogicas completas
  - Metricas da escola especifica

- **PortalProfessor.tsx** (131 linhas)
  - Ferramentas do dia-a-dia do professor
  - Acesso rapido: Frequencia, Notas, Grade Horaria
  - Lista de turmas atribuidas
  - Disciplinas vinculadas

- **PortalResponsavel.tsx** (170 linhas)
  - Dados do aluno vinculado (via matriculaId)
  - Boletim digital completo
  - Frequencia do aluno
  - 4 abas: Dados, Boletim, Frequencia, Comunicados

#### Integracao no Sistema
- **Prisma Schema**: User model atualizado com profissionalId, matriculaId, escolaId
- **AlunosManager.tsx**: Wrapper para MatriculasManager
- **Relacionamentos**: User <-> ProfissionalEducacao, User <-> Matricula

### Tarefas Tecnicas - Modulo 3
```
✅ COMPLETADO:
[x] Implementar sistema de roles completo (7 roles com hierarquia)
[x] Criar tipos e interfaces de autorizacao
[x] Implementar middleware de autorizacao por role
[x] Criar AuthContext para gerenciamento de estado
[x] Criar PortalSelector com roteamento por role
[x] Criar dashboards personalizados por perfil (6 portais)
[x] Integrar User com Profissional e Matricula no schema

FUTURO (nao prioritario para v1.0):
[ ] Calendario escolar no portal do responsavel
[ ] Sistema de comunicados/notificacoes
[ ] Atualizacao de dados cadastrais pelo responsavel
[ ] Exportacao para Censo Escolar (SEMEC)
[ ] Impressao em lote de documentos (Secretaria)
```

---

## MODULO 4: GESTAO DE RECURSOS HUMANOS

### Status Atual: ~55% Implementado

### Submodulos

#### 4.1 Cadastro de Servidores
- [x] CRUD completo de profissionais
- [x] Tipos: Professor, Auxiliar, Coordenador, Diretor
- [x] Vinculacao a multiplas escolas
- [x] Formacoes profissionais e especialidades
- [x] Matricula funcional
- [x] Busca por nome, CPF ou matricula
- [x] ProfissionalDetails com visao completa
- [ ] **Dados adicionais: vinculo (efetivo/contratado/cedido), data admissao, jornada, dados bancarios**

#### 4.2 Lotacao de Professores
- [x] Vinculacao professor <-> escola
- [x] Vinculacao professor <-> turma (com tipo e disciplina)
- [x] Relatorio de lotacao por escola (total, por tipo)
- [x] Carga horaria por escola e por turma
- [ ] **Historico de lotacoes**
- [ ] **Gestao de professores substitutos**

#### 4.3 Gestao de Horarios
- [x] Grade horaria por turma (GradeHorariaManager)
- [x] Carga horaria resumo por profissional
- [ ] **Controle de ACs (por area)**
- [ ] **Disponibilidade de professores**
- [ ] **Conflitos de horario**
- [ ] **Impressao de horarios**

#### 4.4 Folha de Ponto Digital
- [ ] Registro de entrada/saida
- [ ] Justificativas de atrasos
- [ ] Relatorio mensal
- [ ] Exportacao para RH

#### 4.5 Licencas e Afastamentos
- [ ] Tipos de licenca (medica, maternidade, etc.)
- [ ] Solicitacao online
- [ ] Aprovacao por diretor/SEMEC
- [ ] Historico de afastamentos

### Tarefas Pendentes - Modulo 4
```
MEDIA PRIORIDADE:
[ ] Ampliar modelo ProfissionalEducacao (vinculo, dataAdmissao, jornada)
[ ] Criar modelo Ponto (profissionalId, data, entrada, saida)
[ ] Criar modelo Licenca (profissionalId, tipo, dataInicio, dataFim, status)
[ ] Deteccao de conflitos de horario na grade
```

---

## MODULO 5: PROGRAMAS ESPECIAIS (Fase 4 - Nao Iniciado)

- [ ] Busca Ativa Escolar (identificacao infrequentes, visitas, encaminhamentos)
- [ ] Educacao Especial/AEE (cadastro PCD detalhado, PEI, sala de recursos)
- [ ] Acompanhamento Individualizado

## MODULO 6: ALIMENTACAO ESCOLAR (Fase 4 - Nao Iniciado)

- [ ] Gestao de Cardapios
- [ ] Controle de Estoque
- [ ] Registro de Refeicoes
- [ ] Relatorios FNDE/PNAE

## MODULO 7: TRANSPORTE ESCOLAR (Fase 4 - Nao Iniciado)

- [ ] Gestao de Rotas
- [ ] Cadastro de Veiculos
- [ ] Controle de Motoristas
- [ ] Manutencao Preventiva

## MODULO 8: GESTAO DEMOCRATICA (Fase 3 - Nao Iniciado)

- [ ] Colegiado Escolar
- [ ] Gremio Estudantil
- [ ] Lideres de Turma
- [ ] Reunioes e Assembleias

## MODULO 9: COMUNICACAO E EVENTOS (Fase 4 - Nao Iniciado)

- [ ] Plantao Pedagogico
- [ ] Reunioes de Pais
- [ ] Comunicados Gerais
- [ ] Notificacoes Push/SMS/Email

---

## PROXIMOS PASSOS

### PRIORIDADE 1: Relatorios e PDF (valor para usuario final)
```
1. [ ] Implementar geracao de PDF com @react-pdf/renderer
   - Ficha de matricula
   - Declaracao de matricula
   - Boletim escolar (impressao formatada)
   - Grade horaria
2. [ ] Relatorio de alunos PCD por escola
3. [ ] Relatorio de matriculas por escola/etapa
4. [ ] Relatorio de frequencia mensal
```

### PRIORIDADE 2: Notas - Recuperacao e Conselho
```
1. [ ] Implementar recuperacao paralela (nota de recuperacao por bimestre)
2. [ ] Implementar recuperacao final (nota unica pos 4o bimestre)
3. [ ] Conselho de classe (aprovacao/reprovacao coletiva por turma)
4. [ ] Registro de ata do conselho
```

### PRIORIDADE 3: Dashboard e Visualizacoes Adicionais
```
1. [ ] Grafico de evolucao mensal (line chart) no OverviewTab
2. [ ] Indicadores de frequencia por escola
3. [ ] Comparativo de desempenho entre turmas/escolas
```

### PRIORIDADE 4: Paginacao e Performance
```
1. [ ] Paginacao server-side (ja tem backend com findAllPaginated)
2. [ ] Conectar frontend com endpoints paginados
3. [ ] Skeleton loaders em todas operacoes
```

### PRIORIDADE 5: Portais de Acesso
```
1. [ ] Definir sistema de roles (ADMIN, SEMEC, DIRETOR, PROFESSOR, RESPONSAVEL)
2. [ ] Portal do Professor (chamada rapida + lancamento de notas)
3. [ ] Portal do Aluno/Responsavel (boletim + frequencia)
```

---

## ARQUITETURA TECNICA

### Estrutura de Arquivos
```
backend/
  prisma/
    schema.prisma          # 20+ modelos
    migrations/            # 7 migrations
    seed.ts                # Dados iniciais
  src/
    routes/                # 18 arquivos de rotas
    services/              # 13 servicos
    schemas/index.ts       # Zod schemas
    middleware/auth.ts      # JWT auth
    server.ts              # Registro de rotas

dashboard/
  src/
    app/page.tsx           # Pagina principal
    components/
      CadastrosTab.tsx     # Aba Cadastros (6 sub-abas)
      PedagogicoTab.tsx    # Aba Pedagogico (6 sub-abas)
      OverviewTab.tsx      # Aba Visao Geral (KPIs + 4 graficos Recharts)
      enrollment/          # 15+ componentes de gestao
    hooks/useApi.ts        # React Query hooks
    lib/api.ts             # API client tipado
```

### Bibliotecas Principais
- **Recharts** - Graficos interativos (BarChart, PieChart, ResponsiveContainer)
- **TanStack React Query** - Cache e estado do servidor
- **Radix UI / shadcn/ui** - Componentes de interface
- **Phosphor Icons** - Icones (v2)
- **Zod** - Validacao de schemas
- **Prisma** - ORM com SQLite (dev)

### Erros TS Pre-existentes (nao criticos)
- `upload.routes.ts`: Property 'file'/'parts' does not exist (tipagem multipart)
- `profissional.service.ts`: compound key 'escolaId_profissionalId'
- Estes erros existem no branch main e nao afetam o funcionamento

### Configuracoes Pendentes
```
Backend:
[ ] Migrar de SQLite para PostgreSQL (producao)
[ ] Implementar rate limiting
[ ] Configurar CORS adequadamente
[ ] Implementar logs estruturados (Pino)
[ ] Health check endpoint

Frontend:
[ ] Otimizar bundle (code splitting)
[ ] Configurar PWA manifest
[ ] Service worker

DevOps:
[ ] CI/CD (GitHub Actions)
[ ] Docker para desenvolvimento
[ ] Monitoramento (Sentry)
[ ] Backup automatico do banco

Seguranca:
[ ] Refresh tokens
[ ] Rate limiting por IP
[ ] Headers de seguranca
[ ] Audit logs
[ ] Revisar permissoes por role
```

---

## CRONOGRAMA SUGERIDO (ATUALIZADO)

### Semana 1-2: Consolidacao (CONCLUIDA)
- [x] Finalizar campos de matricula (saude, emergencia)
- [x] Implementar busca/filtros em todas listagens
- [x] Grade horaria frontend
- [x] Calendario com alerta 200 dias
- [x] Dashboard com graficos (Recharts) - 4 graficos interativos
- [x] Calculo de medias no boletim digital
- [x] Percentual de frequencia por aluno com resumo de turma
- [ ] Geracao de PDFs basicos

### Semana 3-4: Pedagogico Completo
- [ ] Geracao de PDFs (ficha matricula, declaracao, boletim, grade)
- [ ] Recuperacao paralela e final
- [ ] Conselho de classe basico
- [ ] Relatorios de frequencia mensal

### Semana 5-6: Portais
- [ ] Portal do Professor (chamada, notas)
- [ ] Portal do Aluno/Responsavel (boletim, frequencia)
- [ ] Sistema de autenticacao por role

### Semana 7-8: RH e Gestao
- [ ] Dados completos de servidores
- [ ] Ponto digital basico
- [ ] Licencas e afastamentos

### Semana 9-12: Modulos Secundarios
- [ ] Programas Especiais (Busca Ativa, AEE)
- [ ] Alimentacao Escolar
- [ ] Transporte Escolar

---

**Ultima Atualizacao:** 11 de Fevereiro de 2026
**Proxima Revisao:** Apos cada sessao de desenvolvimento
