# Teste do Módulo 4: Ponto Digital e Licenças

## Status dos Serviços

✅ **Backend**: http://localhost:3333
✅ **Frontend**: http://localhost:3000
✅ **Swagger**: http://localhost:3333/docs
✅ **Prisma Studio**: http://localhost:5555

## Autenticação

**Token válido obtido em**: 2026-02-15 01:39:34
**Usuário**: admin@ibirapitanga.ba.gov.br

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtbG4yM3VuYjAwMDBpc3Vtbnh1ZjVjMHoiLCJlbWFpbCI6ImFkbWluQGliaXJhcGl0YW5nYS5iYS5nb3YuYnIiLCJub21lIjoiQWRtaW5pc3RyYWRvciBTRU1FQyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc3MTEzMTk3NH0.4boUa0oH68h3UDo9b57fFcRd-iF_eS-Mt8-IzGEPMnA"
```

## Testes a Realizar

### 1. Ponto Digital (`/api/ponto`)

#### 1.1. Criar Registro de Ponto (POST)
- [ ] Criar registro de entrada
- [ ] Criar registro de saída
- [ ] Testar validação de campos obrigatórios
- [ ] Testar duplicação de registro

#### 1.2. Listar Registros (GET)
- [ ] Listar todos os pontos
- [ ] Filtrar por profissional
- [ ] Filtrar por data
- [ ] Testar paginação

#### 1.3. Aprovar/Rejeitar Ponto (PATCH)
- [ ] Aprovar registro
- [ ] Rejeitar registro
- [ ] Adicionar observação

#### 1.4. Relatórios
- [ ] Relatório mensal de frequência
- [ ] Relatório de inconsistências
- [ ] Estatísticas de presença

### 2. Licenças (`/api/licencas`)

#### 2.1. Criar Solicitação (POST)
- [ ] Solicitar licença médica
- [ ] Solicitar licença maternidade
- [ ] Solicitar férias
- [ ] Testar validação de período

#### 2.2. Listar Licenças (GET)
- [ ] Listar todas as licenças
- [ ] Filtrar por status (PENDENTE/APROVADA/REJEITADA)
- [ ] Filtrar por profissional
- [ ] Testar paginação

#### 2.3. Aprovar/Rejeitar Licença (PATCH)
- [ ] Aprovar licença
- [ ] Rejeitar licença com justificativa
- [ ] Cancelar licença aprovada

#### 2.4. Relatórios
- [ ] Licenças por período
- [ ] Licenças por tipo
- [ ] Profissionais afastados

## Dados de Exemplo

### Escola de Teste
- **ID**: `cmln23uu7000zisumr8vtiuth`
- **Nome**: Centro de Educação Infantil Criança Feliz
- **Código**: CEI001

### Profissionais
(Verificar IDs no Prisma Studio: http://localhost:5555)

## Comandos de Teste

### Listar Profissionais
```bash
curl -X GET "http://localhost:3333/api/profissionais" \
  -H "Authorization: Bearer $TOKEN"
```

### Criar Registro de Ponto
```bash
curl -X POST "http://localhost:3333/api/ponto" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profissionalId": "ID_DO_PROFISSIONAL",
    "data": "2026-02-15",
    "tipoRegistro": "NORMAL",
    "entrada": "08:00",
    "saida": "17:00",
    "observacao": "Jornada regular"
  }'
```

### Criar Solicitação de Licença
```bash
curl -X POST "http://localhost:3333/api/licencas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profissionalId": "ID_DO_PROFISSIONAL",
    "tipo": "MEDICA",
    "dataInicio": "2026-02-20",
    "dataFim": "2026-02-25",
    "diasCorridos": 5,
    "motivo": "Consulta médica e recuperação",
    "documentoAnexo": null
  }'
```

## Resultados

### ✅ Testes Aprovados

_(A preencher durante os testes)_

### ❌ Problemas Encontrados

#### 1. Erro ao listar profissionais via curl
- **Endpoint**: `GET /api/profissionais`
- **Erro**: `{"error":"[object Object]"}`
- **Possível causa**: Problema no middleware de tratamento de erros ou serialização
- **Workaround**: Usar Swagger UI ou Prisma Studio

## Observações

- ✅ Autenticação funcionando corretamente
- ✅ Endpoint de escolas funcionando
- ⚠️ Endpoint de profissionais retornando erro (investigar)
- 🔄 Testes em andamento...

## Guia de Teste via Swagger UI

### Passo 1: Acessar Swagger UI
Abra no navegador: http://localhost:3333/docs

### Passo 2: Autenticar
1. Clique no botão **"Authorize"** no topo da página
2. Cole o token JWT (fornecido acima)
3. Clique em **"Authorize"** e depois **"Close"**

### Passo 3: Obter ID de Profissional

**Opção A - Via Prisma Studio (Recomendado)**
1. Abra: http://localhost:5555
2. Clique em **"Profissional"** na sidebar
3. Copie o ID de um profissional (exemplo: primeira coluna)

**Opção B - Via Swagger**
1. Vá para o endpoint **GET /api/profissionais**
2. Clique em **"Try it out"**
3. Clique em **"Execute"**
4. Copie o `id` de um profissional na resposta

### Passo 4: Testar CRUD de Ponto Digital

#### 4.1. Criar Registro de Ponto
1. Vá para **POST /api/ponto**
2. Clique em **"Try it out"**
3. Cole o seguinte JSON (substitua `ID_DO_PROFISSIONAL`):
```json
{
  "profissionalId": "ID_DO_PROFISSIONAL",
  "data": "2026-02-15",
  "tipoRegistro": "NORMAL",
  "entrada": "08:00",
  "saida": "17:00",
  "observacao": "Registro teste - jornada regular"
}
```
4. Clique em **"Execute"**
5. Verifique resposta **201 Created**

#### 4.2. Listar Registros de Ponto
1. Vá para **GET /api/ponto**
2. Clique em **"Try it out"**
3. (Opcional) Adicione filtros:
   - `profissionalId`: ID do profissional
   - `dataInicio`: 2026-02-01
   - `dataFim`: 2026-02-28
4. Clique em **"Execute"**
5. Verifique se o registro criado aparece na lista

#### 4.3. Aprovar Registro de Ponto
1. Copie o `id` de um registro de ponto (da listagem anterior)
2. Vá para **PATCH /api/ponto/{id}/status**
3. Cole o ID no campo `id`
4. Clique em **"Try it out"**
5. Cole o JSON:
```json
{
  "status": "APROVADO",
  "observacao": "Registro aprovado - sem inconsistências"
}
```
6. Clique em **"Execute"**

#### 4.4. Testar Relatório Mensal
1. Vá para **GET /api/ponto/relatorios/mensal**
2. Clique em **"Try it out"**
3. Preencha:
   - `mes`: 2
   - `ano`: 2026
   - `profissionalId`: (opcional) ID do profissional
4. Clique em **"Execute"**

### Passo 5: Testar CRUD de Licenças

#### 5.1. Criar Solicitação de Licença
1. Vá para **POST /api/licencas**
2. Clique em **"Try it out"**
3. Cole o JSON (substitua `ID_DO_PROFISSIONAL`):
```json
{
  "profissionalId": "ID_DO_PROFISSIONAL",
  "tipo": "MEDICA",
  "dataInicio": "2026-02-20",
  "dataFim": "2026-02-25",
  "diasCorridos": 6,
  "motivo": "Consulta médica e recuperação - Teste",
  "documentoAnexo": null
}
```
4. Clique em **"Execute"**
5. Verifique resposta **201 Created**

#### 5.2. Listar Licenças
1. Vá para **GET /api/licencas**
2. Clique em **"Try it out"**
3. (Opcional) Adicione filtros:
   - `status`: PENDENTE
   - `page`: 1
   - `limit`: 20
4. Clique em **"Execute"**

#### 5.3. Aprovar Licença
1. Copie o `id` de uma licença PENDENTE
2. Vá para **PATCH /api/licencas/{id}/status**
3. Cole o ID no campo `id`
4. Clique em **"Try it out"**
5. Cole o JSON (substitua `ID_DO_ADMIN`):
```json
{
  "status": "APROVADA",
  "observacao": "Licença aprovada - documentação em ordem",
  "aprovadaPor": "ID_DO_ADMIN"
}
```
6. Clique em **"Execute"**

#### 5.4. Testar Relatório de Licenças
1. Vá para **GET /api/licencas/relatorios/resumo**
2. Clique em **"Try it out"**
3. Preencha (opcionais):
   - `dataInicio`: 2026-02-01
   - `dataFim`: 2026-02-28
4. Clique em **"Execute"**

## Checklist de Testes

### Ponto Digital
- [ ] POST /api/ponto - Criar registro de entrada
- [ ] POST /api/ponto - Criar registro de saída
- [ ] GET /api/ponto - Listar todos os registros
- [ ] GET /api/ponto?profissionalId=X - Filtrar por profissional
- [ ] GET /api/ponto?dataInicio=X&dataFim=Y - Filtrar por período
- [ ] GET /api/ponto?page=1&limit=20 - Testar paginação
- [ ] PATCH /api/ponto/{id}/status - Aprovar registro
- [ ] PATCH /api/ponto/{id}/status - Rejeitar registro
- [ ] GET /api/ponto/relatorios/mensal - Relatório mensal
- [ ] GET /api/ponto/inconsistencias - Listar inconsistências

### Licenças
- [ ] POST /api/licencas - Solicitar licença médica
- [ ] POST /api/licencas - Solicitar licença maternidade
- [ ] POST /api/licencas - Solicitar férias
- [ ] GET /api/licencas - Listar todas
- [ ] GET /api/licencas?status=PENDENTE - Filtrar por status
- [ ] GET /api/licencas?page=1&limit=20 - Testar paginação
- [ ] PATCH /api/licencas/{id}/status - Aprovar licença
- [ ] PATCH /api/licencas/{id}/status - Rejeitar licença
- [ ] PATCH /api/licencas/{id}/cancelar - Cancelar licença
- [ ] GET /api/licencas/relatorios/resumo - Relatório resumo

## Próximos Passos

1. ✅ Verificar profissionais no Prisma Studio (http://localhost:5555)
2. ⏳ Criar registros de ponto via Swagger UI
3. ⏳ Criar solicitações de licença
4. ⏳ Testar aprovação/rejeição
5. ⏳ Validar relatórios

---
**Data do teste**: 2026-02-15
**Responsável**: Claude Code
**Status**: Em andamento ⏳
**Método**: Testes manuais via Swagger UI (http://localhost:3333/docs)
