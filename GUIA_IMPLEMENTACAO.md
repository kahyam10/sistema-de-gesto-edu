# GUIA DE IMPLEMENTACAO - Sistema de Gestao Educacional

**Municipio:** Ibirapitanga-BA
**Versao:** 2.0
**Data de Criacao:** 04 de Fevereiro de 2026
**Ultima Atualizacao:** 11 de Fevereiro de 2026
**Autor:** KSsoft - Solucoes Tecnologicas

---

## RESUMO EXECUTIVO

### Estado Atual do Projeto
- **Backend:** Fastify + Prisma + SQLite (dev) - 18 arquivos de rotas, 13 servicos
- **Frontend:** Next.js 15 + Tailwind + shadcn/ui + React Query - Dashboard completo
- **Progresso Geral:** ~45% concluido
- **Builds:** Frontend compila sem erros. Backend tem 3 erros TS pre-existentes (multipart typing + compound key)

### O Que Ja Temos Funcionando
| Componente | Status | Descricao |
|------------|--------|-----------|
| Schema Prisma | Completo | 20+ modelos (inclui Frequencia, Avaliacao, Nota, Disciplina, GradeHoraria, ConfiguracaoAvaliacao) |
| Rotas Backend | Avancado | 18 arquivos de rotas (matriculas, turmas, escolas, profissionais, calendario, frequencia, notas, avaliacoes, disciplinas, grade-horaria, configuracao-avaliacao, salas, etapas, series, upload, modules, phases) |
| Servicos Backend | Avancado | 13 servicos implementados |
| Dashboard Frontend | Funcional | 3 abas principais: Overview, Cadastros, Pedagogico |
| Gestores de Cadastro | Funcional | Escolas, Etapas/Series, Turmas, Matriculas, Profissionais, Salas, Calendario Letivo |
| Gestao Pedagogica | Em Progresso | Frequencia, Notas, Avaliacoes, Disciplinas, Grade Horaria, Configuracao Avaliacao, Boletim Digital |
| Calendario Letivo | Avancado | CRUD eventos + contagem 200 dias LDB + alertas |
| Autenticacao | Basico | JWT implementado |
| Busca/Filtros | Implementado | Matriculas, Profissionais, Turmas - busca por texto |
| Dados de Saude | Implementado | Tipo sanguineo, alergias, medicamentos, SUS, emergencia, autorizacoes |

### Commits Recentes
```
fdc2449 feat: adiciona saude/emergencia na matricula, grade horaria, busca e melhorias UX
3ec9335 feat: adiciona Gestao Pedagogica, melhora RH e Dashboard
5c0f48a feat: finaliza Fase 1 - Modulo de Matriculas
4a47269 feat: adiciona modulo Calendario Letivo, Salas, melhorias UX
```

---

## MODULOS DO SISTEMA

### Visao Geral dos 9 Modulos Principais

| # | Modulo | Fase | Status | Progresso | Prioridade |
|---|--------|------|--------|-----------|------------|
| 1 | Gestao de Matriculas e Alunos | 1 | Em Progresso | ~80% | ALTA |
| 2 | Gestao Pedagogica | 2 | Em Progresso | ~40% | ALTA |
| 3 | Portais de Acesso | 2 | Nao Iniciado | 0% | MEDIA |
| 4 | Gestao de Recursos Humanos | 1 | Em Progresso | ~55% | ALTA |
| 5 | Programas Especiais | 4 | Nao Iniciado | 0% | BAIXA |
| 6 | Alimentacao Escolar | 4 | Nao Iniciado | 0% | BAIXA |
| 7 | Transporte Escolar | 4 | Nao Iniciado | 0% | BAIXA |
| 8 | Gestao Democratica | 3 | Nao Iniciado | 0% | MEDIA |
| 9 | Comunicacao e Eventos | 4 | Nao Iniciado | 0% | MEDIA |

---

## MODULO 1: GESTAO DE MATRICULAS E ALUNOS

### Status Atual: ~80% Implementado

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
- [ ] **Portal publico para pais realizarem matricula**
- [ ] **Confirmacao via SMS/Email**
- [ ] **Geracao de protocolo de matricula (PDF)**
- [ ] **Impressao de ficha de matricula (PDF)**

#### 1.2 Controle de Vagas
- [x] Capacidade maxima por turma
- [x] Visualizacao de vagas disponiveis por escola
- [x] Dashboard de vagas por escola (com ocupacao, PCD, turmas lotadas)
- [x] Fila de espera (status AGUARDANDO_VAGA)
- [ ] **Alertas automaticos de turmas lotadas**
- [ ] **Redistribuicao automatica sugerida**

#### 1.3 Regras Especiais PCD
- [x] Campo de necessidades especiais
- [x] Limite PCD configuravel por turma
- [x] Visualizacao de vagas PCD disponiveis
- [ ] **Relatorios de alunos PCD por escola**
- [ ] **Indicacao de recursos de acessibilidade**

#### 1.4 Cadastro Completo de Alunos
- [x] Dados pessoais basicos
- [x] Dados do responsavel
- [x] Upload de documentos (foto, RG, CPF, comprovante, certidao, historico)
- [x] Dados de saude (tipo sanguineo, alergias, medicamentos, condicoes, plano, SUS)
- [x] Contatos de emergencia (nome, telefone, parentesco)
- [x] Autorizacoes (imagem, saida)
- [x] Visualizacao detalhada (AlunoDetails) com todas as secoes
- [ ] **Historico de matriculas anteriores**

#### 1.5 Historico Escolar Digital
- [ ] Registro de anos anteriores
- [ ] Notas e conceitos por disciplina
- [ ] Frequencia historica
- [ ] Ocorrencias disciplinares
- [ ] Transferencias (entrada/saida) - parcialmente implementado
- [ ] Geracao de historico em PDF

### Tarefas Pendentes - Modulo 1

```
ALTA PRIORIDADE:
[ ] Implementar geracao de PDF (ficha de matricula, declaracao)
[ ] Criar relatorios de alunos PCD por escola
[ ] Implementar historico de matriculas do aluno

MEDIA PRIORIDADE:
[ ] Criar endpoint POST /api/matriculas/portal (matricula publica)
[ ] Implementar notificacoes por email
[ ] Paginacao server-side nas listagens
```

---

## MODULO 2: GESTAO PEDAGOGICA

### Status Atual: ~40% Implementado

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
- [ ] **Deteccao de conflitos de horario**
- [ ] **Impressao de grade horaria**

#### 2.4 Frequencia Diaria
- [x] Modelo Frequencia no Prisma
- [x] Backend: CRUD + registro em lote por turma
- [x] FrequenciaManager.tsx (selecao turma/data, lista alunos, checkbox)
- [ ] **Calculo automatico de percentual de frequencia**
- [ ] **Alertas de infrequencia (< 75%)**
- [ ] **Relatorio de frequencia mensal**
- [ ] **Exportacao para Sistema Presenca (MEC)**

#### 2.5 Lancamento de Notas
- [x] Configuracao do sistema de avaliacao (nota/conceito, media minima, periodos)
- [x] CRUD de avaliacoes (prova, trabalho, atividade, participacao, recuperacao)
- [x] Lancamento de notas por disciplina (individual e em lote)
- [x] ConfiguracaoAvaliacaoManager.tsx
- [x] NotasManager.tsx
- [x] BoletimDigital.tsx
- [ ] **Calculo automatico de medias (aritmetica/ponderada)**
- [ ] **Recuperacao paralela**
- [ ] **Recuperacao final**
- [ ] **Conselho de classe (aprovacao/reprovacao)**

#### 2.6 Acompanhamento de Aprendizagens
- [ ] Registro de desenvolvimento por habilidade
- [ ] Observacoes pedagogicas
- [ ] Planos de intervencao
- [ ] Relatorios de evolucao
- [ ] Comparativo turma/escola/rede

#### 2.7 Planejamento Pedagogico
- [ ] Planos de curso anuais
- [ ] Planos de aula semanais
- [ ] Banco de atividades
- [ ] Objetivos de aprendizagem (BNCC)

### Tarefas Pendentes - Modulo 2

```
ALTA PRIORIDADE:
[ ] Implementar calculo automatico de medias no boletim
[ ] Implementar percentual de frequencia por aluno
[ ] Alertas de infrequencia (< 75%)
[ ] Melhorar BoletimDigital com medias calculadas

MEDIA PRIORIDADE:
[ ] Deteccao de conflitos de grade horaria
[ ] Relatorio de frequencia mensal
[ ] Conselho de classe
```

---

## MODULO 3: PORTAIS DE ACESSO

### Status Atual: 0% Implementado

### Submodulos

#### 3.1 Portal do Professor
- [ ] Dashboard com turmas atribuidas
- [ ] Acesso rapido a chamada diaria
- [ ] Lancamento de notas
- [ ] Lista de alunos por turma
- [ ] Notificacoes e avisos

#### 3.2 Portal do Aluno/Responsavel
- [ ] Visualizacao de notas / boletim digital
- [ ] Frequencia acumulada
- [ ] Calendario escolar
- [ ] Comunicados da escola
- [ ] Atualizacao de dados cadastrais

#### 3.3 Portal do Diretor
- [ ] Dashboard de indicadores (alunos, frequencia, desempenho)
- [ ] Gestao de turmas e professores
- [ ] Relatorios gerenciais
- [ ] Infraestrutura da escola

#### 3.4 Portal da Secretaria
- [ ] Emissao de declaracoes e historicos
- [ ] Gestao de transferencias
- [ ] Arquivo digital
- [ ] Impressao de documentos

#### 3.5 Portal da SEMEC
- [ ] Dashboard geral da rede
- [ ] Indicadores por escola
- [ ] Comparativos
- [ ] Exportacao para Censo Escolar

### Tarefas Tecnicas - Modulo 3
```
[ ] Implementar sistema de roles completo (ADMIN, SEMEC, DIRETOR, COORDENADOR, SECRETARIA, PROFESSOR, RESPONSAVEL)
[ ] Criar layouts especificos por portal
[ ] Implementar middleware de autorizacao por role
[ ] Criar dashboards personalizados por perfil
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

## PROXIMOS PASSOS - SESSAO ATUAL

### PRIORIDADE 1: Consolidar Modulo Pedagogico (impacto alto)
```
1. [ ] Melhorar OverviewTab com graficos (Recharts) - indicadores visuais
2. [ ] Implementar calculo de medias no BoletimDigital
3. [ ] Calcular percentual de frequencia por aluno
4. [ ] Alertas visuais de infrequencia (< 75%)
```

### PRIORIDADE 2: Relatorios e PDF (valor para usuario final)
```
1. [ ] Implementar geracao de PDF com @react-pdf/renderer
   - Ficha de matricula
   - Declaracao de matricula
   - Boletim escolar
2. [ ] Relatorio de alunos PCD por escola
3. [ ] Relatorio de matriculas por escola/etapa
```

### PRIORIDADE 3: Dashboard e Visualizacoes
```
1. [ ] Instalar Recharts
2. [ ] Graficos no OverviewTab:
   - Matriculas por escola (bar chart)
   - Distribuicao por etapa (pie chart)
   - Evolucao mensal (line chart)
   - Status de matriculas (donut)
3. [ ] Indicadores de frequencia por escola
```

### PRIORIDADE 4: Paginacao e Performance
```
1. [ ] Paginacao server-side (ja tem backend com findAllPaginated)
2. [ ] Conectar frontend com endpoints paginados
3. [ ] Skeleton loaders em todas operacoes
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
      OverviewTab.tsx      # Aba Visao Geral
      enrollment/          # 15+ componentes de gestao
    hooks/useApi.ts        # React Query hooks
    lib/api.ts             # API client tipado
```

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

### Semana 1-2: Consolidacao (EM ANDAMENTO)
- [x] Finalizar campos de matricula (saude, emergencia)
- [x] Implementar busca/filtros em todas listagens
- [x] Grade horaria frontend
- [x] Calendario com alerta 200 dias
- [ ] Dashboard com graficos (Recharts)
- [ ] Geracao de PDFs basicos

### Semana 3-4: Pedagogico Completo
- [ ] Calculo de medias no boletim
- [ ] Percentual de frequencia
- [ ] Relatorios de frequencia mensal
- [ ] Conselho de classe basico

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
