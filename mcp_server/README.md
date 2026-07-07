# Next.js MCP Server

Servidor MCP (Model Context Protocol) para otimização do desenvolvimento de aplicações Next.js.

## 🚀 Funcionalidades

Este servidor MCP fornece as seguintes ferramentas:

### 📦 `generate_component`
Gera componentes React/Next.js com TypeScript.
- Suporte a Client e Server Components
- Interface de Props tipada
- CSS Modules opcionais

### 📄 `generate_page`
Gera páginas/rotas no App Router do Next.js.
- Suporte a rotas dinâmicas `[id]` e catch-all `[...slug]`
- Layout, Loading e Error opcionais

### 🔌 `generate_api_route`
Gera API Routes no App Router.
- Múltiplos métodos HTTP (GET, POST, PUT, PATCH, DELETE)
- Validação com Zod integrada

### 🪝 `generate_hook`
Gera hooks React customizados.
- useState e useEffect opcionais
- Tipagem completa

### 🎯 `generate_context`
Gera Context Providers para gerenciamento de estado.
- Provider completo
- Hook customizado incluído

### 🏗️ `scaffold_project`
Gera estrutura de pastas padrão para projetos Next.js.

## 📦 Instalação

```bash
npm install
npm run build
```

## 🔧 Configuração no VS Code

O arquivo `.vscode/mcp.json` já está configurado para uso com o GitHub Copilot.

Para usar manualmente, adicione ao seu `settings.json`:

```json
{
  "mcp.servers": {
    "nextjs-mcp-server": {
      "type": "stdio",
      "command": "node",
      "args": ["/caminho/para/mcp_server/build/index.js"]
    }
  }
}
```

## 🛠️ Desenvolvimento

```bash
# Compilar uma vez
npm run build

# Modo watch (recompila automaticamente)
npm run dev

# Executar o servidor
npm start
```

## 📚 Documentação

- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Next.js Documentation](https://nextjs.org/docs)

## 📝 Licença

MIT
