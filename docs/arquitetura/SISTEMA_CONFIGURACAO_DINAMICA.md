# Sistema de Configuração Dinâmica da Câmara Municipal

## ✅ Concluído

### Backend (API)

1. **Migração do Banco de Dados** ✅

   - Tabela `configuracoes_camara` criada
   - Migration: `20251106004018_add_configuracao_camara`
   - Campos: id, chave (unique), valor (JSON text), descricao, timestamps

2. **Service** ✅ (`backend/src/services/configuracao.service.ts`)

   - `getByChave(chave)` - Buscar configuração específica
   - `getConfiguracoesApp()` - Buscar todas formatadas para o app
   - `upsert(chave, valor, descricao)` - Criar ou atualizar
   - `updateConfiguracoesApp(config)` - Atualizar todas de uma vez
   - `delete(chave)` - Deletar configuração
   - `inicializarPadrao()` - Criar configurações padrão de Maraú

3. **Routes** ✅ (`backend/src/routes/configuracao.routes.ts`)

   - `GET /config` - Buscar todas (PÚBLICO - para app)
   - `GET /config/:chave` - Buscar específica (PÚBLICO)
   - `POST /config` - Atualizar todas (PROTEGIDO - Dashboard)
   - `PUT /config/:chave` - Atualizar específica (PROTEGIDO)
   - `DELETE /config/:chave` - Deletar (PROTEGIDO)
   - `POST /config/inicializar` - Criar configurações padrão (PROTEGIDO)

4. **Integração** ✅
   - Routes registradas em `server.ts` com prefixo `/configuracoes`
   - Commit: `f20e64d` - "feat: adicionar sistema de configuração dinâmica da câmara"

### Dashboard (Admin Interface)

1. **Página de Configurações** ✅ - `/configuracoes`
   - Interface com tabs: Câmara, Contato, Redes Sociais
   - Formulário para editar todas as informações
   - Botão salvar que chama `POST /config`
   - Carregar dados atuais com `GET /config`
   - Commit: `269101c` - "feat: adicionar página de configurações da câmara no dashboard"

**Arquivo criado**: `dashboard/src/app/(dashboard)/configuracoes/page.tsx`

## ⏳ Pendente

### Marau-App (Mobile/Web)

1. **Context/Provider** - `marau-app/src/contexts/ConfigContext.tsx`

   - Buscar config da API no init
   - Armazenar em estado global
   - Fornecer hook `useConfig()`

2. **Loading Screen** - `marau-app/src/screens/LoadingScreen.tsx`

   - Tela de carregamento inicial
   - Mostra enquanto busca config

3. **App.tsx**

   - Envolver com `<ConfigProvider>`
   - Mostrar LoadingScreen enquanto carrega
   - Inicializar app após config carregada

4. **Substituir Imports**
   - Trocar `import { Config } from '@/constants/Config'`
   - Por `const config = useConfig()`
   - Em todas as screens que usam Config

## 📋 Interface de Configuração

```typescript
interface ConfiguracaoApp {
  camara: {
    nome: string; // "CÂMARA MUNICIPAL DE MARAÚ"
    nomeCompleto: string; // "Câmara Municipal de Vereadores de Maraú"
    cidade: string; // "Maraú"
    estado: string; // "BA"
    cnpj?: string; // Opcional
  };
  contato: {
    endereco: string; // "Rua Principal, 123"
    bairro: string; // "Centro"
    cep: string; // "45520-000"
    telefone: string; // "(73) 3000-0000"
    email: string; // "contato@camara.marau.ba.gov.br"
    horarioAtendimento: string; // "Segunda a Sexta, 8h às 17h"
  };
  redesSociais: {
    facebook?: string; // URL completa
    instagram?: string; // URL completa
    youtube?: string; // URL completa
    twitter?: string; // URL completa
    site?: string; // URL completa
  };
  app: {
    nome: string; // "Legislativo Maraú"
    versao: string; // "1.0.0"
    descricao: string; // "Aplicativo oficial..."
  };
}
```

## 🔄 Fluxo de Uso

1. **Admin (Dashboard)**:

   - Acessa `/configuracoes`
   - Edita informações da Câmara
   - Clica em "Salvar"
   - POST /config com token de autenticação
   - Dados salvos no banco de dados

2. **App (Mobile/Web)**:
   - Inicialização do app
   - Mostra LoadingScreen
   - GET /config (público, sem auth)
   - Carrega config no contexto
   - Esconde LoadingScreen
   - App usa config dinâmica

## 🚀 Próximos Passos

1. Criar página de configurações no Dashboard
2. Testar API /config no Postman ou Dashboard
3. Criar ConfigContext no marau-app
4. Criar LoadingScreen no marau-app
5. Integrar no App.tsx
6. Substituir imports estáticos de Config
7. Deploy e testes

## 🌐 URLs

- **API Config (público)**: https://api.camara.marau.kssoft.com.br/config
- **Dashboard Config**: https://dashboard.camara.marau.kssoft.com.br/configuracoes
- **App Web**: https://app.camara.marau.kssoft.com.br

## 📊 Benefícios

- ✅ Não precisa alterar código para mudar informações
- ✅ Admin controla tudo pelo Dashboard
- ✅ Aplicativo sempre atualizado
- ✅ Centralizado no banco de dados
- ✅ Histórico de mudanças (timestamps)
