# Setup - Aplicativo Mobile Legislativo Ibirapitanga

## React Native + Expo

---

## 📋 Visão Geral do Projeto

Conversão do webapp legislativo em aplicativo mobile usando React Native com Expo, mantendo todas as funcionalidades e melhorando a experiência mobile.

**Plataformas:** iOS e Android  
**Framework:** React Native + Expo  
**Linguagem:** TypeScript  
**Navegação:** React Navigation

---

## 🎯 Funcionalidades do Aplicativo

- ✅ Tela inicial com menu de funcionalidades
- ✅ Visualização de vereadores e mesa diretora
- ✅ Agenda legislativa com calendário
- ✅ Sessões legislativas (próximas e passadas)
- ✅ Sistema de votações
- ✅ Projetos de lei (em andamento e aprovados)
- ✅ Leis municipais com pesquisa
- ✅ Pesquisa pública avançada
- ✅ Sistema de feedback e avaliação
- ✅ Transmissão ao vivo (placeholder)
- ✅ Notícias legislativas
- ✅ Contato com a câmara

---

## 📦 ETAPA 1 - Configuração Inicial do Projeto

### 1.1 Criar projeto Expo com TypeScript

```bash
npx create-expo-app legislativo-app -t expo-template-blank-typescript
cd legislativo-app
```

### 1.2 Instalar dependências principais

```bash
# Navegação
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs

# Dependências do React Navigation para Expo
npx expo install react-native-screens react-native-safe-area-context

# Ícones
npx expo install @expo/vector-icons

# Utilitários
npx expo install expo-status-bar expo-linking

# Formulários e inputs
npx expo install react-native-gesture-handler

# Calendário
npm install react-native-calendars

# AsyncStorage para persistência
npx expo install @react-native-async-storage/async-storage
```

### 1.3 Instalar bibliotecas para geração de dados mockados

```bash
# Faker.js para dados realistas
npm install @faker-js/faker

# Date-fns para manipulação de datas
npm install date-fns
```

### 1.4 Instalar dependências de desenvolvimento

```bash
npm install --save-dev @types/react @types/react-native
```

### ✅ Critérios de Conclusão Etapa 1

- [ ] Projeto Expo criado com sucesso
- [ ] Todas as dependências instaladas sem erros
- [ ] Aplicativo abre com tela padrão do Expo
- [ ] TypeScript configurado corretamente

---

## 🎨 ETAPA 2 - Estrutura de Pastas e Arquivos Base

### 2.1 Criar estrutura de diretórios

```
legislativo-app/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── common/         # Botões, cards, inputs
│   │   ├── layout/         # Header, Footer, TabBar
│   │   └── screens/        # Componentes específicos de telas
│   ├── screens/            # Telas da aplicação
│   │   ├── HomeScreen.tsx
│   │   ├── VereadoresScreen.tsx
│   │   ├── MesaDiretoraScreen.tsx
│   │   ├── AgendaScreen.tsx
│   │   ├── SessoesScreen.tsx
│   │   ├── VotacoesScreen.tsx
│   │   ├── ProjetosScreen.tsx
│   │   ├── LeisScreen.tsx
│   │   ├── PesquisaScreen.tsx
│   │   ├── NoticiasScreen.tsx
│   │   ├── AvaliarScreen.tsx
│   │   ├── ContatoScreen.tsx
│   │   └── TransmissaoScreen.tsx
│   ├── navigation/         # Configuração de navegação
│   │   ├── AppNavigator.tsx
│   │   └── types.ts
│   ├── constants/          # Constantes e configurações
│   │   ├── Colors.ts
│   │   ├── Layout.ts
│   │   └── Config.ts
│   ├── mocks/             # Geradores de dados mockados
│   │   ├── generators/    # Funções geradoras
│   │   │   ├── vereadores.mock.ts
│   │   │   ├── leis.mock.ts
│   │   │   ├── projetos.mock.ts
│   │   │   ├── sessoes.mock.ts
│   │   │   ├── votacoes.mock.ts
│   │   │   ├── noticias.mock.ts
│   │   │   ├── agenda.mock.ts
│   │   │   └── index.ts
│   │   └── data.ts        # Agregador de dados mockados
│   ├── types/             # TypeScript types
│   │   └── index.ts
│   ├── utils/             # Funções utilitárias
│   │   └── helpers.ts
│   └── services/          # APIs e serviços
│       └── api.ts
├── assets/                # Imagens, fontes, ícones
│   ├── images/
│   └── fonts/
├── App.tsx
└── app.json
```

### 2.2 Criar arquivo de constantes de cores

**Arquivo:** `src/constants/Colors.ts`

### 2.3 Criar tipos TypeScript

**Arquivo:** `src/types/index.ts`

### 2.4 Configurar gerador de dados mockados com Faker.js

**Criar estrutura de mocks:**

#### 2.4.1 - Criar tipos base

**Arquivo:** `src/types/index.ts`

- Interfaces de Vereador, Lei, Projeto, Sessão, Votação, Notícia, Evento

#### 2.4.2 - Criar geradores individuais

Usar **@faker-js/faker** para gerar dados realistas e dinâmicos:

- `src/mocks/generators/vereadores.mock.ts` - Gera vereadores e mesa diretora
- `src/mocks/generators/leis.mock.ts` - Gera leis municipais
- `src/mocks/generators/projetos.mock.ts` - Gera projetos de lei
- `src/mocks/generators/sessoes.mock.ts` - Gera sessões legislativas
- `src/mocks/generators/votacoes.mock.ts` - Gera votações
- `src/mocks/generators/noticias.mock.ts` - Gera notícias
- `src/mocks/generators/agenda.mock.ts` - Gera eventos de agenda

#### 2.4.3 - Criar agregador de dados

**Arquivo:** `src/mocks/data.ts`

- Exporta todos os dados mockados
- Função para regenerar dados
- Função para resetar dados

**Vantagens do Faker.js:**

- ✅ Dados realistas (nomes, datas, textos)
- ✅ Suporte a português brasileiro (pt_BR)
- ✅ Dados diferentes a cada execução (ou seed fixo)
- ✅ Fácil de expandir e customizar
- ✅ Perfeito para desenvolvimento e testes
- ✅ Preparado para migração futura para backend real

### ✅ Critérios de Conclusão Etapa 2

- [ ] Estrutura de pastas criada
- [ ] Arquivos de constantes criados
- [ ] Tipos TypeScript definidos
- [ ] Faker.js configurado
- [ ] Geradores de mocks criados
- [ ] Dados mockados sendo gerados corretamente

---

## 🧩 ETAPA 3 - Componentes Comuns

### 3.1 Criar componente Header

**Arquivo:** `src/components/layout/Header.tsx`

- Logo da câmara
- Título "PODER LEGISLATIVO - IBIRAPITANGA"
- Botão de voltar condicional
- Gradiente vermelho

### 3.2 Criar componente Footer

**Arquivo:** `src/components/layout/Footer.tsx`

- Barra fixa inferior
- Texto institucional

### 3.3 Criar componente MenuItem

**Arquivo:** `src/components/common/MenuItem.tsx`

- Card com ícone
- Título
- Efeito de toque

### 3.4 Criar componente SearchBar

**Arquivo:** `src/components/common/SearchBar.tsx`

- Input de pesquisa estilizado
- Ícone de busca
- Botão limpar

### 3.5 Criar componente ListItem

**Arquivo:** `src/components/common/ListItem.tsx`

- Item de lista genérico
- Avatar/ícone
- Título e subtítulo
- Seta de navegação

### 3.6 Criar componente TabButton

**Arquivo:** `src/components/common/TabButton.tsx`

- Botão para tabs
- Estado ativo/inativo

### 3.7 Criar componente FilterButton

**Arquivo:** `src/components/common/FilterButton.tsx`

- Botão de filtro arredondado
- Ícone de dropdown

### ✅ Critérios de Conclusão Etapa 3

- [ ] Todos os componentes comuns criados
- [ ] Componentes tipados com TypeScript
- [ ] Componentes estilizados conforme design
- [ ] Componentes testados isoladamente

---

## 🗺️ ETAPA 4 - Configuração de Navegação

### 4.1 Criar tipos de navegação

**Arquivo:** `src/navigation/types.ts`

- Definir RootStackParamList
- Definir tipos de rotas e parâmetros

### 4.2 Criar Bottom Tab Navigator

**Arquivo:** `src/navigation/BottomTabNavigator.tsx`

- 5 tabs principais: Início, Notícias, Agenda, Vereadores, Contato
- Ícones customizados
- Estados ativos/inativos

### 4.3 Criar Stack Navigator

**Arquivo:** `src/navigation/AppNavigator.tsx`

- Stack principal com todas as telas
- Configuração de headers
- Transições de tela

### 4.4 Integrar navegação no App.tsx

**Arquivo:** `App.tsx`

- NavigationContainer
- Importar AppNavigator
- Configurar tema

### ✅ Critérios de Conclusão Etapa 4

- [x] Navegação stack criada
- [x] Bottom tabs funcionando
- [x] Transições suaves entre telas
- [x] Tipos de navegação corretos

---

## 📱 ETAPA 5 - Tela Home (Principal)

### 5.1 Criar HomeScreen

**Arquivo:** `src/screens/HomeScreen.tsx`

- Header institucional
- Grid 3x4 de menus
- Footer fixo
- Navegação para todas as telas

### 5.2 Estilização responsiva

- Grid adaptável
- Espaçamento adequado
- ScrollView se necessário

### ✅ Critérios de Conclusão Etapa 5

- [ ] Tela Home completa
- [ ] Grid de menus funcionando
- [ ] Navegação para todas as telas
- [ ] Layout responsivo

---

## 👥 ETAPA 6 - Telas de Vereadores

### 6.1 Criar VereadoresScreen

**Arquivo:** `src/screens/VereadoresScreen.tsx`

- Lista de vereadores
- Barra de pesquisa
- Avatar e informações
- Navegação para detalhes

### 6.2 Criar MesaDiretoraScreen

**Arquivo:** `src/screens/MesaDiretoraScreen.tsx`

- Lista da mesa diretora
- Cargos e nomes
- Layout similar aos vereadores

### 6.3 Criar VereadorDetailScreen (se necessário)

**Arquivo:** `src/screens/VereadorDetailScreen.tsx`

- Foto e informações completas
- Histórico de votações
- Projetos apresentados

### ✅ Critérios de Conclusão Etapa 6

- [ ] VereadoresScreen completa
- [ ] MesaDiretoraScreen completa
- [ ] Pesquisa funcionando
- [ ] Lista rolável e performática

---

## 📅 ETAPA 7 - Tela de Agenda

### 7.1 Criar AgendaScreen

**Arquivo:** `src/screens/AgendaScreen.tsx`

- Calendário interativo (react-native-calendars)
- Navegação entre meses
- Dias selecionáveis
- Lista de eventos do dia

### 7.2 Integrar calendário

- Marcar dias com eventos
- Destaque visual de datas importantes
- Seleção de datas

### 7.3 Lista de eventos

- Próximos eventos
- Detalhes (data, hora, tipo)
- Botão adicionar à agenda

### ✅ Critérios de Conclusão Etapa 7

- [x] Calendário funcionando
- [x] Navegação entre meses
- [x] Lista de eventos
- [x] Interação com datas

---

## 📺 ETAPA 8 - Telas de Sessões e Votações ✅

### 8.1 Criar SessoesScreen ✅

**Arquivo:** `src/screens/SessoesScreen.tsx`

- Tabs (Próximas/Passadas)
- Cards de sessões com data, horário, local
- Status badge (Em Andamento, Agendada, Concluída, Cancelada)
- Preview da pauta
- Navegação para detalhes

### 8.2 Criar SessaoDetalhesScreen ✅

**Arquivo:** `src/screens/SessaoDetalhesScreen.tsx`

- Detalhes completos da sessão
- Status badge com cores
- Data, horário e local formatados
- Ordem do Dia (pauta numerada)
- Botão "AO VIVO" condicional para sessões em andamento
- Ações: Ver Votações, Ver Projetos

### 8.3 Criar VotacoesScreen ✅

**Arquivo:** `src/screens/VotacoesScreen.tsx`

- Barra de pesquisa por projeto
- Cards com número do projeto, título, data
- Badge de resultado (Aprovado/Rejeitado/Em Tramitação)
- Barra de progresso visual dos votos
- Breakdown de votos (Favor/Contra/Abstenções)
- Navegação para detalhes

### 8.4 Criar VotacaoDetalhesScreen ✅

**Arquivo:** `src/screens/VotacaoDetalhesScreen.tsx`

- Título do projeto e badge de resultado
- Resumo da votação com total de votos
- Barra visual segmentada (verde/vermelho/cinza)
- Detalhamento por tipo (%, quantidade)
- Votos nominais de todos os vereadores
- Badges coloridos por voto (Favor/Contra/Abstenção)
- Ações: Ver Projeto Completo, Ver Sessão

### 8.5 Atualizar AppNavigator ✅

**Arquivo:** `src/navigation/AppNavigator.tsx`

- Importar SessaoDetalhesScreen e VotacaoDetalhesScreen
- Integrar rotas no Stack Navigator

### ✅ Critérios de Conclusão Etapa 8

- [x] SessoesScreen completa com tabs
- [x] SessaoDetalhesScreen com ordem do dia
- [x] VotacoesScreen com pesquisa e filtros
- [x] VotacaoDetalhesScreen com votos nominais
- [x] AppNavigator atualizado
- [x] Filtros funcionando
- [x] Status visuais corretos

---

## 📜 ETAPA 9 - Telas de Projetos e Leis ✅

### 9.1 Criar ProjetosScreen ✅

**Arquivo:** `src/screens/ProjetosScreen.tsx`

- SearchBar para buscar por número, título ou autor
- Tabs: Em Andamento / Aprovados / Arquivados
- Cards com número, título, descrição, autor e data
- Status badges coloridos por status
- Contador de projetos filtrados
- Navegação para detalhes

### 9.2 Criar ProjetoDetalhesScreen ✅

**Arquivo:** `src/screens/ProjetoDetalhesScreen.tsx`

- Card principal com número, tipo e título
- Status badge colorido
- Informações gerais (autor, data apresentação, categoria)
- Ementa completa
- Texto completo do projeto (quando disponível)
- Histórico de tramitação com timeline visual
- Botões de ação: Ver Votação (condicional), Baixar PDF, Compartilhar

### 9.3 Criar LeisScreen ✅

**Arquivo:** `src/screens/LeisScreen.tsx`

- SearchBar para buscar por número, descrição ou categoria
- Filtros por ano com scroll horizontal
- Cards com número, descrição, categoria e data publicação
- Badge de ano destacado
- Contador de leis filtradas
- Navegação para detalhes

### 9.4 Criar LeiDetalhesScreen ✅

**Arquivo:** `src/screens/LeiDetalhesScreen.tsx`

- Card principal com número, título e ícone shield
- Status badge (Vigente/Revogada/Em Revisão)
- Informações gerais (categoria, data publicação, autor)
- Ementa/descrição completa
- Texto completo da lei com formatação especial
- Card informativo sobre legislação municipal
- Botões de ação: Baixar PDF, Compartilhar, Imprimir

### 9.5 Atualizar AppNavigator ✅

**Arquivo:** `src/navigation/AppNavigator.tsx`

- Importar ProjetoDetalhesScreen e LeiDetalhesScreen
- Substituir placeholders por componentes reais
- Rotas integradas e funcionais

### ✅ Critérios de Conclusão Etapa 9

- [x] ProjetosScreen com tabs e pesquisa
- [x] ProjetoDetalhesScreen com tramitação
- [x] LeisScreen com pesquisa e filtro por ano
- [x] LeiDetalhesScreen com texto completo
- [x] Filtros operacionais
- [x] Navegação funcionando
- [x] 0 erros TypeScript

---

## 🔍 ETAPA 10 - Tela de Pesquisa Pública ✅

### 10.1 Criar PesquisaScreen ✅

**Arquivo:** `src/screens/PesquisaScreen.tsx`

- SearchBar global com foco automático
- Tabs horizontais com scroll: Todos / Vereadores / Projetos / Leis / Sessões / Notícias
- Busca unificada em todas as categorias
- Mínimo 2 caracteres para pesquisa
- Resultados agrupados por tipo (quando tab "Todos")
- Ícones e cores diferenciadas por categoria
- Navegação direta para detalhes de cada resultado
- Empty state personalizado
- Contador de resultados
- Ordenação por relevância e data

### 10.2 Lógica de Pesquisa Implementada ✅

- Busca em tempo real com useMemo
- Pesquisa por múltiplos campos:
  - **Vereadores**: nome, partido
  - **Projetos**: número, título, descrição, autor
  - **Leis**: número, título, descrição, categoria
  - **Sessões**: tipo, local
  - **Notícias**: título, resumo, categoria
- Algoritmo de relevância (matches exatos prioritários)
- Resultados agrupados por tipo com badges de contagem
- Performance otimizada com memoização

### 10.3 Interface ResultadoItem ✅

- Cards com ícone colorido por tipo
- Título e subtítulo descritivos
- Data formatada (quando disponível)
- Chevron para indicar navegação
- Sombras e elevação para hierarquia visual

### 10.4 Atualizar AppNavigator ✅

**Arquivo:** `src/navigation/AppNavigator.tsx`

- Importar PesquisaScreen real
- Remover placeholder
- Rota integrada no Stack Navigator

### ✅ Critérios de Conclusão Etapa 10

- [x] Pesquisa global funcionando
- [x] Tabs de categorias com scroll
- [x] Busca em 5 categorias diferentes
- [x] Resultados agrupados e ordenados
- [x] Navegação para detalhes
- [x] Performance otimizada com useMemo
- [x] Empty states personalizados
- [x] 0 erros TypeScript

---

## 📰 ETAPA 11 - Tela de Notícias ✅

### 11.1 Criar NoticiasScreen ✅

**Arquivo:** `src/screens/NoticiasScreen.tsx`

- SearchBar para buscar notícias
- Filtros por categoria com scroll horizontal (6 categorias)
- **Primeira notícia em destaque** (design diferenciado)
  - Imagem grande (200px altura)
  - Fundo vermelho com texto branco
  - Badge de categoria colorida
  - Título, resumo, data e autor
- **Notícias regulares** em cards
  - Imagem (140px altura)
  - Badge de categoria colorida
  - Título e resumo
  - Data e autor no rodapé
- Cores por categoria:
  - 🔵 Geral (azul)
  - 🟣 Sessões (roxo)
  - 🟢 Projetos (verde)
  - 🔴 Eventos (vermelho)
  - 🟡 Comunicados (amarelo)
- Contador de notícias
- Empty state personalizado
- Ordenação por data (mais recentes primeiro)

### 11.2 Criar NoticiaDetalhesScreen ✅

**Arquivo:** `src/screens/NoticiaDetalhesScreen.tsx`

- Imagem em destaque full-width (250px altura)
- Card de conteúdo branco com:
  - Badge de categoria colorida
  - Título grande (24px)
  - Meta informações (data e autor) com ícones
  - Resumo destacado (fundo cinza, borda vermelha, itálico)
  - Conteúdo completo justificado
  - Tags com ícones (quando disponíveis)
- **Botões de ação**:
  - Compartilhar (com Share API nativa)
  - Salvar/Favoritar
- Card informativo azul sobre fonte oficial
- Seção de notícias relacionadas (estrutura preparada)
- Scroll suave com espaçamento adequado

### 11.3 Atualizar AppNavigator ✅

**Arquivo:** `src/navigation/AppNavigator.tsx`

- Importar NoticiaDetalhesScreen real
- Remover placeholder
- Rota integrada no Stack Navigator

### ✅ Critérios de Conclusão Etapa 11

- [x] NoticiasScreen completa com destaque
- [x] Lista de notícias com imagens
- [x] Filtros por categoria funcionando
- [x] NoticiaDetalhesScreen com layout de artigo
- [x] Compartilhamento integrado
- [x] Design responsivo e elegante
- [x] 0 erros TypeScript

---

## ✅ ⭐ ETAPA 12 - Telas de Avaliação e Contato

### 12.1 ✅ Criar AvaliarScreen

**Arquivo:** `src/screens/AvaliarScreen.tsx`

**Funcionalidades implementadas:**

- **Rating com Estrelas (1-5)**: TouchableOpacity para cada estrela, estado `rating`, visual em dourado (#FFD700) quando selecionada
- **Labels Dinâmicos**: getRatingLabel() retorna emoji + texto ("😞 Muito Insatisfeito" até "🤩 Muito Satisfeito")
- **Campo de Comentário**: TextInput multiline com 6 linhas, contador de caracteres (0/500), placeholder "Conte-nos mais..."
- **Validação**: Alert se tentar enviar sem rating, botão desabilitado (cinza) quando rating === 0
- **Estado de Sucesso**: Após enviar mostra tela com ícone checkmark verde, "Obrigado!", mensagem de agradecimento, reset após 3s
- **Ícone do App**: View redonda (80x80) vermelho institucional com ícone business, shadow
- **Card de Informação**: Background azul claro (#E3F2FD), borda esquerda vermelha (4px), texto explicando anonimato
- **Outras Formas de Contato**: 3 cards (E-mail, Telefone, Endereço) com ícones coloridos, layout horizontal icon+content+chevron
  - E-mail: contato@camaraibirapitanga.ba.gov.br
  - Telefone: (73) 3548-2100
  - Endereço: Praça da Independência, Centro - Ibirapitanga/BA
- **Design**: ScrollView, padding 20px, cards brancos com shadow, botão vermelho com ícone send

**Estado:**

```typescript
const [rating, setRating] = useState(0);
const [comentario, setComentario] = useState("");
const [submitted, setSubmitted] = useState(false);
```

**Navegação:** Acessível pelo menu principal HomeScreen → item "Avaliar"

---

## ✅ 📺 ETAPA 13 - Tela de Transmissão ao Vivo

### 13.1 ✅ Criar TransmissaoScreen

**Arquivo:** `src/screens/TransmissaoScreen.tsx`

**Funcionalidades implementadas:**

**Player de Vídeo (aspectRatio 16:9):**

- **Estado Offline**: Background preto (#1a1a1a), ícone videocam-off cinza, texto "Fora do ar", botão "Notificar-me" vermelho
- **Estado Ao Vivo**:
  - Badge "AO VIVO" vermelho (#DC2626 opacity 0.95) no canto superior esquerdo com indicador pulsante branco
  - Contador de espectadores: "• 145 assistindo"
  - Botão play central (80x80, círculo com borda branca, background rgba preto 0.6)
  - Botão fullscreen no canto inferior direito (expand/contract icon)
  - Placeholder texto "🎥 Player de Vídeo (YouTube/Vimeo Embed)"

**Informações da Sessão:**

- Título e descrição da sessão
- Data/hora de início (quando ao vivo): "Iniciada às 14h00" com ícone time

**Card Próxima Transmissão** (quando offline):

- Background branco, shadow, ícone calendar vermelho
- Data formatada: "20 de outubro de 2025 às 14h00"
- Botão "Adicionar ao calendário" com ícone, background rosa claro (#FEF2F2)

**Ordem do Dia (Pauta):**

- Lista numerada com círculos cinzas numerados (1, 2, 3...)
- 5 itens exemplo: Abertura, Projeto 045/2025, Projeto 046/2025, Requerimentos, Encerramento
- Background branco, shadow, ícone list

**Seção de Ações** (4 cards):

1. **Compartilhar**: ícone share-social, "Envie o link da transmissão"
2. **Comentários**: ícone chatbubbles, "Participe da discussão"
3. **Ver Pauta Completa**: ícone document-text, "Documentos e detalhes"
4. **Transmissões Anteriores**: ícone film, "Assista gravações"

- Layout: icon vermelho em box rosa + título + descrição + chevron

**Card de Informação:**

- Background azul claro (#E3F2FD), ícone information-circle azul
- Título: "Horário das Transmissões"
- Texto: "Sessões ordinárias toda segunda-feira às 14h. Extraordinárias conforme convocação."

**Links Externos (3 botões):**

- YouTube (logo vermelho #FF0000)
- Facebook (logo azul #1877F2)
- Site Oficial (ícone globe cinza)
- Layout: grid horizontal, cards brancos com shadow

**Dados Simulados:**

```typescript
interface TransmissaoData {
  isLive: boolean;
  titulo: string;
  descricao: string;
  dataInicio?: Date;
  proximaTransmissao?: Date;
  urlVideo?: string;
  pauta?: string[];
  espectadores?: number;
}
```

**Navegação:** Acessível pelo menu principal HomeScreen → item "Transmissão ao Vivo"

**Nota para Produção:**

- Integrar react-native-video ou WebView para embed YouTube/Vimeo
- API real-time para status isLive
- Integração com dados de sessões (src/mocks/data.ts - sessoes)

### 13.2 ✅ Integração no AppNavigator

**Arquivo:** `src/navigation/AppNavigator.tsx`

- Importar AvaliarScreen e TransmissaoScreen reais
- Remover placeholders const AvaliarScreen e const TransmissaoScreen
- Rotas funcionando no Stack Navigator

### ✅ Critérios de Conclusão Etapas 12 e 13

- [x] AvaliarScreen completa com rating de estrelas (1-5)
- [x] Comentários com TextInput multiline e contador
- [x] Estado de sucesso após envio ("Obrigado!")
- [x] Cards de contato (e-mail, telefone, endereço)
- [x] TransmissaoScreen com player (offline/ao vivo)
- [x] Badge "AO VIVO" com contador de espectadores
- [x] Card de próxima transmissão agendada
- [x] Ordem do dia (pauta) com lista numerada
- [x] 4 ações rápidas (compartilhar, comentários, pauta, gravações)
- [x] Links externos (YouTube, Facebook, Site)
- [x] AppNavigator integrado sem placeholders
- [x] 0 erros TypeScript
- [x] Design consistente com padrões do app

---

## ✅ 🎨 ETAPA 14 - Refinamento Visual e UX

### 14.1 ✅ Estados de Loading e Empty

**Componentes reutilizados:**

- `Loading.tsx`: Já implementado em src/components/common/Loading.tsx
- `EmptyState.tsx`: Já implementado em src/components/common/EmptyState.tsx

**Implementações:**

- VereadorDetalhesScreen: Empty state quando vereador não encontrado (ícone alert-circle, mensagem)
- MesaDiretoraScreen: Sem empty state (sempre tem membros)
- Todas as telas de listagem já usam EmptyState quando filtros não retornam resultados

### 14.2 ✅ Consistência Visual

**Elementos padronizados:**

- **Cards**: Todos com borderRadius 12px, shadow consistente (elevation 2-3)
- **Cores**: Sistema unificado via Colors.ts (primary.red, text.primary, background.gray50)
- **Tipografia**: Hierarquia clara (títulos 22-24px bold, textos 14-15px regular, labels 12-13px)
- **Espaçamentos**: Padding 15-20px, gaps 8-12px, margins 10-15px
- **Ícones**: Ionicons size 20-24px para títulos, 16-18px para botões
- **Botões**: Height mínima 45px, border-radius 10-12px, feedback visual

### 14.3 ✅ Feedback Visual

**Interações implementadas:**

- **TouchableOpacity**: Todos os botões e cards clicáveis com feedback de opacidade
- **Estados de sucesso**: AvaliarScreen mostra tela "Obrigado!" após envio
- **Alerts**: Linking com try-catch e Alert.alert para erros (chamadas, e-mails, redes sociais)
- **Badges coloridas**: Status diferenciados por cor (aprovado=verde, em andamento=amarelo, rejeitado/arquivado=vermelho)
- **Contadores**: NoticiasScreen, VotacoesScreen, ProjetosScreen mostram totais filtrados

### 14.4 ✅ Navegação e Transições

**Configuração do Stack Navigator:**

```typescript
screenOptions={{
  headerStyle: { backgroundColor: Colors.primary.red },
  headerTintColor: Colors.text.white,
  headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
  headerShadowVisible: false,
  animation: 'slide_from_right',
}}
```

**Navegação entre telas:**

- HomeScreen → 12 itens de menu navegam para telas específicas
- VereadorDetalhesScreen ↔ MesaDiretoraScreen (via navigation.navigate)
- MesaDiretoraScreen → VereadorDetalhesScreen (tap em membro)
- ProjetosScreen → ProjetoDetalhesScreen → opcional VotacaoDetalhes
- NoticiasScreen → NoticiaDetalhesScreen com Share API

### ✅ Critérios de Conclusão Etapa 14

- [x] Loading e Empty states implementados
- [x] Cores e tipografia consistentes
- [x] Feedback visual em todas as interações
- [x] Animações de transição configuradas
- [x] Design responsivo e polido

---

## ✅ 👥 ETAPA 15 - Telas de Vereadores Completas

### 15.1 ✅ Criar VereadorDetalhesScreen

**Arquivo:** `src/screens/VereadorDetalhesScreen.tsx` (620+ linhas)

**Sistema de Tabs (3 abas):**

1. **Sobre**: Biografia, informações gerais, áreas de atuação, estatísticas
2. **Projetos**: Lista de projetos apresentados pelo vereador
3. **Contato**: Telefone, e-mail, redes sociais, gabinete

**Aba "Sobre":**

- **Biografia**: Texto completo ou fallback genérico, justificado
- **Card de Informações**: Nome completo, partido (badge), mandato (2021-2024)
- **Áreas de Atuação**: Tags coloridas (Educação azul, Saúde verde, Infraestrutura amarelo, Cultura roxo)
- **Estatísticas Parlamentares**: 3 cards em grid
  - Projetos Apresentados (contador real baseado em mockData.projetos filtrados por autor)
  - Projetos Aprovados (filtro status === 'Aprovado')
  - Presença em Sessões (87% hardcoded)

**Aba "Projetos":**

- **Lista de Projetos**: Filtrados por `projeto.autor === vereador.nome`
- **Card de Projeto**:
  - Número do projeto (ex: "PL 045/2025")
  - Badge de status colorido (Aprovado verde, Em Andamento amarelo, Rejeitado/Arquivado vermelho)
  - Título (16px bold)
  - Descrição (2 linhas truncadas)
  - Footer: Data de apresentação + link "Ver detalhes"
- **Empty State**: Quando vereador não tem projetos (ícone document-text-outline)

**Aba "Contato":**

- **Cards Interativos**: Telefone e E-mail com Linking.openURL
  - Ícone em círculo vermelho claro (#FEF2F2)
  - Label + valor
  - Chevron à direita
- **Redes Sociais**: Botões coloridos (Facebook #1877F2, Instagram #E4405F, Twitter #1DA1F2)
  - Condicional: só mostra se `vereador.redeSocial?.[platform]` existir
- **Card Gabinete**: Localização (Câmara Municipal + endereço) e horário de atendimento

**Card do Perfil (topo):**

- Foto redonda (120x120) com borda vermelha (3px)
- Nome (22px bold)
- Partido em badge cinza com ícone flag

**Navegação de Tabs:**

- TouchableOpacity com ícone + texto
- Tab ativa: borda inferior vermelha (2px), texto e ícone vermelhos
- Tab inativa: cinza

**Funcionalidades:**

- `handleCall()`: Linking.openURL(`tel:${telefone}`)
- `handleEmail()`: Linking.openURL(`mailto:${email}`)
- `handleSocialMedia()`: Linking.openURL para Facebook, Instagram, Twitter
- Try-catch com Alert.alert para erros de Linking

**Tipos:**

```typescript
type Props = NativeStackScreenProps<RootStackParamList, "VereadorDetalhes">;
const { vereadorId } = route.params; // string
const vereador = mockData.vereadores.find(
  (v: Vereador) => v.id === Number(vereadorId)
);
```

### 15.2 ✅ Criar MesaDiretoraScreen

**Arquivo:** `src/screens/MesaDiretoraScreen.tsx` (430+ linhas)

**Header Card:**

- Ícone people em círculo rosa claro (80x80)
- Título: "Composição da Mesa Diretora"
- Subtítulo: "Biênio 2023-2024" (vermelho institucional)
- Descrição: Explicação sobre responsabilidades

**Organização em Seções:**

1. **Presidência** (ícone ribbon vermelho)
2. **Vice-Presidência** (ícone shield vermelho escuro)
3. **Secretaria** (ícone document-text azul) - 1º Secretário + 2ª Secretária
4. **Tesouraria** (ícone wallet verde) - 1º Tesoureiro + 2ª Tesoureira

**Card de Membro:**

- **Badge de Cargo**: Topo do card, cor específica por cargo, ícone + texto
- **Foto**: 70x70 redonda, borda cinza
  - Presidente tem badge estrela dourada (#FFD700) no canto inferior direito
- **Info**: Nome (17px bold) + partido com flag
- **Botões de Contato**: 3 botões em row (telefone, e-mail, ver detalhes)
  - Background cinza claro (#F8F8F8), ícone colorido por cargo
- **Presidente**: Card com borda dourada (2px, #FFD700)

**Funções de Cor e Ícone:**

```typescript
getCargoColor(cargo):
  - Presidente: Colors.primary.red
  - Vice-Presidente: #DC2626
  - Secretários: #2563EB
  - Tesoureiros: #059669

getCargoIcon(cargo):
  - Presidente: ribbon
  - Vice: shield
  - Secretários: document-text
  - Tesoureiros: wallet
```

**Card de Informação:**

- Background azul claro (#E3F2FD)
- Título: "Competências da Mesa Diretora"
- Lista com bullets (•): 5 responsabilidades

**Seção de Ações (3 botões):**

1. **Regimento Interno**: "Consulte as normas da Casa"
2. **Calendário de Sessões**: "Veja o cronograma completo"
3. **Todos os Vereadores**: "Conheça toda a bancada"

**Funcionalidades:**

- `handleCall(telefone)`: Linking para chamada
- `handleEmail(email)`: Linking para e-mail
- `handleVerDetalhes(vereadorId)`: navigation.navigate('VereadorDetalhes')

**Filtros de Dados:**

```typescript
mockData.mesaDiretora.filter(
  (m: MembroMesaDiretora) =>
    m.cargo === "1º Secretário" || m.cargo === "2ª Secretária"
);
```

### 15.3 ✅ Integração no AppNavigator

**Arquivo:** `src/navigation/AppNavigator.tsx` (recriado limpo)

**Imports adicionados:**

```typescript
import VereadorDetalhesScreen from "../screens/VereadorDetalhesScreen";
import MesaDiretoraScreen from "../screens/MesaDiretoraScreen";
```

**Rotas adicionadas:**

```typescript
<Stack.Screen name="VereadorDetalhes" component={VereadorDetalhesScreen} options={{ title: 'Vereador' }} />
<Stack.Screen name="MesaDiretora" component={MesaDiretoraScreen} options={{ title: 'Mesa Diretora' }} />
```

**Todas as rotas funcionais:**

- Main (BottomTabNavigator)
- VereadorDetalhes, MesaDiretora
- SessaoDetalhes, VotacaoDetalhes
- ProjetoDetalhes, LeiDetalhes
- Pesquisa, NoticiaDetalhes
- Avaliar, Transmissao

**Nota:** Arquivo AppNavigator.tsx foi recriado após corrupção durante edição, agora limpo e funcional.

### ✅ Critérios de Conclusão Etapa 15

- [x] VereadorDetalhesScreen completa com 3 tabs
- [x] Biografia, informações, áreas de atuação
- [x] Estatísticas parlamentares (projetos, aprovações, presença)
- [x] Lista de projetos filtrada por autor
- [x] Contatos interativos (telefone, e-mail, redes sociais)
- [x] MesaDiretoraScreen com organização por seções
- [x] Cards diferenciados por cargo (cores, ícones)
- [x] Destaque especial para Presidente (borda dourada, badge estrela)
- [x] Botões de contato funcionais (Linking API)
- [x] Navegação entre MesaDiretora ↔ VereadorDetalhes
- [x] AppNavigator integrado com todas as 22 telas
- [x] 0 erros TypeScript em todos os arquivos
- [x] Design consistente e profissional

---

## 🎨 ETAPA 16 - Refinamentos Finais (PRÓXIMA)

### 16.1 Ajustar cores e tema

- Garantir consistência de cores
- Gradientes e sombras
- Dark mode (opcional)

### 14.2 Adicionar animações

```bash
npm install react-native-reanimated
```

- Transições suaves
- Animações de entrada
- Feedback visual

### 14.3 Melhorar feedback visual

- Loading states
- Estados vazios
- Mensagens de erro

### 14.4 Adicionar splash screen

```bash
npx expo install expo-splash-screen
```

- Logo institucional
- Cores da marca

### 14.5 Configurar ícone do app

**Arquivo:** `app.json`

- Ícone iOS
- Ícone Android
- Adaptive icon

### ✅ Critérios de Conclusão Etapa 14

- [ ] Tema consistente
- [ ] Animações implementadas
- [ ] Splash screen configurada
- [ ] Ícone do app definido

---

## 🔧 ETAPA 15 - Funcionalidades Avançadas

### 15.1 Implementar AsyncStorage

- Favoritar itens
- Histórico de pesquisas
- Preferências do usuário

### 15.2 Adicionar notificações push (opcional)

```bash
npx expo install expo-notifications
```

- Configurar notificações
- Alertas de sessões
- Avisos de votações importantes

### 15.3 Compartilhamento

```bash
npx expo install expo-sharing
```

- Compartilhar leis
- Compartilhar projetos
- Compartilhar notícias

### 15.4 Acessibilidade

- Labels para screen readers
- Contraste de cores
- Tamanhos de fonte ajustáveis

### ✅ Critérios de Conclusão Etapa 15

- [ ] Persistência de dados
- [ ] Notificações (se implementado)
- [ ] Compartilhamento funcionando
- [ ] Acessibilidade básica

---

## 🌐 ETAPA 16 - Integração com API (Preparação)

### 16.1 Criar serviço de API

**Arquivo:** `src/services/api.ts`

- Axios ou Fetch
- Endpoints base
- Interceptadores
- Tratamento de erros

### 16.2 Criar hooks customizados

**Arquivo:** `src/hooks/useVereadores.ts`, etc.

- useState + useEffect
- Loading states
- Error handling

### 16.3 Substituir dados mockados

- Conectar com API real
- Manter fallback para dados mockados

### ✅ Critérios de Conclusão Etapa 16

- [ ] Serviço de API estruturado
- [ ] Hooks criados
- [ ] Pronto para integração real

---

## 🧪 ETAPA 17 - Testes e Otimização

### 17.1 Testar em dispositivos

- iOS (simulador/dispositivo)
- Android (emulador/dispositivo)
- Diferentes tamanhos de tela

### 17.2 Otimizar performance

- Lazy loading de imagens
- Memoização de componentes
- FlatList otimizadas

### 17.3 Testar navegação

- Todos os fluxos de navegação
- Botão voltar
- Deep linking (se aplicável)

### 17.4 Testar funcionalidades

- Todas as interações
- Formulários
- Pesquisas e filtros

### ✅ Critérios de Conclusão Etapa 17

- [ ] Testado em iOS e Android
- [ ] Performance aceitável
- [ ] Todas as funcionalidades testadas
- [ ] Bugs corrigidos

---

## 📦 ETAPA 18 - Build e Deploy

### 18.1 Configurar app.json

**Arquivo:** `app.json`

```json
{
  "expo": {
    "name": "Legislativo Ibirapitanga",
    "slug": "legislativo-ibirapitanga",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#991B1B"
    },
    "ios": {
      "bundleIdentifier": "br.gov.ibirapitanga.legislativo",
      "supportsTablet": true
    },
    "android": {
      "package": "br.gov.ibirapitanga.legislativo",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#991B1B"
      }
    }
  }
}
```

### 18.2 Build para Android

```bash
eas build --platform android
```

### 18.3 Build para iOS

```bash
eas build --platform ios
```

### 18.4 Publicar nas lojas

- Google Play Store
- Apple App Store

### ✅ Critérios de Conclusão Etapa 18

- [ ] app.json configurado
- [ ] Build Android gerado
- [ ] Build iOS gerado
- [ ] Pronto para publicação

---

## 📚 Dependências Finais do Projeto

```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "expo-status-bar": "~1.12.1",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "react-native-screens": "~3.31.1",
    "react-native-safe-area-context": "4.10.5",
    "@expo/vector-icons": "^14.0.0",
    "react-native-calendars": "^1.1305.0",
    "@react-native-async-storage/async-storage": "1.23.1",
    "expo-linking": "~6.3.1",
    "react-native-gesture-handler": "~2.16.1",
    "expo-av": "~14.0.6",
    "expo-splash-screen": "~0.27.5",
    "expo-notifications": "~0.28.9",
    "expo-sharing": "~12.0.1",
    "@faker-js/faker": "^8.4.1",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.45",
    "@types/react-native": "^0.72.0",
    "typescript": "^5.1.3"
  }
}
```

---

## 🎯 Checklist Final de Conclusão

### Funcionalidades Core

- [ ] Navegação entre todas as telas
- [ ] Tela inicial com menu funcional
- [ ] Lista de vereadores e mesa diretora
- [ ] Agenda com calendário
- [ ] Sessões legislativas
- [ ] Sistema de votações
- [ ] Projetos de lei
- [ ] Leis municipais
- [ ] Pesquisa pública
- [ ] Sistema de feedback
- [ ] Transmissão ao vivo
- [ ] Notícias

### Visual e UX

- [ ] Design consistente
- [ ] Cores institucionais
- [ ] Animações suaves
- [ ] Feedback visual
- [ ] Loading states
- [ ] Estados vazios
- [ ] Mensagens de erro

### Performance

- [ ] Listas otimizadas
- [ ] Imagens otimizadas
- [ ] Sem travamentos
- [ ] Tempo de resposta adequado

### Compatibilidade

- [ ] Funciona em iOS
- [ ] Funciona em Android
- [ ] Responsivo em diferentes telas
- [ ] Suporta orientações

### Qualidade

- [ ] Sem bugs críticos
- [ ] Código organizado
- [ ] TypeScript sem erros
- [ ] Pronto para produção

---

## 📖 Comandos Úteis

### Desenvolvimento

```bash
# Iniciar projeto
npx expo start

# Iniciar com cache limpo
npx expo start -c

# Rodar no iOS
npx expo start --ios

# Rodar no Android
npx expo start --android

# Verificar TypeScript
npx tsc --noEmit
```

### Build

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login no Expo
eas login

# Configurar build
eas build:configure

# Build de desenvolvimento
eas build --profile development --platform android

# Build de produção
eas build --profile production --platform all
```

---

## 📝 Notas Importantes

1. **Dados Mockados com Faker.js:** Todas as etapas usam o gerador Faker.js para dados realistas e dinâmicos
2. **Geração Automática:** Os dados são gerados automaticamente a cada inicialização (ou com seed fixo para consistência)
3. **Faker.js PT-BR:** Configurado para gerar nomes, textos e dados em português brasileiro
4. **Fácil Migração:** Estrutura preparada para fácil substituição por API real no futuro (ETAPA 16)
5. **Backend Futuro:** O projeto está estruturado para facilitar a integração com backend próprio posteriormente
6. **Ordem das Etapas:** Seguir a ordem sugerida para evitar dependências não resolvidas
7. **Testes Contínuos:** Testar cada funcionalidade após implementação
8. **Git:** Fazer commits ao final de cada etapa concluída
9. **Performance:** Usar FlatList para listas longas, não ScrollView
10. **TypeScript:** Manter tipagem forte em todo o código

---

## 🔄 Vantagens do Sistema de Mocks com Faker.js

### Durante o Desenvolvimento:

- ✅ **Dados Realistas:** Nomes, datas, textos parecem reais
- ✅ **Volume Controlado:** Gere quantos registros precisar
- ✅ **Desenvolvimento Offline:** Não precisa de internet ou servidor
- ✅ **Testes Variados:** Dados diferentes a cada execução
- ✅ **Seed Opcional:** Use seed fixo para testes consistentes

### Para o Futuro:

- ✅ **Migração Fácil:** Troque apenas a camada de serviço
- ✅ **Mesma Interface:** APIs mockadas imitam APIs reais
- ✅ **Zero Impacto:** Componentes não precisam mudar
- ✅ **Prototipagem Rápida:** Demonstre funcionalidades antes do backend

---

## 🏗️ Estrutura para Backend Futuro

Quando o backend for desenvolvido, a migração será simples:

### Passos para Integração Futura:

1. **Criar Backend** (Node.js, Python, etc.)

   - APIs REST ou GraphQL
   - Banco de dados (PostgreSQL, MySQL, MongoDB)
   - Autenticação e autorização

2. **Atualizar src/services/api.ts**

   - Substituir imports de mocks por chamadas HTTP
   - Manter mesmas interfaces e tipos
   - Adicionar tratamento de erros de rede

3. **Manter Mocks como Fallback**
   - Útil para desenvolvimento offline
   - Útil para testes automatizados
   - Modo desenvolvimento vs produção

```typescript
// Exemplo de migração futura:
// Antes (com mocks):
import { getVereadores } from "@/mocks/data";

// Depois (com API real):
import { api } from "@/services/api";
const getVereadores = () => api.get("/vereadores");
```

### Camada de Abstração:

O projeto já está estruturado com camada de serviço que facilita essa transição sem impactar componentes!

---

## 🚀 Próximos Passos

Após concluir todas as etapas, o aplicativo estará pronto para:

1. Integração com backend/API real da câmara
2. Testes beta com usuários
3. Ajustes finais baseados em feedback
4. Publicação nas lojas (App Store e Google Play)
5. Manutenção e atualizações

---

**Desenvolvido para:** Câmara Municipal de Ibirapitanga  
**Tecnologias:** React Native, Expo, TypeScript, React Navigation  
**Data:** Outubro 2025

---

## ✅ AGUARDANDO AUTORIZAÇÃO PARA INICIAR

**Aguardando confirmação para iniciar a implementação etapa por etapa.**

Por favor, confirme para começarmos pela **ETAPA 1 - Configuração Inicial do Projeto**.
