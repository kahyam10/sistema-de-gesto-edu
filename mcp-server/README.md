# 🤖 MCP Server - Sistema de Gestão Educacional

Servidor MCP (Model Context Protocol) para integração de agentes de IA com o Sistema de Gestão Educacional de Ibirapitanga-BA.

## 📋 O que é MCP?

O Model Context Protocol (MCP) é um protocolo da Anthropic que permite que agentes de IA (como Claude) se conectem a sistemas externos e executem ações através de ferramentas (tools) e acessem dados através de recursos (resources).

Este servidor MCP expõe as funcionalidades do Sistema de Gestão Educacional para que agentes possam:
- Consultar e gerenciar matrículas, turmas, escolas e profissionais
- Registrar frequência e lançar notas
- Criar e consultar comunicados
- Monitorar a saúde do sistema e métricas
- E muito mais!

## 🚀 Instalação

### 1. Instalar Dependências

```bash
cd mcp-server
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure:

```env
# URL da API (em desenvolvimento)
API_URL=http://localhost:3333

# Token JWT de autenticação
# Para obter o token:
# 1. Inicie o backend do sistema: cd ../backend && npm run dev
# 2. Faça login via Swagger: http://localhost:3333/docs
# 3. Use POST /api/auth/login com suas credenciais
# 4. Copie o token retornado
API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Build do Servidor

```bash
npm run build
```

## 🔧 Uso

### Modo Desenvolvimento (com hot reload)

```bash
npm run dev
```

### Modo Produção

```bash
npm start
```

## 🔌 Conectar ao Claude Desktop

Para usar este servidor MCP com o Claude Desktop, adicione a seguinte configuração ao arquivo de configuração do Claude:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gestao-educacional": {
      "command": "node",
      "args": [
        "D:\\PROJETOS\\PMI\\EDUCACAO\\sistema-de-gesto-edu\\mcp-server\\dist\\index.js"
      ],
      "env": {
        "API_URL": "http://localhost:3333",
        "API_TOKEN": "seu_token_jwt_aqui"
      }
    }
  }
}
```

**⚠️ Importante:**
- Substitua o caminho em `args` pelo caminho absoluto da sua instalação
- Substitua `API_TOKEN` pelo token JWT obtido no login
- Certifique-se de que o backend está rodando em `http://localhost:3333`

Depois de adicionar a configuração:
1. Feche completamente o Claude Desktop
2. Abra novamente o Claude Desktop
3. O servidor MCP será iniciado automaticamente
4. Você verá as ferramentas disponíveis na interface do Claude

## 🛠️ Ferramentas (Tools) Disponíveis

O servidor MCP expõe **29 ferramentas** organizadas por módulo:

### 📚 Matrículas
- **listar_matriculas**: Lista todas as matrículas (com filtros opcionais por escola, turma, status)
- **criar_matricula**: Cria uma nova matrícula de aluno
- **obter_matricula**: Obtém detalhes de uma matrícula específica por ID

### 👥 Turmas
- **listar_turmas**: Lista todas as turmas (com filtros por escola, série, turno)
- **obter_turma**: Obtém detalhes de uma turma específica por ID
- **estatisticas_turma**: Obtém estatísticas de uma turma (total de alunos, média de idade, etc.)

### 🏫 Escolas
- **listar_escolas**: Lista todas as escolas cadastradas
- **obter_escola**: Obtém detalhes de uma escola específica por ID

### 👨‍🏫 Profissionais
- **listar_profissionais**: Lista todos os profissionais (professores, diretores, etc.)

### ✅ Frequência
- **registrar_frequencia**: Registra a frequência de alunos em uma aula
- **consultar_frequencia**: Consulta o histórico de frequência de um aluno

### 📝 Notas e Avaliações
- **lancar_notas**: Lança notas de avaliações para alunos
- **consultar_boletim**: Consulta o boletim completo de um aluno

### 📅 Calendário Letivo
- **listar_eventos_calendario**: Lista eventos do calendário letivo (feriados, recessos, etc.)

### 📢 Comunicação
- **criar_comunicado**: Cria um novo comunicado para pais/responsáveis
- **listar_comunicados**: Lista comunicados (com filtros por escola, turma, status)

### 🔍 Busca Ativa (Módulo 5)
- **criar_busca_ativa**: Cria caso de busca ativa para alunos evadidos ou em risco
- **listar_busca_ativa**: Lista casos de busca ativa com filtros

### ♿ AEE - Atendimento Educacional Especializado (Módulo 5)
- **criar_pei**: Cria Plano Educacional Individualizado (PEI)
- **listar_pei**: Lista PEIs ativos

### 📖 Acompanhamento Pedagógico (Módulo 5)
- **criar_acompanhamento**: Cria acompanhamento individualizado
- **listar_acompanhamentos**: Lista acompanhamentos pedagógicos

### 🏫 Plantão Pedagógico (Módulo 9)
- **criar_plantao_pedagogico**: Agenda plantão pedagógico
- **listar_plantoes_pedagogicos**: Lista plantões agendados

### 👨‍👩‍👧 Reuniões de Pais (Módulo 9)
- **criar_reuniao_pais**: Agenda reunião de pais e responsáveis
- **listar_reunioes_pais**: Lista reuniões agendadas

### 🔔 Notificações (Módulo 9)
- **criar_notificacao**: Cria notificação para usuários do sistema
- **listar_notificacoes**: Lista notificações com filtros

### 📊 Observabilidade
- **consultar_metricas_sistema**: Consulta métricas de performance e saúde do sistema
- **listar_erros_sistema**: Lista erros recentes do sistema para debug

## 📦 Recursos (Resources) Disponíveis

Recursos são dados que podem ser acessados diretamente pelo agente:

- **gestao://estatisticas/geral**: Estatísticas gerais do sistema (total de alunos, turmas, escolas)
- **gestao://escolas/lista**: Lista resumida de todas as escolas
- **gestao://turmas/resumo**: Resumo de todas as turmas ativas
- **gestao://sistema/health**: Status de saúde do sistema (uptime, memória, CPU)

## 💡 Exemplos de Uso com Claude

Quando conectado ao Claude Desktop, você pode fazer perguntas e dar comandos como:

### Módulos Básicos
```
"Liste todas as matrículas da Escola Municipal João Silva"

"Quantos alunos tem na turma do 5º ano A?"

"Registre a frequência dos alunos presentes hoje na turma X"

"Mostre o boletim completo do aluno João da Silva"

"Crie um comunicado urgente sobre a suspensão de aulas amanhã"
```

### Módulo 5 - Programas Especiais
```
"Crie um caso de busca ativa para o aluno João que está com muitas faltas"

"Liste todos os alunos com PEI ativo na rede municipal"

"Crie um acompanhamento pedagógico para a aluna Maria por dificuldades de aprendizagem"

"Mostre todos os casos de busca ativa em andamento da Escola Central"
```

### Módulo 9 - Comunicação e Gestão
```
"Agende um plantão pedagógico individual para quarta-feira das 14h às 18h"

"Crie uma reunião bimestral de pais para o dia 20/03 às 19h no auditório"

"Liste todas as reuniões agendadas para a próxima semana"

"Envie uma notificação urgente para o diretor sobre a manutenção do sistema"

"Mostre os plantões pedagógicos programados para este mês"
```

### Observabilidade
```
"Qual a saúde atual do sistema?"

"Quantos erros ocorreram no sistema nas últimas 24 horas?"

"Mostre as métricas de performance do sistema"
```

O Claude utilizará automaticamente as ferramentas MCP para executar essas ações no sistema.

## 🔐 Segurança

- O token JWT deve ser mantido em segredo e nunca compartilhado
- O token expira após um período (configurado no backend)
- Para renovar o token, faça login novamente na API
- Em produção, use HTTPS para a URL da API
- Restrinja o acesso ao arquivo de configuração do Claude Desktop

## 📁 Estrutura do Projeto

```
mcp-server/
├── src/
│   └── index.ts          # Código principal do servidor MCP
├── dist/                 # Código compilado (gerado por npm run build)
├── package.json          # Dependências e scripts
├── tsconfig.json         # Configuração do TypeScript
├── .env                  # Variáveis de ambiente (não versionado)
├── .env.example          # Exemplo de variáveis de ambiente
└── README.md             # Este arquivo
```

## 🐛 Troubleshooting

### Servidor não inicia

1. Verifique se o backend está rodando:
   ```bash
   curl http://localhost:3333/api/health
   ```

2. Verifique se o token JWT é válido:
   - Teste o token em um endpoint protegido via Swagger
   - Se expirado, faça login novamente e atualize o `.env`

3. Verifique os logs do Claude Desktop:
   - **Windows**: `%APPDATA%\Claude\logs`
   - **macOS**: `~/Library/Logs/Claude`
   - **Linux**: `~/.config/Claude/logs`

### Ferramentas não aparecem no Claude

1. Certifique-se de que a configuração está correta no `claude_desktop_config.json`
2. O caminho em `args` deve ser absoluto e apontar para `dist/index.js`
3. Reinicie completamente o Claude Desktop (feche e abra novamente)

### Erros de autenticação

1. Verifique se o token JWT está correto no `.env`
2. Teste o token fazendo uma requisição manual:
   ```bash
   curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3333/api/matriculas
   ```
3. Se retornar 401 Unauthorized, faça login novamente e atualize o token

## 🔄 Atualizações

Quando o backend é atualizado com novas rotas ou funcionalidades:

1. Atualize o `src/index.ts` com as novas ferramentas
2. Execute `npm run build` para recompilar
3. Reinicie o Claude Desktop para carregar as alterações

## 📚 Documentação Adicional

- [Model Context Protocol - Anthropic](https://modelcontextprotocol.io/)
- [Claude Desktop Configuration](https://docs.anthropic.com/claude/docs)
- [API do Sistema de Gestão Educacional](http://localhost:3333/docs)

## 🤝 Suporte

Para problemas ou dúvidas:
1. Verifique a seção de Troubleshooting acima
2. Consulte os logs do Claude Desktop
3. Teste a API diretamente via Swagger em `http://localhost:3333/docs`
4. Entre em contato com a equipe de desenvolvimento da SEMEC Ibirapitanga

## ✨ Contribuindo

Para adicionar novas ferramentas ao servidor MCP:

1. Abra `src/index.ts`
2. Adicione a definição da ferramenta no array de `tools`
3. Adicione o handler no `switch` dentro de `CallToolRequestSchema`
4. Recompile com `npm run build`
5. Reinicie o Claude Desktop

Exemplo de nova ferramenta:

```typescript
{
  name: "minha_nova_ferramenta",
  description: "Descrição do que a ferramenta faz",
  inputSchema: {
    type: "object",
    properties: {
      parametro: {
        type: "string",
        description: "Descrição do parâmetro"
      }
    },
    required: ["parametro"]
  }
}

// No handler:
case "minha_nova_ferramenta": {
  const response = await apiClient.get("/api/meu-endpoint", {
    params: args
  });
  return {
    content: [{
      type: "text",
      text: JSON.stringify(response.data, null, 2)
    }]
  };
}
```

## 📄 Licença

MIT © SEMEC Ibirapitanga
