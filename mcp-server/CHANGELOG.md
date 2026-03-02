# Changelog - MCP Server

## [2.0.0] - 2026-02-16

### 🎉 Versão Maior - Atualização Completa dos Módulos 5 e 9

### ✅ Correções

#### **Tool `criar_comunicado`** (BREAKING CHANGE)
- **Corrigido**: Campo `conteudo` → `mensagem` (alinhado com a API)
- **Adicionado**: Campo obrigatório `tipo` (INFORMATIVO, URGENTE, AVISO, CONVITE, ALERTA)
- **Adicionado**: Campo obrigatório `autorNome`
- **Adicionado**: Campo opcional `categoria` (ACADEMICO, ADMINISTRATIVO, etc.)
- **Atualizado**: Enum `destinatarios` (removido COORDENADORES, adicionado FUNCIONARIOS)
- **Removido**: Campo `prioridade` (não existe na API)

#### **Tool `listar_comunicados`**
- **Adicionado**: Filtros `tipo` e `categoria`

### 🆕 Novas Ferramentas - Módulo 5 (Programas Especiais)

#### **Busca Ativa**
- `criar_busca_ativa`: Cria caso de busca ativa para alunos evadidos
  - Suporta motivos: EVASAO, INFREQUENCIA, RISCO_ABANDONO, TRANSFERENCIA_NAO_CONFIRMADA
  - Níveis de prioridade: BAIXA, MEDIA, ALTA, URGENTE
- `listar_busca_ativa`: Lista casos com filtros por escola, status, prioridade

#### **AEE/PEI (Atendimento Educacional Especializado)**
- `criar_pei`: Cria Plano Educacional Individualizado
  - Tipos de deficiência: INTELECTUAL, VISUAL, AUDITIVA, FISICA, MULTIPLA, TEA, OUTRA
  - Campos: objetivos, estratégias, recursos, avaliações
- `listar_pei`: Lista PEIs com filtros por matrícula, ano letivo, status

#### **Acompanhamento Pedagógico**
- `criar_acompanhamento`: Cria acompanhamento individualizado
  - Tipos: APRENDIZAGEM, COMPORTAMENTO, FREQUENCIA, EMOCIONAL, FAMILIAR
  - Inclui objetivos e estratégias
- `listar_acompanhamentos`: Lista acompanhamentos com filtros diversos

### 🆕 Novas Ferramentas - Módulo 9 (Comunicação e Gestão)

#### **Plantão Pedagógico**
- `criar_plantao_pedagogico`: Agenda plantão pedagógico
  - Tipos: INDIVIDUAL, COLETIVO, POR_TURMA
  - Horários de início e fim
  - Suporte a turmas específicas
- `listar_plantoes_pedagogicos`: Lista plantões com filtros por data, escola, turma

#### **Reuniões de Pais**
- `criar_reuniao_pais`: Agenda reunião de pais
  - Tipos: BIMESTRAL, TRIMESTRAL, EXTRAORDINARIA, CONSELHO_PARTICIPATIVO
  - Suporte para reuniões gerais da escola ou específicas de turma
  - Campos opcionais: duração, finalidade, pauta
- `listar_reunioes_pais`: Lista reuniões com filtros por status, tipo, escola

#### **Notificações**
- `criar_notificacao`: Cria notificação para usuários
  - Tipos: SISTEMA, ACADEMICO, FINANCEIRO, COMUNICADO, LEMBRETE, URGENTE
  - Prioridades: BAIXA, NORMAL, ALTA, URGENTE
  - Múltiplos canais: APP, EMAIL, SMS, PUSH
- `listar_notificacoes`: Lista notificações com filtros por tipo e status de leitura

### 📊 Estatísticas

- **Ferramentas antes**: 17
- **Ferramentas agora**: 29 (+12 novas ferramentas)
- **Cobertura de API**:
  - Módulo 4: ✅ 100%
  - Módulo 5: ✅ 100%
  - Módulo 9: ✅ 100%

### 🔧 Compatibilidade

#### **BREAKING CHANGES**
⚠️ A tool `criar_comunicado` teve alterações incompatíveis:
- Campo `conteudo` renomeado para `mensagem`
- Novos campos obrigatórios: `tipo`, `autorNome`
- Enum `destinatarios` alterado

**Migração necessária:**
```diff
{
  "titulo": "Comunicado Importante",
- "conteudo": "Mensagem do comunicado",
+ "mensagem": "Mensagem do comunicado",
+ "tipo": "INFORMATIVO",
  "destinatarios": "TODOS",
+ "autorNome": "Secretaria Municipal de Educação"
}
```

### 🚀 Como Atualizar

1. **Rebuild do MCP Server**:
   ```bash
   cd mcp-server
   npm run build
   ```

2. **Reiniciar Claude Desktop**:
   - Feche completamente o Claude Desktop
   - Abra novamente
   - As novas ferramentas estarão disponíveis automaticamente

3. **Verificar Versão**:
   - A versão do servidor deve aparecer como `2.0.0`
   - Total de 29 ferramentas disponíveis

### 📝 Notas

- Todas as novas ferramentas foram testadas e estão funcionais
- Os schemas estão alinhados com a API v2.0 (pós-correções de conversão de datas)
- Suporte total aos Módulos 4, 5 e 9 do Sistema de Gestão Educacional
- Compatível com as correções de conversão de datas aplicadas no backend

---

## [1.0.0] - 2026-02-12

### 🎉 Lançamento Inicial

- Ferramentas básicas: Matrículas, Turmas, Escolas, Profissionais
- Ferramentas de frequência e notas
- Comunicados (com bugs corrigidos na v2.0.0)
- Observabilidade e métricas do sistema
- Resources: Estatísticas, health check

---

**Mantenedores**: SEMEC Ibirapitanga
**Licença**: MIT
