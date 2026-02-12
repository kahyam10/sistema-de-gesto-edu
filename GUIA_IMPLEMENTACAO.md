# GUIA DE IMPLEMENTACAO - Sistema de Gestao Educacional

**Municipio:** Ibirapitanga-BA
**Versao:** 5.1
**Data de Criacao:** 04 de Fevereiro de 2026
**Ultima Atualizacao:** 12 de Fevereiro de 2026 (04:15)
**Autor:** KSsoft - Solucoes Tecnologicas

---

## RESUMO EXECUTIVO

### Estado Atual do Projeto
- **Backend:** Fastify + Prisma + SQLite (dev) - 27 arquivos de rotas, 23 servicos
- **Frontend:** Next.js 15 + Tailwind + shadcn/ui + React Query + Recharts + @react-pdf/renderer
- **Progresso Geral:** ~88% concluido (Frontend Modulos 4, 5 e 9 completos!)
- **Builds:** Frontend e Backend compilam corretamente. Erros TS pre-existentes (upload/multipart) corrigidos no Módulo 9
- **Autenticação:** Sistema JWT implementado com bypass para desenvolvimento (admin@kssoft.com.br / 1234)

### O Que Ja Temos Funcionando
| Componente | Status | Descricao |
|------------|--------|-----------|
| Schema Prisma | Completo | 30+ modelos (inclui Ponto, Licenca, BuscaAtiva, AEE, Acompanhamento, PlantaoPedagogico, ReuniaoPais, Comunicado, Notificacao) |
| Rotas Backend | Completo | 27 arquivos de rotas (todos os modulos 1-5 e 9 implementados) |
| Servicos Backend | Completo | 23 servicos implementados (incluindo RH, Programas Especiais e Comunicacao) |
| Dashboard Frontend | Completo | 8 abas: Overview, Cadastros, Pedagogico, RH, Programas Especiais, Comunicacao, Desenvolvimento, Tech |
| Gestores de Cadastro | Funcional | Escolas, Etapas/Series, Turmas, Matriculas, Profissionais, Salas, Calendario Letivo |
| Gestao Pedagogica | Completo | Frequencia, Notas, Avaliacoes, Disciplinas, Grade Horaria, Configuracao Avaliacao, Boletim Digital |
| Modulo RH | Completo ✅ | Ponto Digital, Licencas e Afastamentos - Frontend + Backend 100% |
| Modulo Programas | Completo ✅ | Busca Ativa, AEE, Acompanhamento - Frontend + Backend 100% |
| Modulo Comunicacao | Completo ✅ | Plantao Pedagogico, Reunioes de Pais, Comunicados, Notificacoes - Frontend + Backend 100% |
| Calendario Letivo | Avancado | CRUD eventos + contagem 200 dias LDB + alertas |
| Autenticacao | Basico | JWT implementado com bypass dev (admin@kssoft.com.br / 1234) |
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
| 4 | Gestao de Recursos Humanos | 1 | **COMPLETO** | **100%** | ALTA |
| 5 | Programas Especiais | 4 | **COMPLETO** | **100%** | MEDIA |
| 6 | Alimentacao Escolar | 4 | Nao Iniciado | 0% | BAIXA |
| 7 | Transporte Escolar | 4 | Nao Iniciado | 0% | BAIXA |
| 8 | Gestao Democratica | 3 | Nao Iniciado | 0% | MEDIA |
| 9 | Comunicacao e Eventos | 4 | **COMPLETO** | **100%** | MEDIA |

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

## MODULO 4: GESTAO DE RECURSOS HUMANOS ✅

### Status Atual: **100% COMPLETO**

### Submodulos

#### 4.1 Cadastro de Servidores
- [x] CRUD completo de profissionais
- [x] Tipos: Professor, Auxiliar, Coordenador, Diretor
- [x] Vinculacao a multiplas escolas
- [x] Formacoes profissionais e especialidades
- [x] Matricula funcional
- [x] Busca por nome, CPF ou matricula
- [x] ProfissionalDetails com visao completa
- [x] Dados completos no schema (CPF, RG, telefone, email, formacao, especialidades)

#### 4.2 Lotacao de Professores
- [x] Vinculacao professor <-> escola
- [x] Vinculacao professor <-> turma (com tipo e disciplina)
- [x] Relatorio de lotacao por escola (total, por tipo)
- [x] Carga horaria por escola e por turma
- [x] Listagem de escolas vinculadas ao profissional

#### 4.3 Gestao de Horarios
- [x] Grade horaria por turma (GradeHorariaManager)
- [x] Carga horaria resumo por profissional
- [x] ConflitosHorarioManager (deteccao de conflitos de professor, sala e turma)
- [x] ImpressaoGradeHoraria.tsx (exportacao PDF)

#### 4.4 Folha de Ponto Digital ✅
- [x] **Modelo Ponto no Prisma** (profissionalId, data, tipo, horaEntrada, horaSaida, justificativa, aprovado)
- [x] **ponto.service.ts** - CRUD completo + registro de ponto
- [x] **pontos.routes.ts** - API endpoints com autenticacao
- [x] Registro de entrada/saida (PRESENCA, FALTA, ATESTADO, FALTA_JUSTIFICADA)
- [x] Justificativas de ausencias
- [x] Aprovacao/rejeicao de justificativas
- [x] Relatorio mensal por profissional (endpoint /relatorio/:profissionalId)
- [x] Estatisticas de presenca (total, faltas, percentual)

#### 4.5 Licencas e Afastamentos ✅
- [x] **Modelo Licenca no Prisma** (profissionalId, tipo, dataInicio, dataFim, motivo, documento, status)
- [x] **licenca.service.ts** - CRUD completo + workflow de aprovacao
- [x] **licencas.routes.ts** - API endpoints com autenticacao
- [x] Tipos de licenca: MEDICA, MATERNIDADE, PATERNIDADE, CASAMENTO, LUTO, OUTRAS
- [x] Solicitacao de licenca com upload de documento
- [x] Workflow de aprovacao (PENDENTE → APROVADA/NEGADA)
- [x] Historico completo de afastamentos
- [x] Verificacao de conflitos de datas
- [x] Estatisticas (total, pendentes, aprovadas, negadas)
- [x] Busca de licencas por profissional e periodo

### Funcionalidades Implementadas - Modulo 4

```
✅ COMPLETADO:
[x] Sistema completo de Ponto Digital com registro de presenca/falta
[x] Justificativas e aprovacao de ausencias
[x] Relatorios mensais de frequencia de profissionais
[x] Sistema completo de Licencas e Afastamentos
[x] Workflow de aprovacao com status (PENDENTE/APROVADA/NEGADA)
[x] Upload de documentos para licencas
[x] Deteccao de conflitos de horario (ConflitosHorarioManager)
[x] Exportacao de grade horaria em PDF
[x] Estatisticas de presenca e afastamentos

FUTURO (nao prioritario para v1.0):
[ ] Relatorio de frequencia consolidado por escola
[ ] Integracao com sistema de folha de pagamento externo
[ ] Controle de horas extras e adicionais
[ ] Dashboard de RH com indicadores gerenciais
```

### Componentes Backend - Modulo 4

#### Servicos Implementados
- **ponto.service.ts** (248 linhas)
  - create: Registro de ponto (entrada/saida)
  - findAll: Listagem com filtros (profissionalId, tipo, data)
  - findById: Busca ponto especifico
  - update: Atualizacao de ponto (justificativa, aprovacao)
  - delete: Remocao de registro
  - findByProfissionalAndMes: Relatorio mensal
  - aprovar/rejeitar: Workflow de aprovacao de justificativas
  - getEstatisticas: Total, faltas, percentual de presenca

- **licenca.service.ts** (286 linhas)
  - create: Solicitacao de licenca com validacoes
  - findAll: Listagem com filtros (profissionalId, tipo, status, periodo)
  - findById: Detalhes completos da licenca
  - update: Atualizacao de dados da licenca
  - delete: Remocao de licenca (apenas PENDENTE)
  - aprovar/rejeitar: Workflow de aprovacao
  - findByProfissional: Historico por profissional
  - verificarConflitos: Deteccao de sobreposicao de datas
  - getEstatisticas: Total, pendentes, aprovadas, negadas

#### Rotas API
- **pontos.routes.ts** - Endpoints protegidos com authMiddleware
  - POST /api/pontos - Registrar ponto
  - GET /api/pontos - Listar pontos (filtros query params)
  - GET /api/pontos/:id - Buscar ponto especifico
  - PUT /api/pontos/:id - Atualizar ponto
  - DELETE /api/pontos/:id - Deletar ponto
  - GET /api/pontos/relatorio/:profissionalId - Relatorio mensal (query: mes, ano)
  - PUT /api/pontos/:id/aprovar - Aprovar justificativa
  - PUT /api/pontos/:id/rejeitar - Rejeitar justificativa
  - GET /api/pontos/estatisticas - Estatisticas gerais

- **licencas.routes.ts** - Endpoints protegidos com authMiddleware
  - POST /api/licencas - Solicitar licenca
  - GET /api/licencas - Listar licencas (filtros query params)
  - GET /api/licencas/:id - Buscar licenca especifica
  - PUT /api/licencas/:id - Atualizar licenca
  - DELETE /api/licencas/:id - Deletar licenca
  - PUT /api/licencas/:id/aprovar - Aprovar licenca
  - PUT /api/licencas/:id/rejeitar - Rejeitar licenca
  - GET /api/licencas/profissional/:profissionalId - Historico por profissional
  - GET /api/licencas/estatisticas - Estatisticas gerais

### Schema Prisma - Modulo 4

```prisma
model Ponto {
  id              String    @id @default(uuid())
  profissionalId  String
  profissional    ProfissionalEducacao @relation(fields: [profissionalId], references: [id])
  data            DateTime
  tipo            String    // PRESENCA, FALTA, ATESTADO, FALTA_JUSTIFICADA
  horaEntrada     String?
  horaSaida       String?
  justificativa   String?
  aprovado        Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Licenca {
  id              String    @id @default(uuid())
  profissionalId  String
  profissional    ProfissionalEducacao @relation(fields: [profissionalId], references: [id])
  tipo            String    // MEDICA, MATERNIDADE, PATERNIDADE, CASAMENTO, LUTO, OUTRAS
  dataInicio      DateTime
  dataFim         DateTime
  motivo          String?
  documentoUrl    String?
  status          String    @default("PENDENTE") // PENDENTE, APROVADA, NEGADA
  observacoes     String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

---

## MODULO 5: PROGRAMAS ESPECIAIS ✅

### Status Atual: **100% COMPLETO**

### Submodulos

#### 5.1 Busca Ativa Escolar ✅
- [x] **Modelo BuscaAtiva no Prisma** (escolaId, matriculaId, motivo, dataIdentificacao, etc.)
- [x] **busca-ativa.service.ts** - CRUD completo + workflow de acompanhamento
- [x] **busca-ativa.routes.ts** - API endpoints com autenticacao
- [x] Identificacao de alunos infrequentes (motivo, descricao)
- [x] Registro de visitas domiciliares (data, responsavel, resultado, observacoes)
- [x] Status de acompanhamento (IDENTIFICADO, EM_ACOMPANHAMENTO, RESOLVIDO, ENCAMINHADO)
- [x] Encaminhamentos (tipo, orgao, data, protocolo)
- [x] Historico completo de acoes
- [x] Relatorios e estatisticas (total, por status, taxa de resolucao)
- [x] **BuscaAtivaManager.tsx** - Interface completa no frontend

#### 5.2 Atendimento Educacional Especializado (AEE) ✅
- [x] **Modelo AEE no Prisma** (matriculaId, tipo, dataInicio, profissionalId, etc.)
- [x] **aee.service.ts** - CRUD completo + gestao de atendimentos
- [x] **aee.routes.ts** - API endpoints com autenticacao
- [x] Cadastro detalhado de alunos em atendimento
- [x] Tipos de atendimento: SALA_RECURSOS, ITINERANTE, COLABORATIVO, OUTRO
- [x] Vinculacao com profissional responsavel
- [x] Plano de Atendimento (objetivos, estrategias, recursos, avaliacoes)
- [x] Frequencia especifica de atendimento (dias da semana, horarios)
- [x] Registro de evolucao e relatorios semestrais
- [x] Status (ATIVO, CONCLUIDO, SUSPENSO, TRANSFERIDO)
- [x] Estatisticas de atendimentos por escola

#### 5.3 Acompanhamento Individualizado ✅
- [x] **Modelo Acompanhamento no Prisma** (matriculaId, tipo, profissionalId, etc.)
- [x] **acompanhamento.service.ts** - CRUD completo + registro de evolucao
- [x] **acompanhamento.routes.ts** - API endpoints com autenticacao
- [x] Tipos de acompanhamento: PEDAGOGICO, PSICOLOGICO, SOCIAL, SAUDE, OUTRO
- [x] Registro de situacao inicial (descricao, objetivos, estrategias)
- [x] Evolucoes periodicas (data, descricao, anexos)
- [x] Vinculacao com profissional responsavel
- [x] Encaminhamentos externos (tipo, orgao, data, retorno)
- [x] Status (EM_ANDAMENTO, CONCLUIDO, SUSPENSO, ENCAMINHADO)
- [x] Historico completo de acompanhamento
- [x] Relatorios e estatisticas por tipo

### Funcionalidades Implementadas - Modulo 5

```
✅ COMPLETADO:
[x] Sistema completo de Busca Ativa Escolar
[x] Identificacao e rastreamento de alunos infrequentes
[x] Registro de visitas domiciliares e acoes
[x] Sistema de Atendimento Educacional Especializado (AEE)
[x] Planos de atendimento e acompanhamento de evolucao
[x] Sistema de Acompanhamento Individualizado
[x] Registro de evolucoes e encaminhamentos
[x] Interface frontend completa (BuscaAtivaManager)
[x] Estatisticas e relatorios de todos os programas

FUTURO (nao prioritario para v1.0):
[ ] Dashboard de indicadores de programas especiais
[ ] Integracao com Conselho Tutelar
[ ] Relatorios para orgaos externos (MEC, FNDE)
[ ] Alertas automaticos de infrequencia
```

### Componentes Backend - Modulo 5

#### Servicos Implementados
- **busca-ativa.service.ts** (334 linhas)
  - create: Registrar caso de busca ativa
  - findAll: Listar casos com filtros (escolaId, status, motivo)
  - findById: Detalhes completos do caso
  - update: Atualizar status e informacoes
  - delete: Remover caso
  - registrarVisita: Adicionar visita domiciliar
  - registrarEncaminhamento: Adicionar encaminhamento
  - findByEscola: Casos por escola
  - getEstatisticas: Total, por status, taxa de resolucao

- **aee.service.ts** (297 linhas)
  - create: Registrar atendimento AEE
  - findAll: Listar atendimentos com filtros
  - findById: Detalhes do atendimento
  - update: Atualizar plano e dados
  - delete: Remover atendimento
  - registrarEvolucao: Adicionar registro de evolucao
  - findByMatricula: Historico por aluno
  - findByEscola: Atendimentos por escola
  - getEstatisticas: Total, por tipo, por status

- **acompanhamento.service.ts** (318 linhas)
  - create: Iniciar acompanhamento
  - findAll: Listar acompanhamentos com filtros
  - findById: Detalhes completos
  - update: Atualizar informacoes
  - delete: Remover acompanhamento
  - registrarEvolucao: Adicionar evolucao periodica
  - registrarEncaminhamento: Registrar encaminhamento externo
  - findByMatricula: Historico por aluno
  - getEstatisticas: Total, por tipo, por status

#### Rotas API
- **busca-ativa.routes.ts** - Endpoints protegidos com authMiddleware
  - POST /api/busca-ativa - Criar caso
  - GET /api/busca-ativa - Listar casos
  - GET /api/busca-ativa/:id - Buscar caso
  - PUT /api/busca-ativa/:id - Atualizar caso
  - DELETE /api/busca-ativa/:id - Deletar caso
  - POST /api/busca-ativa/:id/visita - Registrar visita
  - POST /api/busca-ativa/:id/encaminhamento - Registrar encaminhamento
  - GET /api/busca-ativa/escola/:escolaId - Casos por escola
  - GET /api/busca-ativa/estatisticas - Estatisticas gerais

- **aee.routes.ts** - Endpoints protegidos com authMiddleware
  - POST /api/aee - Criar atendimento
  - GET /api/aee - Listar atendimentos
  - GET /api/aee/:id - Buscar atendimento
  - PUT /api/aee/:id - Atualizar atendimento
  - DELETE /api/aee/:id - Deletar atendimento
  - POST /api/aee/:id/evolucao - Registrar evolucao
  - GET /api/aee/matricula/:matriculaId - Atendimentos por aluno
  - GET /api/aee/escola/:escolaId - Atendimentos por escola
  - GET /api/aee/estatisticas - Estatisticas gerais

- **acompanhamento.routes.ts** - Endpoints protegidos com authMiddleware
  - POST /api/acompanhamento - Criar acompanhamento
  - GET /api/acompanhamento - Listar acompanhamentos
  - GET /api/acompanhamento/:id - Buscar acompanhamento
  - PUT /api/acompanhamento/:id - Atualizar acompanhamento
  - DELETE /api/acompanhamento/:id - Deletar acompanhamento
  - POST /api/acompanhamento/:id/evolucao - Registrar evolucao
  - POST /api/acompanhamento/:id/encaminhamento - Registrar encaminhamento
  - GET /api/acompanhamento/matricula/:matriculaId - Acompanhamentos por aluno
  - GET /api/acompanhamento/estatisticas - Estatisticas gerais

### Schema Prisma - Modulo 5

```prisma
model BuscaAtiva {
  id                 String    @id @default(uuid())
  escolaId           String
  escola             Escola    @relation(fields: [escolaId], references: [id])
  matriculaId        String
  matricula          Matricula @relation(fields: [matriculaId], references: [id])
  motivo             String    // INFREQUENCIA, EVASAO, ABANDONO
  descricao          String?
  dataIdentificacao  DateTime
  status             String    @default("IDENTIFICADO")
  visitas            Json?     // Array de visitas domiciliares
  encaminhamentos    Json?     // Array de encaminhamentos
  observacoes        String?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}

model AEE {
  id              String    @id @default(uuid())
  matriculaId     String
  matricula       Matricula @relation(fields: [matriculaId], references: [id])
  tipo            String    // SALA_RECURSOS, ITINERANTE, COLABORATIVO
  dataInicio      DateTime
  dataFim         DateTime?
  profissionalId  String?
  profissional    ProfissionalEducacao? @relation(fields: [profissionalId], references: [id])
  planoAtendimento Json?    // Objetivos, estrategias, recursos
  frequencia      String?   // Dias da semana, horarios
  evolucoes       Json?     // Array de registros de evolucao
  status          String    @default("ATIVO")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Acompanhamento {
  id              String    @id @default(uuid())
  matriculaId     String
  matricula       Matricula @relation(fields: [matriculaId], references: [id])
  tipo            String    // PEDAGOGICO, PSICOLOGICO, SOCIAL, SAUDE
  profissionalId  String?
  profissional    ProfissionalEducacao? @relation(fields: [profissionalId], references: [id])
  situacaoInicial String?
  objetivos       String?
  estrategias     String?
  evolucoes       Json?     // Array de evolucoes periodicas
  encaminhamentos Json?     // Array de encaminhamentos externos
  status          String    @default("EM_ANDAMENTO")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### Componentes Frontend - Modulo 4

- **PontoDigitalManager.tsx** (completo)
  - Interface de gestao de folha de ponto
  - Filtros por profissional, mes e ano
  - Relatorio mensal de frequencia
  - Cards de estatisticas (presencas, faltas, percentual)
  - Badges por tipo de registro
  - Integracao com pontosApi via React Query

- **LicencasManager.tsx** (479 linhas) ✅
  - Gestao completa de licencas e afastamentos
  - Filtros por profissional e status
  - Cards de estatisticas (total, pendentes, aprovadas, dias)
  - Listagem em tabela com todas as licencas
  - Dialogs de aprovacao e rejeicao
  - Cancelamento de licencas aprovadas
  - Badges por status (PENDENTE, APROVADA, REJEITADA, CANCELADA)
  - Integracao com licencasApi via React Query

- **ProfissionaisManager.tsx** (integrado em RHTab)
  - Gestao de profissionais da educacao
  - Vinculacao com escolas

**Integracao:** Componentes integrados em [RHTab.tsx](dashboard/src/components/RHTab.tsx) com 3 sub-abas (Ponto Digital, Licencas, Profissionais)

---

### Componentes Frontend - Modulo 5

- **BuscaAtivaManager.tsx** (535 linhas) ✅
  - Interface completa de gestao de busca ativa
  - Formularios de cadastro e edicao
  - Listagem com filtros e busca
  - Detalhamento de casos com historico
  - Registro de visitas e encaminhamentos
  - Cards de estatisticas
  - Integracao com API via React Query

- **EducacaoEspecialManager.tsx** (AEE) ✅
  - Gestao de Atendimento Educacional Especializado
  - Cadastro de alunos em atendimento
  - Planos de atendimento (objetivos, estrategias)
  - Registro de evolucao
  - Cards de estatisticas
  - Integracao com aeeApi via React Query

- **AcompanhamentoManager.tsx** ✅
  - Acompanhamento individualizado de alunos
  - Tipos: PEDAGOGICO, PSICOLOGICO, SOCIAL, SAUDE
  - Registro de situacao inicial e evolucoes
  - Encaminhamentos externos
  - Historico completo
  - Integracao com acompanhamentoApi via React Query

**Integracao:** Componentes integrados em [ProgramasEspeciaisTab.tsx](dashboard/src/components/ProgramasEspeciaisTab.tsx) com 3 sub-abas (Busca Ativa, Educacao Especial/AEE, Acompanhamento)

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

## MODULO 9: COMUNICACAO E EVENTOS ✅

### Status Atual: **100% COMPLETO**

### Submodulos

#### 9.1 Plantao Pedagogico ✅
- [x] **Modelo PlantaoPedagogico no Prisma** (escolaId, data, tipo, horarios, etc.)
- [x] **plantao-pedagogico.service.ts** - CRUD completo + gestao de plantoes
- [x] **plantao-pedagogico.routes.ts** - API endpoints com autenticacao
- [x] Agendamento de plantoes pedagogicos
- [x] Tipos: INDIVIDUAL, COLETIVO, EMERGENCIAL
- [x] Vinculacao com escola e turma (opcional)
- [x] Definicao de horarios (inicio/fim), local, profissionais
- [x] Busca por escola e periodo
- [x] Status (ativo/inativo)
- [x] Estatisticas de plantoes (total, proximos, por tipo)

#### 9.2 Reunioes de Pais ✅
- [x] **Modelo ReuniaoPais no Prisma** (escolaId, turmaId, data, pauta, etc.)
- [x] **Modelo PresencaReuniao** (controle de presenca por responsavel)
- [x] **reuniao-pais.service.ts** - CRUD completo + controle de presenca
- [x] **reuniao-pais.routes.ts** - API endpoints com autenticacao
- [x] Agendamento de reunioes por escola/turma
- [x] Tipos: BIMESTRAL, CONSELHO_CLASSE, EXTRAORDINARIA, TEMATICA
- [x] Pauta, ata e encaminhamentos
- [x] Registro de presenca de responsaveis (com horario chegada)
- [x] Calculo de taxa de presenca
- [x] Vinculos: escola, turma, profissional responsavel
- [x] Status: AGENDADA, REALIZADA, CANCELADA, ADIADA
- [x] Estatisticas (total, proximas, taxa de presenca media)

#### 9.3 Comunicados Gerais ✅
- [x] **Modelo Comunicado no Prisma** (escolaId, titulo, mensagem, etc.)
- [x] **Modelo ComunicadoDestinatario** (controle de leitura e confirmacao)
- [x] **comunicado.service.ts** - CRUD completo + controle de leitura
- [x] **comunicado.routes.ts** - API endpoints com autenticacao
- [x] Criacao de comunicados (geral, por escola, turma ou etapa)
- [x] Tipos: INFORMATIVO, URGENTE, AVISO, CONVOCACAO, COMUNICADO_GERAL
- [x] Categorias: ACADEMICO, ADMINISTRATIVO, EVENTO, SAUDE, OUTROS
- [x] Destinatarios: TODOS, PAIS, PROFESSORES, ESPECIFICO
- [x] Anexos (documentos, imagens)
- [x] Data de publicacao e expiracao
- [x] Marcacao de destaque
- [x] Controle de leitura por usuario (lido/nao lido)
- [x] Confirmacao de recebimento
- [x] Estatisticas (total, destaques, por tipo)

#### 9.4 Notificacoes ✅
- [x] **Modelo Notificacao no Prisma** (userId, titulo, mensagem, etc.)
- [x] **notificacao.service.ts** - CRUD completo + controle multicanal
- [x] **notificacao.routes.ts** - API endpoints com autenticacao
- [x] Sistema de notificacoes individuais
- [x] Tipos: INFO, ALERTA, TAREFA, LEMBRETE, SISTEMA
- [x] Prioridade: BAIXA, NORMAL, ALTA, URGENTE
- [x] Multicanal: EMAIL, SMS, PUSH
- [x] Status de envio por canal (enviadaEmail, enviadaSMS, enviadaPush)
- [x] Marcacao de lida/nao lida
- [x] Links de acao (tipo e ID da acao relacionada)
- [x] Notificacoes em massa (createBulk)
- [x] Contagem de nao lidas
- [x] Exclusao em lote de notificacoes lidas
- [x] Estatisticas (total, nao lidas, por tipo, por prioridade)

### Funcionalidades Implementadas - Modulo 9

```
✅ COMPLETADO:
[x] Sistema completo de Plantao Pedagogico
[x] Agendamento e gestao de plantoes por escola/turma
[x] Sistema de Reunioes de Pais com controle de presenca
[x] Calculo automatico de taxa de participacao
[x] Sistema de Comunicados com segmentacao por publico
[x] Controle de leitura e confirmacao de recebimento
[x] Sistema de Notificacoes multicanal (Email/SMS/Push)
[x] Notificacoes individuais e em massa
[x] Estatisticas completas de todos os modulos

FUTURO (nao prioritario para v1.0):
[ ] Integracao real com servicos de Email (SMTP)
[ ] Integracao com gateway de SMS
[ ] Notificacoes Push (Firebase Cloud Messaging)
[ ] Templates de comunicados e notificacoes
[ ] Agendamento automatico de comunicados
[ ] Dashboard de metricas de comunicacao
```

### Componentes Backend - Modulo 9

#### Servicos Implementados
- **plantao-pedagogico.service.ts** (293 linhas)
  - create: Agendar plantao pedagogico
  - findAll: Listar plantoes com filtros (escolaId, turmaId, tipo, periodo)
  - findById: Detalhes do plantao
  - update: Atualizar informacoes
  - delete: Remover plantao
  - findByEscolaAndPeriodo: Plantoes por escola em periodo especifico
  - getEstatisticas: Total, proximos, por tipo

- **reuniao-pais.service.ts** (515 linhas)
  - create: Agendar reuniao de pais
  - findAll: Listar reunioes com filtros
  - findById: Detalhes completos da reuniao
  - update: Atualizar dados (pauta, ata, encaminhamentos)
  - delete: Remover reuniao (validacao de presencas)
  - registrarPresenca: Registrar presenca de responsavel
  - findPresencasByReuniao: Listar presencas de uma reuniao
  - deletePresenca: Remover presenca
  - getEstatisticas: Total, proximas, taxa de presenca media

- **comunicado.service.ts** (483 linhas)
  - create: Criar comunicado
  - findAll: Listar comunicados com filtros
  - findById: Detalhes do comunicado
  - update: Atualizar comunicado
  - delete: Remover comunicado
  - marcarComoLido: Marcar leitura por usuario
  - confirmar: Confirmar recebimento por usuario
  - findByUser: Comunicados por usuario (filtros: NAO_LIDOS, LIDOS, TODOS)
  - getEstatisticas: Total, destaques, por tipo, por categoria

- **notificacao.service.ts** (311 linhas)
  - create: Criar notificacao individual
  - createBulk: Criar notificacoes em massa
  - findAll: Listar notificacoes com filtros
  - findByUser: Notificacoes por usuario
  - findById: Detalhes da notificacao
  - marcarComoLida: Marcar como lida
  - marcarTodasComoLidas: Marcar todas como lidas
  - delete: Deletar notificacao
  - deletarLidas: Deletar todas as lidas
  - countNaoLidas: Contar nao lidas
  - atualizarStatusEnvio: Atualizar status de envio (EMAIL/SMS/PUSH)
  - getEstatisticas: Total, nao lidas, por tipo, por prioridade

#### Rotas API
- **plantao-pedagogico.routes.ts** - Endpoints protegidos com authMiddleware
  - POST /api/plantao-pedagogico - Criar plantao
  - GET /api/plantao-pedagogico - Listar plantoes
  - GET /api/plantao-pedagogico/:id - Buscar plantao
  - PUT /api/plantao-pedagogico/:id - Atualizar plantao
  - DELETE /api/plantao-pedagogico/:id - Deletar plantao
  - GET /api/plantao-pedagogico/escola/:escolaId - Plantoes por escola
  - GET /api/plantao-pedagogico/estatisticas - Estatisticas

- **reuniao-pais.routes.ts** - Endpoints protegidos com authMiddleware
  - POST /api/reuniao-pais - Criar reuniao
  - GET /api/reuniao-pais - Listar reunioes
  - GET /api/reuniao-pais/:id - Buscar reuniao
  - PUT /api/reuniao-pais/:id - Atualizar reuniao
  - DELETE /api/reuniao-pais/:id - Deletar reuniao
  - POST /api/reuniao-pais/:id/presenca - Registrar presenca
  - GET /api/reuniao-pais/:id/presencas - Listar presencas
  - DELETE /api/reuniao-pais/presenca/:id - Deletar presenca
  - GET /api/reuniao-pais/estatisticas - Estatisticas

- **comunicado.routes.ts** - Endpoints protegidos com authMiddleware
  - POST /api/comunicado - Criar comunicado
  - GET /api/comunicado - Listar comunicados
  - GET /api/comunicado/:id - Buscar comunicado
  - PUT /api/comunicado/:id - Atualizar comunicado
  - DELETE /api/comunicado/:id - Deletar comunicado
  - PUT /api/comunicado/:id/lido - Marcar como lido
  - PUT /api/comunicado/:id/confirmar - Confirmar recebimento
  - GET /api/comunicado/user/:userId - Comunicados por usuario
  - GET /api/comunicado/estatisticas - Estatisticas

- **notificacao.routes.ts** - Endpoints protegidos com authMiddleware
  - POST /api/notificacao - Criar notificacao
  - POST /api/notificacao/bulk - Criar notificacoes em massa
  - GET /api/notificacao - Listar notificacoes
  - GET /api/notificacao/user/:userId - Notificacoes por usuario
  - GET /api/notificacao/:id - Buscar notificacao
  - PUT /api/notificacao/:id/lida - Marcar como lida
  - PUT /api/notificacao/user/:userId/todas-lidas - Marcar todas como lidas
  - DELETE /api/notificacao/:id - Deletar notificacao
  - DELETE /api/notificacao/user/:userId/lidas - Deletar lidas
  - GET /api/notificacao/user/:userId/count - Contar nao lidas
  - PUT /api/notificacao/:id/status-envio - Atualizar status de envio
  - GET /api/notificacao/estatisticas - Estatisticas

### Componentes Frontend - Modulo 9

- **PlantaoPedagogicoManager.tsx** ✅
  - Gestao de plantoes pedagogicos
  - Formulario de criacao/edicao com dialogs
  - Filtros por escola e tipo
  - Cards de estatisticas (total, proximos, por tipo)
  - Listagem de plantoes com badges de status
  - Integracao com plantaoPedagogicoApi via React Query

- **ReuniaoPaisManager.tsx** (718 linhas) ✅
  - Gestao completa de reunioes de pais
  - Formulario de agendamento com todos os campos
  - Filtros por escola e status
  - Cards de estatisticas (total, agendadas, realizadas, taxa de presenca)
  - Listagem de reunioes com badges
  - **PresencasDialog** integrado - controle de presenca de responsaveis
  - Registro de presenca com nome do responsavel
  - Lista de presencas registradas
  - Integracao com reuniaoPaisApi e presencasApi via React Query

- **ComunicadoManager.tsx** ✅
  - Gestao de comunicados gerais
  - Criacao com segmentacao (escola, turma, etapa, destinatarios)
  - Tipos: INFORMATIVO, URGENTE, AVISO, CONVOCACAO
  - Upload de anexos
  - Data de expiracao e destaque
  - Cards de estatisticas
  - Integracao com comunicadoApi via React Query

- **NotificacaoManager.tsx** ✅
  - Sistema de notificacoes individuais
  - Criacao de notificacoes por usuario
  - Tipos: INFORMACAO, ALERTA, URGENTE, ACADEMICO, FINANCEIRO, LEMBRETE
  - Prioridade: BAIXA, NORMAL, ALTA, URGENTE
  - Multicanal: EMAIL, SMS, PUSH (com indicadores de envio)
  - Marcacao de lida/nao lida
  - Cards de estatisticas
  - Integracao com notificacaoApi via React Query

**Integracao:** Componentes integrados em [ComunicacaoTab.tsx](dashboard/src/components/ComunicacaoTab.tsx) com:
- Cards de resumo (Comunicados ativos, Reunioes agendadas, Plantoes, Notificacoes nao lidas)
- 4 sub-abas (Plantoes Pedagogicos, Reunioes de Pais, Comunicados, Notificacoes)

---

### Schema Prisma - Modulo 9

```prisma
model PlantaoPedagogico {
  id            String    @id @default(uuid())
  escolaId      String
  escola        Escola    @relation(fields: [escolaId], references: [id])
  data          DateTime
  tipo          String    // INDIVIDUAL, COLETIVO, EMERGENCIAL
  descricao     String?
  horarioInicio String
  horarioFim    String
  profissionais String?   // JSON com lista de profissionais
  turmaId       String?
  turma         Turma?    @relation(fields: [turmaId], references: [id])
  local         String?
  observacoes   String?
  ativo         Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model ReuniaoPais {
  id           String    @id @default(uuid())
  escolaId     String
  escola       Escola    @relation(fields: [escolaId], references: [id])
  turmaId      String?
  turma        Turma?    @relation(fields: [turmaId], references: [id])
  titulo       String
  descricao    String?
  data         DateTime
  horario      String
  duracao      Int?      // em minutos
  local        String?
  tipo         String    // BIMESTRAL, CONSELHO_CLASSE, EXTRAORDINARIA
  finalidade   String?
  pauta        String?
  ata          String?
  encaminhamentos String?
  profissionalId String?
  profissional   ProfissionalEducacao? @relation(fields: [profissionalId], references: [id])
  status       String    @default("AGENDADA")
  presencas    PresencaReuniao[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model PresencaReuniao {
  id              String    @id @default(uuid())
  reuniaoId       String
  reuniao         ReuniaoPais @relation(fields: [reuniaoId], references: [id])
  matriculaId     String
  matricula       Matricula @relation(fields: [matriculaId], references: [id])
  nomeResponsavel String
  parentesco      String?
  presente        Boolean   @default(false)
  horarioChegada  String?
  observacoes     String?
  createdAt       DateTime  @default(now())

  @@unique([reuniaoId, matriculaId])
}

model Comunicado {
  id                   String    @id @default(uuid())
  escolaId             String?
  escola               Escola?   @relation(fields: [escolaId], references: [id])
  titulo               String
  mensagem             String
  tipo                 String    // INFORMATIVO, URGENTE, AVISO
  categoria            String?   // ACADEMICO, ADMINISTRATIVO, EVENTO
  destinatarios        String    // TODOS, PAIS, PROFESSORES
  turmaId              String?
  turma                Turma?    @relation(fields: [turmaId], references: [id])
  etapaId              String?
  etapa                EtapaEnsino? @relation(fields: [etapaId], references: [id])
  anexoUrl             String?
  dataPublicacao       DateTime  @default(now())
  dataExpiracao        DateTime?
  destaque             Boolean   @default(false)
  autorId              String?
  autor                ProfissionalEducacao? @relation(fields: [autorId], references: [id])
  autorNome            String
  ativo                Boolean   @default(true)
  destinatariosLeitura ComunicadoDestinatario[]
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
}

model ComunicadoDestinatario {
  id             String    @id @default(uuid())
  comunicadoId   String
  comunicado     Comunicado @relation(fields: [comunicadoId], references: [id])
  userId         String
  lido           Boolean   @default(false)
  dataLeitura    DateTime?
  confirmado     Boolean   @default(false)
  dataConfirmacao DateTime?

  @@unique([comunicadoId, userId])
}

model Notificacao {
  id           String    @id @default(uuid())
  userId       String
  titulo       String
  mensagem     String
  tipo         String    // INFO, ALERTA, TAREFA, LEMBRETE
  prioridade   String    @default("NORMAL") // BAIXA, NORMAL, ALTA, URGENTE
  canais       String    // EMAIL, SMS, PUSH (separados por virgula)
  enviadaEmail Boolean   @default(false)
  enviadaSMS   Boolean   @default(false)
  enviadaPush  Boolean   @default(false)
  lida         Boolean   @default(false)
  dataLeitura  DateTime?
  link         String?
  acaoTipo     String?
  acaoId       String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

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

**Ultima Atualizacao:** 12 de Fevereiro de 2026 (02:30)
**Proxima Revisao:** Apos cada sessao de desenvolvimento

---

## RELATORIO DE PENDENCIAS E PROXIMOS PASSOS

### Modulos Concluidos (6 de 9)
✅ **Modulo 1:** Gestao de Matriculas e Alunos - 100%
✅ **Modulo 2:** Gestao Pedagogica - 100%
✅ **Modulo 3:** Portais de Acesso - 100%
✅ **Modulo 4:** Gestao de Recursos Humanos - 100%
✅ **Modulo 5:** Programas Especiais - 100%
✅ **Modulo 9:** Comunicacao e Eventos - 100%

### Modulos Nao Iniciados (3 de 9)
❌ **Modulo 6:** Alimentacao Escolar - 0%
❌ **Modulo 7:** Transporte Escolar - 0%
❌ **Modulo 8:** Gestao Democratica - 0%

### Status Geral: 67% Concluido (6/9 modulos)

---

### PENDENCIAS TECNICAS

#### 1. Frontend - Interfaces Faltantes
```
PRIORIDADE ALTA:
[ ] Frontend para Ponto Digital (PontosManager.tsx)
[ ] Frontend para Licencas (LicencasManager.tsx)
[ ] Frontend para AEE (AEEManager.tsx)
[ ] Frontend para Acompanhamento (AcompanhamentoManager.tsx)
[ ] Frontend para Plantao Pedagogico (PlantaoPedagogicoManager.tsx)
[ ] Frontend para Reunioes de Pais (ReunioesPaisManager.tsx)
[ ] Frontend para Comunicados (ComunicadosManager.tsx)
[ ] Frontend para Notificacoes (NotificacoesCenter.tsx)

PRIORIDADE MEDIA:
[ ] Integracao de todos os novos modulos na aba CadastrosTab ou nova aba
[ ] Criacao de aba "Comunicacao" no dashboard
[ ] Dashboard de RH com indicadores (presenca, licencas)
```

#### 2. Backend - Melhorias e Ajustes
```
PRIORIDADE ALTA:
[ ] Migrar de SQLite para PostgreSQL (producao)
[ ] Implementar sistema de refresh tokens
[ ] Configurar CORS adequadamente para producao

PRIORIDADE MEDIA:
[ ] Implementar rate limiting por IP
[ ] Health check endpoint
[ ] Logs estruturados (Pino/Winston)
[ ] Audit logs para acoes criticas
[ ] Validacao adicional de permissoes por role em rotas sensiveis
```

#### 3. Funcionalidades Opcionais Modulos Concluidos
```
BAIXA PRIORIDADE (pode ser implementado futuramente):
[ ] Exportacao de frequencia para Sistema Presenca (MEC)
[ ] Portal publico para pais realizarem matricula online
[ ] Notificacoes por SMS/Email (requer integracao externa)
[ ] Calendario escolar no portal do responsavel
[ ] Impressao em lote de documentos
[ ] Exportacao para Censo Escolar (SEMEC)
[ ] Integracao com Conselho Tutelar (Busca Ativa)
[ ] Alertas automaticos de infrequencia (pode usar dados de Frequencia existente)
```

#### 4. Performance e Otimizacao
```
MEDIA PRIORIDADE:
[ ] Implementar paginacao server-side em todas as listagens grandes
[ ] Skeleton loaders em operacoes assincronas
[ ] Otimizar queries Prisma (includes desnecessarios)
[ ] Code splitting no frontend (lazy loading)
[ ] Service worker para PWA
[ ] Otimizacao de bundle (analise com webpack-bundle-analyzer)
```

#### 5. Testes e Qualidade
```
ALTA PRIORIDADE:
[ ] Testes unitarios dos servicos backend (Jest)
[ ] Testes de integracao das rotas (Fastify testing)
[ ] Testes E2E do frontend (Playwright/Cypress)
[ ] Validacao de schemas Zod em todas as rotas
[ ] Tratamento consistente de erros

MEDIA PRIORIDADE:
[ ] Testes de carga/stress (Artillery/k6)
[ ] Cobertura de codigo > 80%
[ ] Linting e formatacao automatica (ESLint + Prettier)
```

---

### ROADMAP SUGERIDO

#### Fase Atual: Consolidacao dos 6 Modulos Concluidos
**Prazo Estimado:** 2-3 semanas

1. **Semana 1: Frontend dos Modulos 4, 5 e 9**
   - Criar interfaces para Ponto Digital e Licencas (Modulo 4)
   - Criar interfaces para AEE e Acompanhamento (Modulo 5)
   - Criar interfaces para Plantao, Reunioes, Comunicados e Notificacoes (Modulo 9)
   - Integrar componentes no dashboard principal

2. **Semana 2: Testes e Ajustes**
   - Testes manuais de todos os CRUDs
   - Correcao de bugs encontrados
   - Validacoes de formularios
   - Mensagens de feedback ao usuario

3. **Semana 3: Performance e Polish**
   - Implementar paginacao server-side
   - Skeleton loaders
   - Otimizacao de queries
   - Melhorias de UX

#### Fase 2: Modulos Secundarios (6, 7, 8)
**Prazo Estimado:** 4-6 semanas

**Modulo 6: Alimentacao Escolar** (2 semanas)
- Gestao de cardapios (CRUD)
- Controle de estoque de alimentos
- Registro diario de refeicoes servidas
- Relatorios FNDE/PNAE

**Modulo 7: Transporte Escolar** (2 semanas)
- Gestao de rotas e itinerarios
- Cadastro de veiculos
- Controle de motoristas e monitores
- Manutencao preventiva

**Modulo 8: Gestao Democratica** (2 semanas)
- Colegiado escolar
- Gremio estudantil
- Lideres de turma
- Reunioes e assembleias

#### Fase 3: Preparacao para Producao
**Prazo Estimado:** 2 semanas

1. **Semana 1: Infraestrutura**
   - Migrar para PostgreSQL
   - Configurar ambiente de producao (Docker)
   - CI/CD com GitHub Actions
   - Monitoramento (Sentry)

2. **Semana 2: Seguranca e Testes**
   - Refresh tokens
   - Rate limiting
   - Headers de seguranca
   - Testes de carga
   - Backup automatico

---

### METRICAS DO PROJETO

#### Codigo Backend
- **Rotas:** 27 arquivos
- **Servicos:** 23 arquivos
- **Modelos Prisma:** 30+ modelos
- **Migrations:** 12 migrations
- **Linhas de Codigo (estimado):** ~15.000 linhas

#### Codigo Frontend
- **Componentes:** 40+ componentes
- **Pages:** 2 pages (login + dashboard)
- **Hooks:** useApi.ts com React Query
- **Linhas de Codigo (estimado):** ~12.000 linhas

#### Total Estimado: ~27.000 linhas de codigo

---

### PROXIMAS ACOES RECOMENDADAS

**ACAO IMEDIATA (proxima sessao):**
1. ✅ ~~Criar PontosManager.tsx e LicencasManager.tsx~~ - **CONCLUIDO**
2. ✅ ~~Criar AEEManager.tsx e AcompanhamentoManager.tsx~~ - **CONCLUIDO**
3. ✅ ~~Adicionar aba "RH" no dashboard com Ponto e Licencas~~ - **CONCLUIDO**
4. ✅ ~~Adicionar aba "Programas" no dashboard com Busca Ativa, AEE e Acompanhamento~~ - **CONCLUIDO**
5. ✅ ~~Completar frontend do Modulo 9 (Comunicacao)~~ - **CONCLUIDO**
6. Testar todos os CRUDs criados manualmente
7. Validar fluxos completos de cada modulo

**CURTO PRAZO (1-2 semanas):**
1. Implementar paginacao server-side em todas as listagens grandes
2. Adicionar skeleton loaders em todas as operacoes assincronas
3. Melhorar tratamento de erros com mensagens mais especificas
4. Adicionar validacoes de formularios mais robustas

**MEDIO PRAZO (3-4 semanas):**
1. Implementar Modulo 6 (Alimentacao Escolar)
2. Implementar Modulo 7 (Transporte Escolar)
3. Implementar Modulo 8 (Gestao Democratica)

**LONGO PRAZO (2-3 meses):**
1. Preparar para producao (PostgreSQL, Docker)
2. Implementar testes automatizados
3. Configurar CI/CD
4. Deploy em servidor
