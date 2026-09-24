# 📋 Relatório de Gaps - Projetos Existentes

## Análise Detalhada do que Falta para o Sistema de Votação em Tempo Real

**Data:** 12 de Dezembro de 2025

---

## 1. 🔧 Backend (apps/backend)

### 1.1 Situação Atual

✅ **O que já existe:**

- API REST completa com Fastify
- Prisma ORM configurado com PostgreSQL
- Autenticação JWT (admin)
- CRUD completo: Sessões, Votações, Votos, Vereadores
- Sistema de ItemPauta com reordenação
- Upload de arquivos com Sharp
- Swagger documentação

❌ **O que falta:**

| Componente           | Prioridade | Complexidade | Descrição                        |
| -------------------- | ---------- | ------------ | -------------------------------- |
| Socket.IO Server     | CRÍTICA    | Média        | WebSocket para tempo real        |
| Auth Vereadores      | CRÍTICA    | Baixa        | Login separado para vereadores   |
| Models Tempo Real    | CRÍTICA    | Baixa        | 5 novos models no Prisma         |
| Rotas Sessão AoVivo  | ALTA       | Média        | Controle de sessão em tempo real |
| Rotas Votação AoVivo | ALTA       | Média        | Abertura/fechamento de votação   |
| Rotas Oradores       | ALTA       | Média        | Fila de oradores e cronômetro    |
| Rotas Presença       | MÉDIA      | Baixa        | Registro de presença             |

### 1.2 Modificações Necessárias

#### A) Novas Dependências (package.json)

```diff
{
  "dependencies": {
+   "socket.io": "^4.7.0",
+   "@socket.io/admin-ui": "^0.5.0"
  }
}
```

#### B) Novos Models Prisma

**Arquivo:** `prisma/schema.prisma`

Adicionar ao final:

```prisma
// ==================== SISTEMA TEMPO REAL ====================

model SessaoAoVivo {
  id              Int       @id @default(autoincrement())
  sessaoId        Int       @unique
  sessao          Sessao    @relation(fields: [sessaoId], references: [id], onDelete: Cascade)

  status          String    @default("nao_iniciada")
  itemAtualOrdem  Int?

  iniciadaEm      DateTime?
  suspensaEm      DateTime?
  encerradaEm     DateTime?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@map("sessoes_ao_vivo")
}

model PresencaSessao {
  id          Int       @id @default(autoincrement())
  sessaoId    Int
  sessao      Sessao    @relation(fields: [sessaoId], references: [id], onDelete: Cascade)
  vereadorId  Int
  vereador    Vereador  @relation(fields: [vereadorId], references: [id])

  status      String    @default("presente")
  registradoEm DateTime @default(now())

  @@unique([sessaoId, vereadorId])
  @@map("presencas_sessao")
}

model VotacaoAoVivo {
  id              Int       @id @default(autoincrement())
  votacaoId       Int       @unique
  votacao         Votacao   @relation(fields: [votacaoId], references: [id], onDelete: Cascade)

  status          String    @default("fechada")
  tempoLimite     Int?
  abertaEm        DateTime?
  encerradaEm     DateTime?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@map("votacoes_ao_vivo")
}

model Orador {
  id              Int       @id @default(autoincrement())
  sessaoId        Int
  sessao          Sessao    @relation(fields: [sessaoId], references: [id], onDelete: Cascade)
  vereadorId      Int
  vereador        Vereador  @relation(fields: [vereadorId], references: [id])

  tipo            String
  status          String    @default("aguardando")
  ordem           Int
  tempoMaximo     Int       @default(300)
  tempoUsado      Int       @default(0)

  solicitadoEm    DateTime  @default(now())
  inicioFalaEm    DateTime?
  fimFalaEm       DateTime?

  @@map("oradores")
}

model VereadorAuth {
  id          Int       @id @default(autoincrement())
  vereadorId  Int       @unique
  vereador    Vereador  @relation(fields: [vereadorId], references: [id], onDelete: Cascade)

  email       String    @unique
  senhaHash   String
  ativo       Boolean   @default(true)

  ultimoLogin DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("vereadores_auth")
}
```

#### C) Atualizar Models Existentes

**Vereador** - Adicionar relações:

```prisma
model Vereador {
  // ... campos existentes ...

  // Novos relacionamentos
  presencas     PresencaSessao[]
  oradores      Orador[]
  auth          VereadorAuth?
}
```

**Sessao** - Adicionar relações:

```prisma
model Sessao {
  // ... campos existentes ...

  // Novos relacionamentos
  aoVivo        SessaoAoVivo?
  presencas     PresencaSessao[]
  oradores      Orador[]
}
```

**Votacao** - Adicionar relação:

```prisma
model Votacao {
  // ... campos existentes ...

  // Novo relacionamento
  aoVivo        VotacaoAoVivo?
}
```

#### D) Novos Arquivos

```
src/
├── lib/
│   └── socket.ts              # NOVO - Configuração Socket.IO
├── routes/
│   ├── sessao-ao-vivo.routes.ts    # NOVO
│   ├── presenca.routes.ts          # NOVO
│   ├── votacao-ao-vivo.routes.ts   # NOVO
│   ├── orador.routes.ts            # NOVO
│   └── vereador-auth.routes.ts     # NOVO
├── controllers/
│   ├── sessao-ao-vivo.controller.ts
│   ├── presenca.controller.ts
│   ├── votacao-ao-vivo.controller.ts
│   ├── orador.controller.ts
│   └── vereador-auth.controller.ts
├── services/
│   ├── socket.service.ts           # NOVO - Emissão de eventos
│   ├── sessao-ao-vivo.service.ts
│   ├── presenca.service.ts
│   ├── votacao-ao-vivo.service.ts
│   └── orador.service.ts
└── middleware/
    └── vereador-auth.middleware.ts # NOVO - Auth separada
```

#### E) Modificar server.ts

```diff
import { setupSwagger } from "./swagger.js";
+ import { setupSocketIO } from "./lib/socket.js";
+ import { sessaoAoVivoRoutes } from "./routes/sessao-ao-vivo.routes.js";
+ import { presencaRoutes } from "./routes/presenca.routes.js";
+ import { votacaoAoVivoRoutes } from "./routes/votacao-ao-vivo.routes.js";
+ import { oradorRoutes } from "./routes/orador.routes.js";
+ import { vereadorAuthRoutes } from "./routes/vereador-auth.routes.js";

// ... após criar o servidor ...

+ // Socket.IO
+ const io = setupSocketIO(app);
+ app.decorate('io', io);

// Rotas existentes...

+ // Novas rotas tempo real
+ await app.register(sessaoAoVivoRoutes, { prefix: "/sessoes-ao-vivo" });
+ await app.register(presencaRoutes, { prefix: "/presencas" });
+ await app.register(votacaoAoVivoRoutes, { prefix: "/votacoes-ao-vivo" });
+ await app.register(oradorRoutes, { prefix: "/oradores" });
+ await app.register(vereadorAuthRoutes, { prefix: "/vereadores/auth" });
```

---

## 2. 📊 Dashboard (apps/dashboard)

### 2.1 Situação Atual

✅ **O que já existe:**

- Next.js 15 com App Router
- CRUD completo para todas entidades
- Sistema de sessões com ItemPauta
- Sistema de votações
- Autenticação admin
- Tailwind + Shadcn UI

❌ **O que falta:**

| Componente            | Prioridade | Complexidade | Descrição              |
| --------------------- | ---------- | ------------ | ---------------------- |
| Socket.IO Client      | CRÍTICA    | Baixa        | Conexão WebSocket      |
| Páginas Sessão AoVivo | ALTA       | Média        | Controle em tempo real |
| Controle Votação      | ALTA       | Média        | Abrir/fechar votações  |
| Gerenciar Oradores    | ALTA       | Média        | Fila e cronômetro      |
| CRUD Credenciais      | MÉDIA      | Baixa        | Login dos vereadores   |
| Hook useSocket        | MÉDIA      | Baixa        | Abstração do Socket.IO |

### 2.2 Modificações Necessárias

#### A) Novas Dependências (package.json)

```diff
{
  "dependencies": {
+   "socket.io-client": "^4.7.0"
  }
}
```

#### B) Novos Arquivos/Pastas

```
src/
├── hooks/
│   └── useSocket.ts           # NOVO
├── contexts/
│   └── SocketContext.tsx      # NOVO
├── lib/
│   └── socket.ts              # NOVO - Cliente Socket.IO
├── app/(dashboard)/
│   ├── sessao-ao-vivo/
│   │   ├── page.tsx           # NOVO - Lista sessões ativas
│   │   └── [id]/
│   │       ├── page.tsx       # NOVO - Controle da sessão
│   │       ├── presencas/
│   │       │   └── page.tsx   # NOVO - Ver presenças
│   │       ├── votacoes/
│   │       │   └── page.tsx   # NOVO - Controle votações
│   │       └── oradores/
│   │           └── page.tsx   # NOVO - Fila oradores
│   └── vereadores/
│       └── credenciais/
│           └── page.tsx       # NOVO - CRUD credenciais
├── components/
│   ├── sessao-ao-vivo/
│   │   ├── ControlesSessao.tsx
│   │   ├── PainelPresencas.tsx
│   │   ├── PainelVotacao.tsx
│   │   ├── FilaOradores.tsx
│   │   └── CronometroAdmin.tsx
│   └── credenciais/
│       └── CredencialForm.tsx
└── types/
    └── realtime.ts            # NOVO - Tipos tempo real
```

#### C) Modificar Páginas Existentes

**sessoes/page.tsx** - Adicionar indicador de sessão ativa:

```diff
// Adicionar badge "AO VIVO" para sessões em andamento
// Adicionar botão "Controlar" que leva para /sessao-ao-vivo/[id]
```

**votacoes/page.tsx** - Adicionar indicador de votação aberta:

```diff
// Adicionar badge "ABERTA" para votações em andamento
// Adicionar ação rápida para abrir/fechar votação
```

#### D) Modificar Sidebar

**Adicionar novo item no menu:**

```tsx
{
  title: "Sessão ao Vivo",
  href: "/sessao-ao-vivo",
  icon: Radio, // ou outro ícone apropriado
  badge: sessaoAtiva ? "AO VIVO" : undefined
}
```

---

## 3. 📱 App Cidadão (apps/legislativo-app)

### 3.1 Situação Atual

✅ **O que já existe:**

- Expo SDK 54 com React Native
- Telas de listagem: Sessões, Votações, Vereadores, Leis, Projetos
- Telas de detalhe para cada entidade
- API service configurado
- Navigation com Tabs

❌ **O que falta (OPCIONAL - baixa prioridade):**

| Componente              | Prioridade | Complexidade | Descrição               |
| ----------------------- | ---------- | ------------ | ----------------------- |
| Indicador Sessão Ativa  | BAIXA      | Baixa        | Badge "AO VIVO"         |
| Tela Votação Tempo Real | BAIXA      | Média        | Ver votação acontecendo |
| Push Notifications      | BAIXA      | Média        | Alertas de sessão       |

### 3.2 Modificações Sugeridas

Estas são **opcionais** e podem ser feitas depois:

```
src/
├── hooks/
│   └── useSessaoAtiva.ts      # Verificar se há sessão ao vivo
├── components/
│   └── BadgeAoVivo.tsx        # Indicador visual
└── screens/
    └── VotacaoAoVivoScreen.tsx # Nova tela (opcional)
```

---

## 4. 📊 Resumo de Esforço

### Estimativa de Horas

| Projeto                | Componente                 | Horas Estimadas             |
| ---------------------- | -------------------------- | --------------------------- |
| **Backend**            | Socket.IO Setup            | 4h                          |
|                        | Models Prisma + Migration  | 2h                          |
|                        | Rotas Sessão AoVivo        | 6h                          |
|                        | Rotas Presença             | 3h                          |
|                        | Rotas Votação AoVivo       | 6h                          |
|                        | Rotas Oradores             | 6h                          |
|                        | Auth Vereadores            | 4h                          |
|                        | Testes                     | 8h                          |
| **Subtotal Backend**   |                            | **39h**                     |
| **Dashboard**          | Socket.IO Client + Context | 3h                          |
|                        | Páginas Sessão AoVivo      | 8h                          |
|                        | Controle Votação           | 6h                          |
|                        | Gerenciar Oradores         | 6h                          |
|                        | CRUD Credenciais           | 4h                          |
|                        | Ajustes UI                 | 4h                          |
| **Subtotal Dashboard** |                            | **31h**                     |
| **Painel Votação**     | Setup Projeto              | 2h                          |
|                        | Layout Principal           | 6h                          |
|                        | Componentes Tempo Real     | 12h                         |
|                        | Socket.IO Integration      | 4h                          |
|                        | Modo Fullscreen            | 3h                          |
|                        | Deploy                     | 2h                          |
| **Subtotal Painel**    |                            | **29h**                     |
| **App Vereador**       | Setup Projeto              | 2h                          |
|                        | Autenticação               | 6h                          |
|                        | Telas Principais           | 16h                         |
|                        | Socket.IO Integration      | 6h                          |
|                        | Notificações               | 4h                          |
|                        | Testes Dispositivos        | 8h                          |
| **Subtotal App**       |                            | **42h**                     |
| **TOTAL GERAL**        |                            | **141h (~3.5 semanas FTE)** |

---

## 5. 🎯 Ordem de Implementação Recomendada

### Semana 1: Backend Tempo Real

1. ✅ Adicionar dependências Socket.IO
2. ✅ Criar models Prisma e rodar migration
3. ✅ Implementar lib/socket.ts
4. ✅ Implementar rotas sessao-ao-vivo
5. ✅ Implementar rotas presenca
6. ✅ Implementar rotas votacao-ao-vivo
7. ✅ Implementar rotas orador

### Semana 2: Backend + Dashboard

1. ✅ Implementar auth vereadores no backend
2. ✅ Testes de integração backend
3. ✅ Setup Socket.IO no dashboard
4. ✅ Páginas sessao-ao-vivo no dashboard
5. ✅ Controle de votação no dashboard

### Semana 3: Dashboard + Painel

1. ✅ Gerenciamento de oradores
2. ✅ CRUD credenciais vereadores
3. ✅ Criar projeto painel-votacao
4. ✅ Layout e componentes principais

### Semana 4: Painel + App Vereador

1. ✅ Finalizar painel-votacao
2. ✅ Deploy painel-votacao no Coolify
3. ✅ Criar projeto vereador-app
4. ✅ Telas de autenticação

### Semana 5: App Vereador

1. ✅ Telas principais do app
2. ✅ Integração Socket.IO
3. ✅ Sistema de notificações
4. ✅ Testes em dispositivos

### Semana 6: Finalização

1. ✅ Testes de integração completos
2. ✅ Simulação de sessão real
3. ✅ Ajustes finais de UX
4. ✅ Documentação
5. ✅ Deploy produção todos componentes

---

## 6. 📁 Arquivos para Criar/Modificar

### Backend - 17 arquivos

**Novos (12):**

- `src/lib/socket.ts`
- `src/routes/sessao-ao-vivo.routes.ts`
- `src/routes/presenca.routes.ts`
- `src/routes/votacao-ao-vivo.routes.ts`
- `src/routes/orador.routes.ts`
- `src/routes/vereador-auth.routes.ts`
- `src/controllers/sessao-ao-vivo.controller.ts`
- `src/controllers/presenca.controller.ts`
- `src/controllers/votacao-ao-vivo.controller.ts`
- `src/controllers/orador.controller.ts`
- `src/controllers/vereador-auth.controller.ts`
- `src/middleware/vereador-auth.middleware.ts`

**Modificar (5):**

- `package.json`
- `prisma/schema.prisma`
- `src/server.ts`
- `src/env.ts` (novas variáveis)
- `Dockerfile` (se precisar expor porta WS)

### Dashboard - 14 arquivos

**Novos (12):**

- `src/lib/socket.ts`
- `src/hooks/useSocket.ts`
- `src/contexts/SocketContext.tsx`
- `src/types/realtime.ts`
- `src/app/(dashboard)/sessao-ao-vivo/page.tsx`
- `src/app/(dashboard)/sessao-ao-vivo/[id]/page.tsx`
- `src/app/(dashboard)/sessao-ao-vivo/[id]/presencas/page.tsx`
- `src/app/(dashboard)/sessao-ao-vivo/[id]/votacoes/page.tsx`
- `src/app/(dashboard)/sessao-ao-vivo/[id]/oradores/page.tsx`
- `src/app/(dashboard)/vereadores/credenciais/page.tsx`
- `src/components/sessao-ao-vivo/*.tsx` (5 componentes)
- `src/services/realtime.ts`

**Modificar (2):**

- `package.json`
- `src/components/layout/sidebar.tsx`

---

**Documento gerado por:** GitHub Copilot  
**Versão:** 1.0  
**Data:** 12/12/2025
