# MCP Server - Next.js Development Tools

Servidor MCP (Model Context Protocol) com ferramentas para scaffolding de projetos Next.js.

## Arquitetura

- **Ponto de entrada único**: [src/index.ts](../src/index.ts) contém todo o código do servidor
- **Transporte**: Usa `StdioServerTransport` para comunicação via stdin/stdout
- **Validação**: Todos os parâmetros de ferramentas são validados com Zod schemas

## Comandos Essenciais

```bash
npm run build    # Compila TypeScript e torna executável (chmod 755)
npm run dev      # Watch mode para desenvolvimento
npm start        # Executa o servidor compilado
```

## Padrão de Definição de Ferramentas

Todas as ferramentas seguem este padrão em [src/index.ts](../src/index.ts):

```typescript
server.tool(
  "tool_name", // Nome snake_case da ferramenta
  "Descrição clara", // Descrição para o cliente MCP
  {
    // Schema Zod para parâmetros
    param: z.string().describe("Descrição do parâmetro"),
  },
  async ({ param }) => {
    // Handler assíncrono
    return {
      content: [{ type: "text", text: "Resultado" }],
    };
  }
);
```

## Ferramentas Disponíveis

| Ferramenta           | Propósito                                             |
| -------------------- | ----------------------------------------------------- |
| `generate_component` | Componentes React com suporte a client/server         |
| `generate_page`      | Páginas App Router com layout/loading/error opcionais |
| `generate_api_route` | API Routes com validação Zod integrada                |
| `generate_hook`      | Hooks customizados com useState/useEffect             |
| `generate_context`   | Context Providers com hook de consumo                 |
| `scaffold_project`   | Estrutura de pastas padrão do projeto                 |

## Convenções do Código

- **Templates**: Strings template multilinha para gerar código
- **Retorno padronizado**: Sempre retorna `{ content: [{ type: "text", text: "..." }] }`
- **Emojis em output**: Use ✅ para sucesso, 📄 para arquivos, 💡 para dicas
- **Comentários em português**: Mantenha comentários e mensagens em PT-BR

## Ao Adicionar Novas Ferramentas

1. Defina o schema Zod com `.describe()` em todos os parâmetros
2. Use valores `.default()` para parâmetros opcionais
3. Retorne código gerado formatado em blocos markdown
4. Liste todos os arquivos que seriam criados no output
5. Adicione entrada na tabela de ferramentas do README.md

## Integração com VS Code

O servidor está configurado em [.vscode/mcp.json](../.vscode/mcp.json):

```json
{
  "servers": {
    "nextjs-mcp-server": {
      "type": "stdio",
      "command": "node",
      "args": ["build/index.js"]
    }
  }
}
```

> ⚠️ Execute `npm run build` antes de usar o servidor no VS Code.

## Contexto do Projeto

Este MCP server faz parte do projeto `sistema-de-gesto-edu` e fornece ferramentas de scaffolding para acelerar o desenvolvimento do frontend Next.js.

## Lacunas Conhecidas

- **Testes**: Não há testes implementados. Considere adicionar testes com Vitest para validar os templates gerados.
- **Escrita de Arquivos**: As ferramentas apenas retornam o código gerado, não escrevem arquivos no disco.

## Referências

- [MCP SDK TypeScript](https://github.com/modelcontextprotocol/typescript-sdk)
- [Model Context Protocol](https://modelcontextprotocol.io)
