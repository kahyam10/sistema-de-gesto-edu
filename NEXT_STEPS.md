# 📋 Próximos Passos - Documentação Swagger API

**Última atualização:** 12 de Fevereiro de 2026

## ✅ Progresso Atual

### Documentação Swagger Completa (14/27 rotas)

**Módulo de Autenticação:**
- ✅ auth.routes.ts (3 endpoints)
  - POST /api/auth/register
  - POST /api/auth/login
  - GET /api/auth/me

**Módulo Acadêmico:**
- ✅ escolas.routes.ts
- ✅ turmas.routes.ts
- ✅ disciplinas.routes.ts
- ✅ salas.routes.ts

**Módulo Pedagógico:**
- ✅ grade-horaria.routes.ts
- ✅ frequencia.routes.ts
- ✅ avaliacoes.routes.ts
- ✅ notas.routes.ts
- ✅ calendario.routes.ts
- ✅ configuracao-avaliacao.routes.ts

**Módulo RH (Recursos Humanos):**
- ✅ profissionais.routes.ts
- ✅ pontos.routes.ts (7 endpoints - NOVO!)
  - GET /api/pontos - Listar registros de ponto
  - POST /api/pontos - Criar ponto manual
  - POST /api/pontos/registrar - Registrar ponto em tempo real
  - GET /api/pontos/:id - Buscar por ID
  - PUT /api/pontos/:id - Atualizar ponto
  - DELETE /api/pontos/:id - Remover ponto
  - GET /api/pontos/relatorio/:profissionalId/:mes/:ano - Relatório mensal

- ✅ licencas.routes.ts (9 endpoints - NOVO!)
  - GET /api/licencas - Listar licenças
  - POST /api/licencas - Solicitar licença
  - GET /api/licencas/:id - Buscar por ID
  - PUT /api/licencas/:id - Atualizar licença pendente
  - POST /api/licencas/:id/aprovar - Aprovar/rejeitar licença
  - POST /api/licencas/:id/cancelar - Cancelar licença
  - DELETE /api/licencas/:id - Remover licença
  - GET /api/licencas/status/ativas - Licenças ativas
  - GET /api/licencas/relatorio/:profissionalId - Relatório por profissional

---

## 🔄 Próximas Tarefas (13 rotas restantes)

### Prioridade 1: Módulo de Programas Especiais (3 rotas)

**1. acompanhamento.routes.ts**
Endpoints esperados:
- GET /api/acompanhamento - Listar acompanhamentos
- POST /api/acompanhamento - Criar acompanhamento
- GET /api/acompanhamento/:id - Buscar por ID
- PUT /api/acompanhamento/:id - Atualizar
- DELETE /api/acompanhamento/:id - Remover
- POST /api/acompanhamento/:id/evolucao - Registrar evolução
- POST /api/acompanhamento/:id/encaminhamento - Registrar encaminhamento
- GET /api/acompanhamento/matricula/:matriculaId - Por aluno
- GET /api/acompanhamento/estatisticas - Estatísticas

**2. aee.routes.ts (Atendimento Educacional Especializado)**
Endpoints esperados:
- GET /api/aee - Listar atendimentos
- POST /api/aee - Criar atendimento AEE
- GET /api/aee/:id - Buscar por ID
- PUT /api/aee/:id - Atualizar plano
- DELETE /api/aee/:id - Remover
- POST /api/aee/:id/evolucao - Registrar evolução
- GET /api/aee/matricula/:matriculaId - Por aluno
- GET /api/aee/escola/:escolaId - Por escola
- GET /api/aee/estatisticas - Estatísticas

**3. busca-ativa.routes.ts**
Endpoints esperados:
- GET /api/busca-ativa - Listar casos
- POST /api/busca-ativa - Criar caso
- GET /api/busca-ativa/:id - Buscar por ID
- PUT /api/busca-ativa/:id - Atualizar
- DELETE /api/busca-ativa/:id - Remover
- POST /api/busca-ativa/:id/visita - Registrar visita domiciliar
- POST /api/busca-ativa/:id/encaminhamento - Registrar encaminhamento
- GET /api/busca-ativa/escola/:escolaId - Por escola
- GET /api/busca-ativa/estatisticas - Estatísticas

---

### Prioridade 2: Módulo de Comunicação (4 rotas)

**4. plantao-pedagogico.routes.ts**
Endpoints esperados:
- GET /api/plantoes-pedagogicos - Listar plantões
- POST /api/plantoes-pedagogicos - Criar plantão
- GET /api/plantoes-pedagogicos/:id - Buscar por ID
- PUT /api/plantoes-pedagogicos/:id - Atualizar
- DELETE /api/plantoes-pedagogicos/:id - Remover
- GET /api/plantoes-pedagogicos/escola/:escolaId - Por escola
- GET /api/plantoes-pedagogicos/estatisticas - Estatísticas

**5. reuniao-pais.routes.ts**
Endpoints esperados:
- GET /api/reunioes-pais - Listar reuniões
- POST /api/reunioes-pais - Criar reunião
- GET /api/reunioes-pais/:id - Buscar por ID
- PUT /api/reunioes-pais/:id - Atualizar
- DELETE /api/reunioes-pais/:id - Remover
- POST /api/reunioes-pais/:id/presenca - Registrar presença
- GET /api/reunioes-pais/:id/presencas - Listar presenças
- DELETE /api/reunioes-pais/presenca/:id - Remover presença
- GET /api/reunioes-pais/estatisticas - Estatísticas

**6. comunicado.routes.ts**
Endpoints esperados:
- GET /api/comunicados - Listar comunicados
- POST /api/comunicados - Criar comunicado
- GET /api/comunicados/:id - Buscar por ID
- PUT /api/comunicados/:id - Atualizar
- DELETE /api/comunicados/:id - Remover
- PUT /api/comunicados/:id/lido - Marcar como lido
- PUT /api/comunicados/:id/confirmar - Confirmar recebimento
- GET /api/comunicados/user/:userId - Por usuário
- GET /api/comunicados/estatisticas - Estatísticas

**7. notificacao.routes.ts**
Endpoints esperados:
- GET /api/notificacoes - Listar notificações
- POST /api/notificacoes - Criar notificação
- POST /api/notificacoes/bulk - Criar em massa
- GET /api/notificacoes/:id - Buscar por ID
- GET /api/notificacoes/user/:userId - Por usuário
- PUT /api/notificacoes/:id/lida - Marcar como lida
- PUT /api/notificacoes/user/:userId/todas-lidas - Marcar todas como lidas
- DELETE /api/notificacoes/:id - Remover
- DELETE /api/notificacoes/user/:userId/lidas - Remover lidas
- GET /api/notificacoes/user/:userId/count - Contar não lidas
- PUT /api/notificacoes/:id/status-envio - Atualizar status de envio
- GET /api/notificacoes/estatisticas - Estatísticas

---

### Prioridade 3: Módulo de Cadastros (3 rotas)

**8. matriculas.routes.ts**
**IMPORTANTE:** Este arquivo já tem documentação parcial. Verificar e completar.

**9. etapas.routes.ts**
Endpoints esperados:
- GET /api/etapas - Listar etapas
- POST /api/etapas - Criar etapa
- GET /api/etapas/:id - Buscar por ID
- PUT /api/etapas/:id - Atualizar
- DELETE /api/etapas/:id - Remover

**10. series.routes.ts**
Endpoints esperados:
- GET /api/series - Listar séries
- POST /api/series - Criar série
- GET /api/series/:id - Buscar por ID
- PUT /api/series/:id - Atualizar
- DELETE /api/series/:id - Remover

---

### Prioridade 4: Rotas Auxiliares (3 rotas)

**11. upload.routes.ts**
Endpoints esperados:
- POST /api/upload - Upload de arquivo único
- POST /api/upload/multiple - Upload de múltiplos arquivos
- DELETE /api/upload/:filename - Remover arquivo

**12. modules.routes.ts**
Documentar endpoints existentes

**13. phase.routes.ts**
Documentar endpoints existentes

---

## 🎯 Padrão de Documentação

Cada endpoint deve incluir:

```typescript
{
  schema: {
    tags: ["Nome do Módulo"],
    summary: "Breve descrição (1 linha)",
    description: `
Descrição detalhada com markdown.

**Funcionalidades:**
- Lista de features
- Regras de negócio
- Validações automáticas

**Permissões:**
- Quem pode acessar
- Níveis de acesso

**Uso:**
- Casos de uso principais
- Exemplos práticos
    `,
    security: [{ bearerAuth: [] }],
    querystring: { /* parâmetros query */ },
    params: { /* parâmetros URL */ },
    body: { /* schema do body */ },
    response: {
      200: { /* schema de sucesso */ },
      400: { $ref: "#/components/responses/BadRequest" },
      401: { $ref: "#/components/responses/Unauthorized" },
      404: { $ref: "#/components/responses/NotFound" },
    },
  },
}
```

---

## 📊 Métricas de Progresso

- **Total de rotas:** 27
- **Documentadas:** 14 (52%)
- **Pendentes:** 13 (48%)
- **Endpoints documentados:** ~150+
- **Cobertura estimada:** 55%

---

## 🚀 Como Continuar

1. **Escolher próxima rota** da lista de prioridades
2. **Ler o arquivo** para entender os endpoints
3. **Documentar cada endpoint** seguindo o padrão
4. **Testar no Swagger UI** (http://localhost:3333/docs)
5. **Commit incremental** a cada arquivo concluído

---

## 📝 Observações

- Rotas que já têm documentação parcial devem ser completadas primeiro
- Manter consistência nos exemplos (IDs, datas, nomes)
- Incluir sempre exemplos realistas de request/response
- Documentar regras de negócio específicas de cada endpoint
- Referenciar schemas reutilizáveis quando possível

---

**Documento mantido por:** Claude Code
**Versão:** 1.0
