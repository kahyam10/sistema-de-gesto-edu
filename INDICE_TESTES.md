# Índice de Testes - Sistema de Gestão Educacional

## 📊 Visão Geral

Este documento organiza todos os testes dos módulos implementados do Sistema de Gestão Educacional de Ibirapitanga-BA.

---

## 🎯 Status dos Módulos

| Módulo | Status | Progresso | Documento de Teste |
|--------|--------|-----------|-------------------|
| Módulo 1-3 (Core) | ✅ Implementado | 100% | Testes básicos via Swagger |
| **Módulo 4 (RH)** | ⏳ Em Teste | 0% | [TESTE_MODULO4.md](./TESTE_MODULO4.md) |
| **Módulo 5 (Programas)** | 📝 Aguardando | 0% | [TESTE_MODULO5.md](./TESTE_MODULO5.md) |
| Módulo 6 (Transporte) | 🔜 Pendente | 0% | - |
| Módulo 7 (Alimentação) | 🔜 Pendente | 0% | - |
| Módulo 8 (Patrimônio) | 🔜 Pendente | 0% | - |
| **Módulo 9 (Comunicação)** | 📝 Aguardando | 0% | [TESTE_MODULO9.md](./TESTE_MODULO9.md) |

**Progresso Geral**: 67% (6/9 módulos)

---

## 📚 Guias de Teste Disponíveis

### 1. [Módulo 4 - Ponto Digital e Licenças](./TESTE_MODULO4.md)

**Funcionalidades**:
- ⏰ Ponto Digital (registro de entrada/saída)
- 📄 Licenças (solicitação, aprovação, relatórios)

**Endpoints**: 10+ endpoints
**Status**: ⏳ Testes iniciados

**Checklist**:
- [ ] CRUD de Ponto Digital (0/4)
- [ ] CRUD de Licenças (0/4)
- [ ] Relatórios (0/2)

---

### 2. [Módulo 5 - Programas Especiais](./TESTE_MODULO5.md)

**Funcionalidades**:
- 🔍 Busca Ativa (alunos fora da escola)
- ♿ AEE (Atendimento Educacional Especializado)
- 📖 Acompanhamento Pedagógico

**Endpoints**: 15+ endpoints
**Status**: 📝 Aguardando teste

**Checklist**:
- [ ] Busca Ativa (0/8)
- [ ] AEE (0/7)
- [ ] Acompanhamento Pedagógico (0/7)

---

### 3. [Módulo 9 - Comunicação e Gestão](./TESTE_MODULO9.md)

**Funcionalidades**:
- 📅 Plantão Pedagógico
- 🤝 Reuniões
- 📢 Comunicados
- 🔔 Notificações

**Endpoints**: 20+ endpoints
**Status**: 📝 Aguardando teste

**Checklist**:
- [ ] Plantão Pedagógico (0/7)
- [ ] Reuniões (0/7)
- [ ] Comunicados (0/7)
- [ ] Notificações (0/8)

---

## 🔧 Ambiente de Testes

### Serviços Ativos

| Serviço | URL | Status |
|---------|-----|--------|
| Backend API | http://localhost:3333 | ✅ Ativo |
| Frontend | http://localhost:3000 | ✅ Ativo |
| Swagger UI | http://localhost:3333/docs | ✅ Ativo |
| Prisma Studio | http://localhost:5555 | ✅ Ativo |

### Credenciais de Teste

**Admin SEMEC**:
- Email: `admin@ibirapitanga.ba.gov.br`
- Senha: `admin123`

**Token JWT** (válido por 24h):
```
Obter via: POST /api/auth/login
```

---

## 📋 Metodologia de Teste

### 1. Preparação
- ✅ Backend rodando (porta 3333)
- ✅ Frontend rodando (porta 3000)
- ✅ Banco de dados populado (seed executado)
- ✅ Token JWT obtido

### 2. Execução
- **Ferramenta principal**: Swagger UI
- **Ferramenta auxiliar**: Prisma Studio (visualizar dados)
- **Método**: Testes manuais endpoint por endpoint

### 3. Documentação
- Cada teste documentado com request/response
- Problemas encontrados registrados
- Checklist atualizado após cada teste

---

## 🚀 Como Executar os Testes

### Opção 1: Via Swagger UI (Recomendado)

1. **Acessar Swagger**: http://localhost:3333/docs
2. **Autenticar**:
   - Clicar em "Authorize"
   - Fazer login via POST /api/auth/login
   - Copiar token da resposta
   - Colar no campo "Value"
3. **Testar endpoints**:
   - Seguir guias específicos de cada módulo
   - Marcar checklist conforme avança

### Opção 2: Via Prisma Studio

1. **Acessar**: http://localhost:5555
2. **Visualizar dados**: Útil para conferir se os dados foram salvos
3. **Criar dados manualmente**: Alternativa ao Swagger

### Opção 3: Via Dashboard (Frontend)

1. **Acessar**: http://localhost:3000
2. **Login**: admin@ibirapitanga.ba.gov.br / admin123
3. **Testar CRUD**: Diretamente na interface

---

## 📝 Template de Registro de Teste

Para cada endpoint testado, registrar:

```markdown
### [MÉTODO] /api/endpoint

**Data**: 2026-02-15
**Testado por**: Nome

**Request**:
\`\`\`json
{
  // payload
}
\`\`\`

**Response**: [Código HTTP]
\`\`\`json
{
  // resposta
}
\`\`\`

**Resultado**: ✅ Sucesso / ❌ Falha
**Observações**: [Notas sobre o teste]
```

---

## 🐛 Problemas Conhecidos

### 1. Erro ao listar profissionais via curl
- **Endpoint**: `GET /api/profissionais`
- **Erro**: `{"error":"[object Object]"}`
- **Status**: 🔍 Investigando
- **Workaround**: Usar Swagger UI ou Prisma Studio

---

## 📅 Cronograma de Testes

| Data | Módulo | Responsável | Status |
|------|--------|-------------|--------|
| 2026-02-15 | Módulo 4 | Claude | ⏳ Em andamento |
| 2026-02-16 | Módulo 5 | - | 📝 Planejado |
| 2026-02-17 | Módulo 9 | - | 📝 Planejado |
| 2026-02-18 | Revisão | - | 📝 Planejado |

---

## ✅ Critérios de Aprovação

Para cada módulo ser considerado aprovado:

1. **CRUD Completo**: Todos os endpoints CRUD testados
2. **Filtros**: Todos os filtros funcionando
3. **Paginação**: Paginação operacional em listagens
4. **Validações**: Erros de validação retornando mensagens corretas
5. **Autenticação**: Proteção de rotas funcionando
6. **Relatórios**: Endpoints de relatórios retornando dados corretos

---

## 🔗 Links Úteis

- [Documentação da API (Swagger)](http://localhost:3333/docs)
- [Guia de Implementação](./GUIA_IMPLEMENTACAO.md)
- [Schema do Banco (Prisma)](./backend/prisma/schema.prisma)
- [Frontend - Dashboard](http://localhost:3000)

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verificar logs do backend (console onde `npm run dev` está rodando)
2. Verificar Prisma Studio para estado do banco
3. Consultar documentação Swagger
4. Reportar issue com detalhes do erro

---

**Última atualização**: 2026-02-15
**Versão**: 1.0
**Status**: Testes em andamento ⏳
