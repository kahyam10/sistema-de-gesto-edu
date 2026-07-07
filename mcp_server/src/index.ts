#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";

// Criar instância do servidor MCP
const server = new McpServer({
  name: "nextjs-mcp-server",
  version: "1.0.0",
});

// ===== TOOL: Gerar Componente React/Next.js =====
server.tool(
  "generate_component",
  "Gera um componente React/Next.js com TypeScript. Suporta componentes client e server.",
  {
    name: z
      .string()
      .describe("Nome do componente (ex: Button, Header, UserCard)"),
    type: z
      .enum(["client", "server"])
      .default("server")
      .describe(
        "Tipo do componente: 'client' para componentes interativos, 'server' para Server Components"
      ),
    directory: z
      .string()
      .default("src/components")
      .describe("Diretório onde o componente será criado"),
    withProps: z
      .boolean()
      .default(true)
      .describe("Se deve incluir interface de Props tipada"),
    withStyles: z
      .boolean()
      .default(false)
      .describe("Se deve criar arquivo de estilos CSS Module"),
  },
  async ({ name, type, directory, withProps, withStyles }) => {
    const componentDir = path.join(directory, name);
    const files: string[] = [];

    // Template do componente
    const clientDirective = type === "client" ? '"use client";\n\n' : "";
    const propsInterface = withProps
      ? `interface ${name}Props {\n  children?: React.ReactNode;\n}\n\n`
      : "";
    const propsParam = withProps ? `{ children }: ${name}Props` : "";
    const styleImport = withStyles
      ? `import styles from './${name}.module.css';\n`
      : "";

    const componentContent = `${clientDirective}${styleImport}${propsInterface}export default function ${name}(${propsParam}) {
  return (
    <div${withStyles ? " className={styles.container}" : ""}>
      <h2>${name} Component</h2>
      ${withProps ? "{children}" : ""}
    </div>
  );
}
`;

    files.push(`${componentDir}/${name}.tsx`);

    // Template de estilos CSS Module
    let stylesContent = "";
    if (withStyles) {
      stylesContent = `.container {
  /* Adicione seus estilos aqui */
}
`;
      files.push(`${componentDir}/${name}.module.css`);
    }

    // Template do arquivo index para re-export
    const indexContent = `export { default } from './${name}';
export * from './${name}';
`;
    files.push(`${componentDir}/index.ts`);

    return {
      content: [
        {
          type: "text",
          text: `✅ Componente ${name} gerado com sucesso!\n\nArquivos a serem criados:\n${files
            .map((f) => `- ${f}`)
            .join(
              "\n"
            )}\n\n📄 ${name}.tsx:\n\`\`\`tsx\n${componentContent}\`\`\`${
            withStyles
              ? `\n\n🎨 ${name}.module.css:\n\`\`\`css\n${stylesContent}\`\`\``
              : ""
          }\n\n📦 index.ts:\n\`\`\`ts\n${indexContent}\`\`\``,
        },
      ],
    };
  }
);

// ===== TOOL: Gerar Rota de Página Next.js =====
server.tool(
  "generate_page",
  "Gera uma nova página/rota no App Router do Next.js com TypeScript.",
  {
    route: z
      .string()
      .describe(
        "Caminho da rota (ex: 'dashboard', 'users/[id]', 'blog/[...slug]')"
      ),
    withLayout: z
      .boolean()
      .default(false)
      .describe("Se deve criar um layout.tsx para esta rota"),
    withLoading: z
      .boolean()
      .default(false)
      .describe("Se deve criar um loading.tsx para estados de carregamento"),
    withError: z
      .boolean()
      .default(false)
      .describe("Se deve criar um error.tsx para tratamento de erros"),
    isClientPage: z
      .boolean()
      .default(false)
      .describe("Se a página deve ser um Client Component"),
  },
  async ({ route, withLayout, withLoading, withError, isClientPage }) => {
    const routeDir = `src/app/${route}`;
    const files: string[] = [];
    const outputs: string[] = [];

    // Extrair nome da página do route
    const pageName =
      route
        .split("/")
        .pop()
        ?.replace(/[\[\]\.]/g, "") || "Page";
    const capitalizedName =
      pageName.charAt(0).toUpperCase() + pageName.slice(1);

    // Template da página
    const clientDirective = isClientPage ? '"use client";\n\n' : "";
    const pageContent = `${clientDirective}export default function ${capitalizedName}Page() {
  return (
    <main>
      <h1>${capitalizedName}</h1>
      <p>Bem-vindo à página ${route}</p>
    </main>
  );
}
`;
    files.push(`${routeDir}/page.tsx`);
    outputs.push(`📄 page.tsx:\n\`\`\`tsx\n${pageContent}\`\`\``);

    // Template do layout
    if (withLayout) {
      const layoutContent = `export default function ${capitalizedName}Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      {/* Layout específico para ${route} */}
      {children}
    </section>
  );
}
`;
      files.push(`${routeDir}/layout.tsx`);
      outputs.push(`📐 layout.tsx:\n\`\`\`tsx\n${layoutContent}\`\`\``);
    }

    // Template de loading
    if (withLoading) {
      const loadingContent = `export default function Loading() {
  return (
    <div className="loading-container">
      <p>Carregando...</p>
    </div>
  );
}
`;
      files.push(`${routeDir}/loading.tsx`);
      outputs.push(`⏳ loading.tsx:\n\`\`\`tsx\n${loadingContent}\`\`\``);
    }

    // Template de error
    if (withError) {
      const errorContent = `"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-container">
      <h2>Algo deu errado!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Tentar novamente</button>
    </div>
  );
}
`;
      files.push(`${routeDir}/error.tsx`);
      outputs.push(`❌ error.tsx:\n\`\`\`tsx\n${errorContent}\`\`\``);
    }

    return {
      content: [
        {
          type: "text",
          text: `✅ Rota /${route} gerada com sucesso!\n\nArquivos a serem criados:\n${files
            .map((f) => `- ${f}`)
            .join("\n")}\n\n${outputs.join("\n\n")}`,
        },
      ],
    };
  }
);

// ===== TOOL: Gerar API Route =====
server.tool(
  "generate_api_route",
  "Gera uma nova API Route no App Router do Next.js.",
  {
    route: z
      .string()
      .describe("Caminho da API (ex: 'users', 'auth/login', 'posts/[id]')"),
    methods: z
      .array(z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]))
      .default(["GET"])
      .describe("Métodos HTTP a serem implementados"),
    withValidation: z
      .boolean()
      .default(true)
      .describe("Se deve incluir validação com Zod"),
  },
  async ({ route, methods, withValidation }) => {
    const apiDir = `src/app/api/${route}`;
    const files: string[] = [];

    // Gerar handlers para cada método
    const handlers = methods.map((method) => {
      const isBodyMethod = ["POST", "PUT", "PATCH"].includes(method);

      if (isBodyMethod && withValidation) {
        return `export async function ${method}(request: Request) {
  try {
    const body = await request.json();
    
    // Validação com Zod
    const schema = z.object({
      // Defina seu schema aqui
      name: z.string().min(1),
    });
    
    const validatedData = schema.parse(body);
    
    // Implemente sua lógica aqui
    return NextResponse.json({ 
      success: true, 
      data: validatedData 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}`;
      }

      return `export async function ${method}(request: Request) {
  try {
    // Implemente sua lógica aqui
    return NextResponse.json({ 
      success: true,
      message: '${method} request processado com sucesso'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}`;
    });

    const imports = withValidation
      ? `import { NextResponse } from 'next/server';\nimport { z } from 'zod';\n\n`
      : `import { NextResponse } from 'next/server';\n\n`;

    const routeContent = `${imports}${handlers.join("\n\n")}
`;

    files.push(`${apiDir}/route.ts`);

    return {
      content: [
        {
          type: "text",
          text: `✅ API Route /api/${route} gerada com sucesso!\n\nArquivos a serem criados:\n${files
            .map((f) => `- ${f}`)
            .join("\n")}\n\nMétodos implementados: ${methods.join(
            ", "
          )}\n\n📄 route.ts:\n\`\`\`typescript\n${routeContent}\`\`\``,
        },
      ],
    };
  }
);

// ===== TOOL: Gerar Hook Customizado =====
server.tool(
  "generate_hook",
  "Gera um hook React customizado com TypeScript.",
  {
    name: z
      .string()
      .describe("Nome do hook (ex: 'useAuth', 'useLocalStorage', 'useFetch')"),
    directory: z
      .string()
      .default("src/hooks")
      .describe("Diretório onde o hook será criado"),
    withState: z
      .boolean()
      .default(true)
      .describe("Se o hook deve usar useState"),
    withEffect: z
      .boolean()
      .default(false)
      .describe("Se o hook deve usar useEffect"),
  },
  async ({ name, directory, withState, withEffect }) => {
    // Garantir que o nome começa com 'use'
    const hookName = name.startsWith("use") ? name : `use${name}`;

    const imports = [];
    if (withState) imports.push("useState");
    if (withEffect) imports.push("useEffect");

    const importsLine =
      imports.length > 0
        ? `import { ${imports.join(", ")} } from 'react';\n\n`
        : "";

    const stateCode = withState
      ? "  const [state, setState] = useState<string | null>(null);\n"
      : "";

    const effectCode = withEffect
      ? `
  useEffect(() => {
    // Efeito colateral aqui
    return () => {
      // Cleanup
    };
  }, []);
`
      : "";

    const hookContent = `${importsLine}interface ${hookName}Return {
  // Defina o tipo de retorno aqui
  ${
    withState
      ? "data: string | null;\n  setData: (value: string | null) => void;"
      : ""
  }
}

export function ${hookName}(): ${hookName}Return {
${stateCode}${effectCode}
  return {
    ${
      withState
        ? "data: state,\n    setData: setState,"
        : "// retorne seus valores aqui"
    }
  };
}
`;

    const indexContent = `export { ${hookName} } from './${hookName}';
`;

    return {
      content: [
        {
          type: "text",
          text: `✅ Hook ${hookName} gerado com sucesso!\n\nArquivos a serem criados:\n- ${directory}/${hookName}.ts\n- ${directory}/index.ts (atualizar)\n\n📄 ${hookName}.ts:\n\`\`\`typescript\n${hookContent}\`\`\`\n\n📦 Adicionar ao index.ts:\n\`\`\`typescript\n${indexContent}\`\`\``,
        },
      ],
    };
  }
);

// ===== TOOL: Gerar Context Provider =====
server.tool(
  "generate_context",
  "Gera um Context Provider React com TypeScript para gerenciamento de estado.",
  {
    name: z.string().describe("Nome do contexto (ex: 'Auth', 'Theme', 'Cart')"),
    directory: z
      .string()
      .default("src/contexts")
      .describe("Diretório onde o contexto será criado"),
  },
  async ({ name, directory }) => {
    const contextName = name.endsWith("Context") ? name : `${name}Context`;
    const providerName = name.endsWith("Provider") ? name : `${name}Provider`;
    const hookName = `use${name
      .replace("Context", "")
      .replace("Provider", "")}`;

    const contextContent = `"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

// Tipos do contexto
interface ${contextName}Type {
  // Defina seu estado aqui
  value: string | null;
  setValue: (value: string | null) => void;
}

// Criar o contexto
const ${contextName} = createContext<${contextName}Type | undefined>(undefined);

// Provider
interface ${providerName}Props {
  children: ReactNode;
}

export function ${providerName}({ children }: ${providerName}Props) {
  const [value, setValue] = useState<string | null>(null);

  return (
    <${contextName}.Provider value={{ value, setValue }}>
      {children}
    </${contextName}.Provider>
  );
}

// Hook customizado para usar o contexto
export function ${hookName}() {
  const context = useContext(${contextName});
  
  if (context === undefined) {
    throw new Error('${hookName} deve ser usado dentro de um ${providerName}');
  }
  
  return context;
}
`;

    const indexContent = `export { ${providerName}, ${hookName} } from './${contextName}';
`;

    return {
      content: [
        {
          type: "text",
          text: `✅ Context ${contextName} gerado com sucesso!\n\nArquivos a serem criados:\n- ${directory}/${contextName}.tsx\n- ${directory}/index.ts (atualizar)\n\n📄 ${contextName}.tsx:\n\`\`\`tsx\n${contextContent}\`\`\`\n\n📦 Adicionar ao index.ts:\n\`\`\`typescript\n${indexContent}\`\`\`\n\n💡 Uso:\n\`\`\`tsx\n// No layout.tsx ou _app.tsx\nimport { ${providerName} } from '@/contexts';\n\nexport default function RootLayout({ children }) {\n  return (\n    <${providerName}>\n      {children}\n    </${providerName}>\n  );\n}\n\n// Em qualquer componente\nimport { ${hookName} } from '@/contexts';\n\nfunction MyComponent() {\n  const { value, setValue } = ${hookName}();\n  // ...\n}\n\`\`\``,
        },
      ],
    };
  }
);

// ===== TOOL: Gerar Estrutura de Projeto =====
server.tool(
  "scaffold_project",
  "Gera a estrutura de pastas padrão para um projeto Next.js.",
  {
    features: z
      .array(
        z.enum([
          "components",
          "hooks",
          "contexts",
          "lib",
          "types",
          "utils",
          "services",
          "styles",
        ])
      )
      .default(["components", "hooks", "lib", "types"])
      .describe("Funcionalidades/pastas a serem criadas"),
  },
  async ({ features }) => {
    const structure: string[] = [];
    const descriptions: Record<string, string> = {
      components: "src/components/ - Componentes React reutilizáveis",
      hooks: "src/hooks/ - Hooks customizados",
      contexts:
        "src/contexts/ - Context Providers para gerenciamento de estado",
      lib: "src/lib/ - Bibliotecas e configurações (db, auth, etc)",
      types: "src/types/ - Definições de tipos TypeScript",
      utils: "src/utils/ - Funções utilitárias",
      services: "src/services/ - Serviços para APIs externas",
      styles: "src/styles/ - Estilos globais e variáveis CSS",
    };

    features.forEach((feature) => {
      structure.push(descriptions[feature]);
    });

    // Gerar conteúdo dos arquivos index
    const indexFiles = features.map((feature) => ({
      path: `src/${feature}/index.ts`,
      content: `// Exporte seus ${feature} aqui\n`,
    }));

    return {
      content: [
        {
          type: "text",
          text: `✅ Estrutura do projeto gerada!\n\n📁 Pastas a serem criadas:\n${structure
            .map((s) => `- ${s}`)
            .join("\n")}\n\n📄 Arquivos index.ts:\n${indexFiles
            .map((f) => `- ${f.path}`)
            .join(
              "\n"
            )}\n\n💡 Dica: Use os outros comandos para popular estas pastas:\n- generate_component: Criar componentes\n- generate_hook: Criar hooks\n- generate_context: Criar contexts\n- generate_page: Criar páginas\n- generate_api_route: Criar API routes`,
        },
      ],
    };
  }
);

// Iniciar o servidor
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server Next.js iniciado com sucesso!");
}

main().catch(console.error);
