# Teste do Módulo 5: Programas Especiais

## Status dos Serviços

✅ **Backend**: http://localhost:3333
✅ **Frontend**: http://localhost:3000
✅ **Swagger**: http://localhost:3333/docs
✅ **Prisma Studio**: http://localhost:5555

## Programas Incluídos no Módulo 5

1. **Busca Ativa** - Identificação e acompanhamento de alunos fora da escola
2. **AEE (Atendimento Educacional Especializado)** - Apoio a alunos com necessidades especiais
3. **Acompanhamento Pedagógico** - Monitoramento de alunos com dificuldades

## Guia de Teste via Swagger UI

### Preparação
1. Acesse: http://localhost:3333/docs
2. Clique em **"Authorize"** e cole o token JWT
3. Tenha em mãos:
   - ID de uma matrícula (obter em Prisma Studio ou GET /api/matriculas)
   - ID de um profissional responsável

---

## 1. Busca Ativa (`/api/busca-ativa`)

### 1.1. Criar Caso de Busca Ativa
**Endpoint**: POST /api/busca-ativa

```json
{
  "matriculaId": "ID_DA_MATRICULA",
  "motivo": "EVASAO",
  "descricao": "Aluno faltou 15 dias consecutivos sem justificativa",
  "responsavelId": "ID_DO_PROFISSIONAL",
  "prioridade": "ALTA"
}
```

**Campos obrigatórios**:
- `matriculaId`: ID da matrícula do aluno
- `motivo`: EVASAO | FALTA_FREQUENTE | RISCO_ABANDONO | TRANSFERENCIA
- `responsavelId`: ID do profissional responsável

### 1.2. Registrar Visita Domiciliar
**Endpoint**: POST /api/busca-ativa/{id}/visitas

```json
{
  "dataVisita": "2026-02-15",
  "realizadaPor": "ID_DO_PROFISSIONAL",
  "alunoEncontrado": true,
  "situacaoEncontrada": "Aluno em casa, família desconhece importância da escola",
  "acordosFirmados": "Pais concordaram em retornar o aluno segunda-feira",
  "proximaAcao": "Acompanhar retorno do aluno na próxima semana"
}
```

### 1.3. Listar Casos
**Endpoint**: GET /api/busca-ativa

**Filtros disponíveis**:
- `status`: ATIVO | RESOLVIDO | ENCERRADO
- `motivo`: EVASAO | FALTA_FREQUENTE | etc
- `prioridade`: BAIXA | MEDIA | ALTA
- `page` e `limit`: paginação

### 1.4. Encaminhar Caso
**Endpoint**: POST /api/busca-ativa/{id}/encaminhar

```json
{
  "orgao": "CONSELHO_TUTELAR",
  "motivo": "Caso de possível negligência familiar",
  "documentosAnexos": ["relatorio_visitas.pdf"]
}
```

**Opções de órgão**:
- CONSELHO_TUTELAR
- ASSISTENCIA_SOCIAL
- SAUDE
- MINISTERIO_PUBLICO

### 1.5. Alterar Status
**Endpoint**: PATCH /api/busca-ativa/{id}/status

```json
{
  "status": "RESOLVIDO",
  "observacao": "Aluno retornou às aulas regularmente"
}
```

---

## 2. AEE - Atendimento Educacional Especializado (`/api/aee`)

### 2.1. Criar Atendimento AEE
**Endpoint**: POST /api/aee

```json
{
  "matriculaId": "ID_DA_MATRICULA",
  "tipoDeficiencia": "INTELECTUAL",
  "descricaoNecessidade": "Deficiência intelectual leve - necessita adaptação de materiais",
  "profissionalResponsavelId": "ID_DO_PROFISSIONAL",
  "frequenciaSemanal": 2,
  "duracaoAtendimento": 60
}
```

**Tipos de Deficiência**:
- FISICA
- VISUAL
- AUDITIVA
- INTELECTUAL
- MULTIPLA
- AUTISMO
- SUPERDOTACAO

### 2.2. Registrar Evolução do Aluno
**Endpoint**: POST /api/aee/{id}/evolucoes

```json
{
  "data": "2026-02-15",
  "atividades": "Trabalho com números e cores, jogo de encaixe adaptado",
  "progresso": "Demonstrou melhora na coordenação motora fina",
  "dificuldades": "Ainda apresenta dificuldade em concentração prolongada",
  "proximasAcoes": "Introduzir atividades de 20min com pausas",
  "participacaoFamilia": "Mãe participou da sessão e relatou progressos em casa"
}
```

### 2.3. Listar Atendimentos
**Endpoint**: GET /api/aee

**Filtros**:
- `tipoDeficiencia`
- `status`: ATIVO | ENCERRADO | SUSPENSO
- `profissionalId`
- `page`, `limit`

### 2.4. Relatório de Acompanhamento
**Endpoint**: GET /api/aee/{id}/relatorio

**Retorna**:
- Dados do aluno
- Histórico de evoluções
- Gráfico de progresso
- Recomendações

---

## 3. Acompanhamento Pedagógico (`/api/acompanhamento`)

### 3.1. Criar Acompanhamento
**Endpoint**: POST /api/acompanhamento

```json
{
  "matriculaId": "ID_DA_MATRICULA",
  "tipo": "DIFICULDADE_APRENDIZAGEM",
  "area": "MATEMATICA",
  "descricao": "Aluno apresenta dificuldade em operações básicas de adição e subtração",
  "profissionalId": "ID_DO_PROFISSIONAL",
  "objetivos": "Melhorar compreensão de conceitos básicos de matemática"
}
```

**Tipos de Acompanhamento**:
- DIFICULDADE_APRENDIZAGEM
- COMPORTAMENTO
- FREQUENCIA
- SOCIOAFETIVO

**Áreas**:
- PORTUGUES
- MATEMATICA
- CIENCIAS
- HISTORIA_GEOGRAFIA
- TODAS

### 3.2. Registrar Evolução
**Endpoint**: POST /api/acompanhamento/{id}/evolucoes

```json
{
  "data": "2026-02-15",
  "atividadesRealizadas": "Exercícios de adição com material concreto (tampinhas)",
  "progresso": "Conseguiu realizar operações até 10 com apoio visual",
  "dificuldadesPersistentes": "Ainda confunde adição com subtração em problemas",
  "estrategias": "Usar cores diferentes para cada operação",
  "participacaoAluno": "ENGAJADO",
  "proximoEncontro": "2026-02-20"
}
```

**Níveis de Participação**:
- MUITO_ENGAJADO
- ENGAJADO
- POUCO_ENGAJADO
- RESISTENTE

### 3.3. Listar Acompanhamentos
**Endpoint**: GET /api/acompanhamento

**Filtros**:
- `tipo`
- `area`
- `status`: EM_ANDAMENTO | CONCLUIDO | SUSPENSO
- `profissionalId`
- `page`, `limit`

### 3.4. Encaminhar para Especialista
**Endpoint**: POST /api/acompanhamento/{id}/encaminhar

```json
{
  "especialidade": "PSICOLOGO",
  "motivo": "Necessita avaliação psicológica para possível dislexia",
  "urgencia": "MEDIA"
}
```

**Especialidades**:
- PSICOLOGO
- FONOAUDIOLOGO
- PSICOPEDAGOGO
- NEUROLOGISTA
- ASSISTENTE_SOCIAL

---

## Checklist de Testes

### Busca Ativa
- [ ] POST /api/busca-ativa - Criar caso de evasão
- [ ] POST /api/busca-ativa - Criar caso de falta frequente
- [ ] POST /api/busca-ativa/{id}/visitas - Registrar visita
- [ ] GET /api/busca-ativa - Listar casos ativos
- [ ] GET /api/busca-ativa?status=ATIVO - Filtrar por status
- [ ] POST /api/busca-ativa/{id}/encaminhar - Encaminhar ao Conselho Tutelar
- [ ] PATCH /api/busca-ativa/{id}/status - Resolver caso
- [ ] GET /api/busca-ativa/estatisticas - Estatísticas gerais

### AEE
- [ ] POST /api/aee - Criar atendimento para aluno com deficiência
- [ ] POST /api/aee/{id}/evolucoes - Registrar evolução
- [ ] GET /api/aee - Listar atendimentos ativos
- [ ] GET /api/aee?tipoDeficiencia=AUTISMO - Filtrar por tipo
- [ ] GET /api/aee/{id}/relatorio - Gerar relatório individual
- [ ] PATCH /api/aee/{id} - Atualizar plano de atendimento
- [ ] PATCH /api/aee/{id}/status - Encerrar atendimento

### Acompanhamento Pedagógico
- [ ] POST /api/acompanhamento - Criar acompanhamento (dificuldade matemática)
- [ ] POST /api/acompanhamento - Criar acompanhamento (comportamento)
- [ ] POST /api/acompanhamento/{id}/evolucoes - Registrar evolução
- [ ] GET /api/acompanhamento - Listar todos
- [ ] GET /api/acompanhamento?area=MATEMATICA - Filtrar por área
- [ ] POST /api/acompanhamento/{id}/encaminhar - Encaminhar para psicólogo
- [ ] GET /api/acompanhamento/relatorios/resumo - Relatório resumo

---

## IDs de Referência

### Motivos de Busca Ativa
- `EVASAO`: Aluno evadiu da escola
- `FALTA_FREQUENTE`: Frequência abaixo de 75%
- `RISCO_ABANDONO`: Aluno em situação de risco
- `TRANSFERENCIA`: Transferência não confirmada

### Status de Casos
- `ATIVO`: Caso em acompanhamento
- `RESOLVIDO`: Situação resolvida
- `ENCERRADO`: Caso encerrado

---

**Data**: 2026-02-15
**Status**: Aguardando testes ⏳
**Método**: Testes manuais via Swagger UI
