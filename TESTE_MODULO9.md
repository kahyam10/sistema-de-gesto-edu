# Teste do Módulo 9: Comunicação e Gestão

## Status dos Serviços

✅ **Backend**: http://localhost:3333
✅ **Frontend**: http://localhost:3000
✅ **Swagger**: http://localhost:3333/docs
✅ **Prisma Studio**: http://localhost:5555

## Funcionalidades do Módulo 9

1. **Plantão Pedagógico** - Agendamento e controle de atendimentos aos pais
2. **Reuniões** - Gestão de reuniões pedagógicas e administrativas
3. **Comunicados** - Sistema de avisos e comunicações para escolas
4. **Notificações** - Alertas e notificações multicanal para usuários

## Guia de Teste via Swagger UI

### Preparação
1. Acesse: http://localhost:3333/docs
2. Clique em **"Authorize"** e cole o token JWT
3. Tenha em mãos:
   - ID de uma escola
   - ID de um profissional
   - ID de uma matrícula (para algumas notificações)

---

## 1. Plantão Pedagógico (`/api/plantao`)

### 1.1. Agendar Plantão
**Endpoint**: POST /api/plantao

```json
{
  "escolaId": "ID_DA_ESCOLA",
  "profissionalId": "ID_DO_PROFISSIONAL",
  "data": "2026-02-20",
  "horaInicio": "14:00",
  "horaFim": "18:00",
  "modalidade": "PRESENCIAL",
  "vagas": 10,
  "observacao": "Plantão quinzenal para atendimento aos pais"
}
```

**Modalidades**:
- PRESENCIAL
- ONLINE
- HIBRIDO

### 1.2. Registrar Atendimento
**Endpoint**: POST /api/plantao/{id}/atendimentos

```json
{
  "matriculaId": "ID_DA_MATRICULA",
  "responsavel": "Maria Silva - Mãe",
  "horaChegada": "14:30",
  "horaSaida": "15:00",
  "assuntos": ["DESEMPENHO_ACADEMICO", "COMPORTAMENTO"],
  "resumo": "Discussão sobre dificuldades em matemática. Acordado reforço escolar.",
  "encaminhamentos": "Encaminhar para acompanhamento pedagógico",
  "compareceu": true
}
```

**Assuntos disponíveis**:
- DESEMPENHO_ACADEMICO
- COMPORTAMENTO
- FREQUENCIA
- DIFICULDADE_APRENDIZAGEM
- RELACAO_SOCIAL
- SAUDE
- OUTRO

### 1.3. Listar Plantões
**Endpoint**: GET /api/plantao

**Filtros**:
- `escolaId`
- `profissionalId`
- `dataInicio` e `dataFim`
- `status`: AGENDADO | REALIZADO | CANCELADO
- `page`, `limit`

### 1.4. Cancelar Plantão
**Endpoint**: PATCH /api/plantao/{id}/cancelar

```json
{
  "motivo": "Profissional em licença médica - reagendar para próxima semana"
}
```

### 1.5. Relatório de Atendimentos
**Endpoint**: GET /api/plantao/{id}/relatorio

**Retorna**:
- Total de vagas
- Total de atendimentos realizados
- Taxa de comparecimento
- Principais assuntos tratados

---

## 2. Reuniões (`/api/reunioes`)

### 2.1. Agendar Reunião
**Endpoint**: POST /api/reunioes

```json
{
  "titulo": "Reunião Pedagógica - Fevereiro 2026",
  "tipo": "PEDAGOGICA",
  "data": "2026-02-25",
  "horaInicio": "19:00",
  "horaFim": "21:00",
  "local": "Auditório da Escola Municipal",
  "escolaId": "ID_DA_ESCOLA",
  "convocadoPor": "ID_DO_PROFISSIONAL",
  "pauta": [
    "1. Análise dos resultados do primeiro bimestre",
    "2. Planejamento de atividades para março",
    "3. Discussão sobre casos de busca ativa",
    "4. Outros assuntos"
  ],
  "participantesEsperados": 25,
  "obrigatorio": true
}
```

**Tipos de Reunião**:
- PEDAGOGICA
- ADMINISTRATIVA
- FORMACAO
- PAIS_MESTRES
- CONSELHO_CLASSE
- EXTRAORDINARIA

### 2.2. Registrar Presença
**Endpoint**: POST /api/reunioes/{id}/presenca

```json
{
  "participantes": [
    {
      "profissionalId": "ID_PROF_1",
      "presente": true,
      "horaChegada": "19:05"
    },
    {
      "profissionalId": "ID_PROF_2",
      "presente": false,
      "justificativa": "Licença médica"
    }
  ]
}
```

### 2.3. Registrar Ata
**Endpoint**: PATCH /api/reunioes/{id}/ata

```json
{
  "resumo": "Reunião realizada conforme pauta. Principais pontos discutidos...",
  "decisoes": [
    "Aprovado reforço escolar para turma do 3º ano",
    "Definido calendário de avaliações",
    "Criado grupo de trabalho para revisar projeto político pedagógico"
  ],
  "encaminhamentos": [
    {
      "responsavel": "ID_DO_PROFISSIONAL",
      "acao": "Elaborar cronograma de reforço escolar",
      "prazo": "2026-03-05"
    }
  ],
  "anexos": ["ata_assinada.pdf", "lista_presenca.pdf"]
}
```

### 2.4. Listar Reuniões
**Endpoint**: GET /api/reunioes

**Filtros**:
- `tipo`
- `escolaId`
- `status`: AGENDADA | REALIZADA | CANCELADA
- `dataInicio`, `dataFim`
- `page`, `limit`

### 2.5. Estatísticas de Participação
**Endpoint**: GET /api/reunioes/estatisticas

**Parâmetros**:
- `escolaId` (opcional)
- `profissionalId` (opcional)
- `periodo` (opcional): mes, bimestre, semestre, ano

**Retorna**:
- Taxa de participação por profissional
- Reuniões por tipo
- Taxa de cumprimento de encaminhamentos

---

## 3. Comunicados (`/api/comunicados`)

### 3.1. Criar Comunicado
**Endpoint**: POST /api/comunicados

```json
{
  "titulo": "Recesso Escolar - Carnaval 2026",
  "conteudo": "Informamos que não haverá aula nos dias 24/02 a 26/02/2026 devido ao feriado de Carnaval. Retorno normal dia 27/02.",
  "tipo": "AVISO",
  "prioridade": "MEDIA",
  "escolasDestino": ["ID_ESCOLA_1", "ID_ESCOLA_2"],
  "publicoAlvo": ["PROFESSORES", "PAIS", "COORDENADORES"],
  "dataPublicacao": "2026-02-15",
  "dataExpiracao": "2026-02-27",
  "exigeConfirmacao": false,
  "criadoPor": "ID_DO_ADMIN",
  "anexos": []
}
```

**Tipos de Comunicado**:
- AVISO
- CONVOCACAO
- INFORMATIVO
- URGENTE
- CAMPANHA

**Prioridades**:
- BAIXA
- MEDIA
- ALTA
- URGENTE

**Público-Alvo**:
- TODOS
- PROFESSORES
- COORDENADORES
- DIRETORES
- PAIS
- ALUNOS
- AUXILIARES

### 3.2. Listar Comunicados
**Endpoint**: GET /api/comunicados

**Filtros**:
- `tipo`
- `prioridade`
- `escolaId`
- `ativo`: true/false
- `page`, `limit`

### 3.3. Marcar como Lido
**Endpoint**: POST /api/comunicados/{id}/lido

```json
{
  "usuarioId": "ID_DO_USUARIO",
  "dataLeitura": "2026-02-15T10:30:00Z"
}
```

### 3.4. Confirmar Recebimento
**Endpoint**: POST /api/comunicados/{id}/confirmar

```json
{
  "usuarioId": "ID_DO_USUARIO",
  "confirmado": true,
  "observacao": "Ciente do comunicado"
}
```

**Obs**: Apenas para comunicados com `exigeConfirmacao: true`

### 3.5. Relatório de Alcance
**Endpoint**: GET /api/comunicados/{id}/relatorio

**Retorna**:
- Total de destinatários
- Total de leituras
- Total de confirmações
- Taxa de engajamento
- Lista de não leitores

---

## 4. Notificações (`/api/notificacoes`)

### 4.1. Criar Notificação
**Endpoint**: POST /api/notificacoes

```json
{
  "titulo": "Nova licença pendente de aprovação",
  "mensagem": "A licença médica de João Silva está aguardando sua aprovação",
  "tipo": "APROVACAO_PENDENTE",
  "destinatarioId": "ID_DO_USUARIO",
  "canais": ["APP", "EMAIL"],
  "prioridade": "ALTA",
  "dados": {
    "licencaId": "ID_DA_LICENCA",
    "linkAcao": "/licencas/ID_DA_LICENCA"
  },
  "expirarEm": "2026-02-20T23:59:59Z"
}
```

**Tipos de Notificação**:
- APROVACAO_PENDENTE
- TAREFA_ATRIBUIDA
- PRAZO_PROXIMO
- ALERTA_FREQUENCIA
- ALERTA_NOTA
- COMUNICADO_NOVO
- REUNIAO_AGENDADA
- LEMBRETE
- SISTEMA

**Canais Disponíveis**:
- APP (In-app notification)
- EMAIL
- SMS (se configurado)
- PUSH (se app mobile configurado)

**Prioridades**:
- BAIXA
- MEDIA
- ALTA
- CRITICA

### 4.2. Listar Notificações do Usuário
**Endpoint**: GET /api/notificacoes

**Filtros**:
- `lida`: true/false
- `tipo`
- `prioridade`
- `dataInicio`, `dataFim`
- `page`, `limit`

### 4.3. Marcar como Lida
**Endpoint**: PATCH /api/notificacoes/{id}/lida

```json
{
  "lida": true
}
```

### 4.4. Marcar Todas como Lidas
**Endpoint**: PATCH /api/notificacoes/marcar-todas-lidas

```json
{
  "usuarioId": "ID_DO_USUARIO"
}
```

### 4.5. Excluir Notificação
**Endpoint**: DELETE /api/notificacoes/{id}

### 4.6. Configurar Preferências
**Endpoint**: PATCH /api/notificacoes/preferencias

```json
{
  "usuarioId": "ID_DO_USUARIO",
  "canaisAtivos": ["APP", "EMAIL"],
  "tiposDesativados": ["LEMBRETE"],
  "silencioNoturno": {
    "ativo": true,
    "inicio": "22:00",
    "fim": "07:00"
  },
  "resumoDiario": true
}
```

---

## Checklist de Testes

### Plantão Pedagógico
- [ ] POST /api/plantao - Agendar plantão presencial
- [ ] POST /api/plantao - Agendar plantão online
- [ ] POST /api/plantao/{id}/atendimentos - Registrar atendimento
- [ ] GET /api/plantao - Listar plantões agendados
- [ ] GET /api/plantao?status=REALIZADO - Filtrar realizados
- [ ] PATCH /api/plantao/{id}/cancelar - Cancelar plantão
- [ ] GET /api/plantao/{id}/relatorio - Gerar relatório

### Reuniões
- [ ] POST /api/reunioes - Agendar reunião pedagógica
- [ ] POST /api/reunioes - Agendar reunião de pais e mestres
- [ ] POST /api/reunioes/{id}/presenca - Registrar presença
- [ ] PATCH /api/reunioes/{id}/ata - Registrar ata
- [ ] GET /api/reunioes - Listar reuniões
- [ ] GET /api/reunioes?tipo=PEDAGOGICA - Filtrar por tipo
- [ ] GET /api/reunioes/estatisticas - Ver estatísticas

### Comunicados
- [ ] POST /api/comunicados - Criar aviso geral
- [ ] POST /api/comunicados - Criar comunicado urgente
- [ ] GET /api/comunicados - Listar comunicados ativos
- [ ] GET /api/comunicados?prioridade=ALTA - Filtrar por prioridade
- [ ] POST /api/comunicados/{id}/lido - Marcar como lido
- [ ] POST /api/comunicados/{id}/confirmar - Confirmar leitura
- [ ] GET /api/comunicados/{id}/relatorio - Relatório de alcance

### Notificações
- [ ] POST /api/notificacoes - Criar notificação de aprovação
- [ ] POST /api/notificacoes - Criar alerta de frequência
- [ ] GET /api/notificacoes - Listar notificações não lidas
- [ ] GET /api/notificacoes?tipo=ALERTA_FREQUENCIA - Filtrar por tipo
- [ ] PATCH /api/notificacoes/{id}/lida - Marcar como lida
- [ ] PATCH /api/notificacoes/marcar-todas-lidas - Marcar todas
- [ ] PATCH /api/notificacoes/preferencias - Configurar preferências
- [ ] DELETE /api/notificacoes/{id} - Excluir notificação

---

## Cenários de Teste Integrados

### Cenário 1: Fluxo Completo de Plantão
1. Criar plantão para próxima semana
2. Registrar 3 atendimentos com diferentes assuntos
3. Gerar relatório do plantão
4. Verificar estatísticas

### Cenário 2: Fluxo Completo de Reunião
1. Agendar reunião pedagógica
2. Registrar presença de 10 participantes
3. Registrar ata com decisões
4. Criar encaminhamentos
5. Gerar estatísticas de participação

### Cenário 3: Comunicado com Confirmação
1. Criar comunicado urgente exigindo confirmação
2. Enviar para todas as escolas
3. Marcar como lido (simulando 5 usuários)
4. Confirmar leitura (simulando 3 usuários)
5. Gerar relatório de alcance

### Cenário 4: Sistema de Notificações
1. Criar notificação de alta prioridade
2. Listar notificações não lidas
3. Marcar como lida
4. Configurar preferências de canal
5. Testar silêncio noturno

---

**Data**: 2026-02-15
**Status**: Aguardando testes ⏳
**Método**: Testes manuais via Swagger UI
**Prioridade**: Teste integrado recomendado
