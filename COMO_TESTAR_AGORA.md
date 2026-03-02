# 🚀 Como Testar AGORA - Guia Rápido

## ⚡ Início Rápido (5 minutos)

### Passo 1: Abrir Prisma Studio para Obter IDs
1. Acesse: http://localhost:5555
2. Clique em **"Profissional"** na sidebar esquerda
3. **COPIE** o ID da primeira linha (exemplo: `cmln23uu9001cisumabcd1234`)
4. Deixe esta aba aberta

### Passo 2: Abrir Swagger UI
1. Nova aba: http://localhost:3333/docs
2. Localize o endpoint **POST /api/auth/login**
3. Clique em **"Try it out"**
4. Cole este JSON:
```json
{
  "email": "admin@ibirapitanga.ba.gov.br",
  "password": "admin123"
}
```
5. Clique **"Execute"**
6. **COPIE** o valor de `token` da resposta (longo texto começando com "eyJ...")

### Passo 3: Autorizar no Swagger
1. Clique no botão verde **"Authorize"** (cadeado no topo direito)
2. Cole o token no campo que aparece
3. Clique **"Authorize"**
4. Clique **"Close"**

---

## 🎯 Teste #1: Criar Registro de Ponto (2 minutos)

### No Swagger UI:

1. **Localize**: `POST /api/ponto` (seção "Ponto Digital")
2. Clique em **"Try it out"**
3. Cole este JSON (substitua `SEU_ID_PROFISSIONAL` pelo ID que copiou):

```json
{
  "profissionalId": "SEU_ID_PROFISSIONAL",
  "data": "2026-02-15",
  "tipoRegistro": "NORMAL",
  "entrada": "08:00",
  "saida": "17:00",
  "observacao": "Teste de registro de ponto"
}
```

4. Clique **"Execute"**
5. **RESULTADO ESPERADO**:
   - Status: `201 Created`
   - Resposta JSON com `id`, `status: "PENDENTE"`, etc.

### ✅ Se deu certo:
- Copie o `id` do ponto criado
- Vá para **Passo 4** (Listar Pontos)

### ❌ Se deu erro:
- Verifique se o ID do profissional está correto
- Verifique se a data está no formato correto (YYYY-MM-DD)
- Confira se está autorizado (token válido)

---

## 🎯 Teste #2: Listar Registros de Ponto (1 minuto)

1. **Localize**: `GET /api/ponto`
2. Clique em **"Try it out"**
3. Deixe os filtros vazios (ou preencha se quiser filtrar)
4. Clique **"Execute"**
5. **RESULTADO ESPERADO**:
   - Status: `200 OK`
   - Array com o ponto que você criou

---

## 🎯 Teste #3: Criar Solicitação de Licença (2 minutos)

1. **Localize**: `POST /api/licencas` (seção "Licenças")
2. Clique em **"Try it out"**
3. Cole este JSON (substitua `SEU_ID_PROFISSIONAL`):

```json
{
  "profissionalId": "SEU_ID_PROFISSIONAL",
  "tipo": "MEDICA",
  "dataInicio": "2026-02-20",
  "dataFim": "2026-02-25",
  "diasCorridos": 6,
  "motivo": "Teste de solicitação de licença médica"
}
```

4. Clique **"Execute"**
5. **RESULTADO ESPERADO**:
   - Status: `201 Created`
   - Resposta com `id`, `status: "PENDENTE"`, etc.

---

## 🎯 Teste #4: Listar Licenças (1 minuto)

1. **Localize**: `GET /api/licencas`
2. Clique em **"Try it out"**
3. Em "status", selecione: `PENDENTE`
4. Clique **"Execute"**
5. **RESULTADO ESPERADO**:
   - Status: `200 OK`
   - Sua licença criada aparece na lista

---

## 🎯 Teste #5: Aprovar Licença (2 minutos)

1. Copie o `id` da licença que você criou
2. **Localize**: `PATCH /api/licencas/{id}/status`
3. Clique em **"Try it out"**
4. Cole o ID da licença no campo `id`
5. Cole este JSON (substitua `SEU_ID_ADMIN` pelo ID do usuário admin: `cmln23unb0000isumnxuf5c0z`):

```json
{
  "status": "APROVADA",
  "observacao": "Aprovada para teste",
  "aprovadaPor": "cmln23unb0000isumnxuf5c0z"
}
```

6. Clique **"Execute"**
7. **RESULTADO ESPERADO**:
   - Status: `200 OK`
   - Licença com `status: "APROVADA"`

---

## 📊 Checklist Rápido

Execute estes 5 testes acima e marque:

- [ ] ✅ Criar registro de ponto
- [ ] ✅ Listar registros de ponto
- [ ] ✅ Criar solicitação de licença
- [ ] ✅ Listar licenças
- [ ] ✅ Aprovar licença

**Se todos passarem**: ✅ Módulo 4 está funcionando!

---

## 🔍 Verificar Dados Salvos

Após os testes, volte ao Prisma Studio (http://localhost:5555):

1. Clique em **"Ponto"** → veja seu registro de ponto
2. Clique em **"Licenca"** → veja sua licença aprovada

---

## 🆘 Troubleshooting Rápido

### "Unauthorized" ou "Token inválido"
**Solução**: Refazer Passos 2 e 3 (novo login + authorize)

### "Profissional não encontrado"
**Solução**: Voltar ao Prisma Studio e copiar ID correto

### "Validation error"
**Solução**: Verificar se o JSON está exatamente como nos exemplos

### Outro erro
**Solução**:
1. Verifique logs do backend (terminal onde rodou `npm run dev`)
2. Copie a mensagem de erro completa
3. Verifique se o campo está escrito corretamente

---

## 🎉 Próximos Passos

Após completar estes 5 testes básicos:

1. **Teste mais endpoints**: Use [TESTE_MODULO4.md](./TESTE_MODULO4.md) para checklist completo
2. **Teste Módulo 5**: Siga [TESTE_MODULO5.md](./TESTE_MODULO5.md)
3. **Teste Módulo 9**: Siga [TESTE_MODULO9.md](./TESTE_MODULO9.md)

---

## 📌 IDs de Referência

**Admin User ID**: `cmln23unb0000isumnxuf5c0z`

**Token atual** (válido até renovar):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtbG4yM3VuYjAwMDBpc3Vtbnh1ZjVjMHoiLCJlbWFpbCI6ImFkbWluQGliaXJhcGl0YW5nYS5iYS5nb3YuYnIiLCJub21lIjoiQWRtaW5pc3RyYWRvciBTRU1FQyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc3MTEzMzEyMX0.GWJB-NGE2npixw2ZBaXB6s7GnXmHCNQ6ll0lEu-VOQ0
```

---

**Tempo estimado total**: 10-15 minutos
**Dificuldade**: Fácil ⭐
**Pré-requisitos**: Navegador web

**BOA SORTE! 🚀**
