# 🔌 Mapa de Portas do Projeto - Câmara Municipal

## 📊 Range Definido: 3030-3035

| Porta    | Serviço             | Tecnologia       | URL Produção                                   | URL Local               |
| -------- | ------------------- | ---------------- | ---------------------------------------------- | ----------------------- |
| **3030** | **Dashboard Admin** | Next.js 15       | `https://dashboard.camara.marau.kssoft.com.br` | `http://localhost:3030` |
| **3031** | **API Backend**     | Fastify + Prisma | `https://api.camara.marau.kssoft.com.br`       | `http://localhost:3031` |
| **3032** | **PostgreSQL**      | PostgreSQL 16    | -                                              | `localhost:3032`        |
| **3033** | **pgAdmin**         | pgAdmin 4        | `https://pgadmin.camara.marau.kssoft.com.br`   | `http://localhost:3033` |
| **3034** | **Web App**         | Expo Web + Nginx | `https://app.camara.marau.kssoft.com.br`       | `http://localhost:3034` |
| **3035** | **Reserva**         | -                | -                                              | -                       |

---

## 🚀 Serviços Detalhados

### 🖥️ Dashboard Admin (Porta 3030)

**Descrição**: Painel administrativo para gerenciar todo o conteúdo

**Stack**:

- Next.js 15.5.5
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui

**Funcionalidades**:

- Gerenciar vereadores
- Gerenciar comissões
- Gerenciar notícias, eventos
- Gerenciar projetos e leis
- Upload de arquivos

**Acesso**:

- Produção: `https://dashboard.camara.marau.kssoft.com.br`
- Local: `http://localhost:3030`
- Requer autenticação (JWT)

---

### 🔌 API Backend (Porta 3031)

**Descrição**: API REST para todos os serviços

**Stack**:

- Fastify 5.x
- Prisma ORM
- TypeScript
- PostgreSQL

**Endpoints Principais**:

```
/auth/login              → Autenticação
/vereadores              → CRUD Vereadores
/comissoes               → CRUD Comissões
/noticias                → CRUD Notícias
/eventos                 → CRUD Eventos
/projetos                → CRUD Projetos
/leis                    → CRUD Leis
/sessoes                 → CRUD Sessões
/votacoes                → CRUD Votações
/pesquisas               → CRUD Pesquisas
/upload                  → Upload de arquivos
/docs                    → Documentação Swagger
```

**Acesso**:

- Produção: `https://api.camara.marau.kssoft.com.br`
- Local: `http://localhost:3031`
- Docs: `https://api.camara.marau.kssoft.com.br/docs`

---

### 🗄️ PostgreSQL (Porta 3032)

**Descrição**: Banco de dados principal

**Versão**: PostgreSQL 16

**Databases**:

- `camara_db` - Banco principal

**Conexão**:

```
Host: localhost (local) / postgres (Docker)
Port: 3032
User: postgres
Database: camara_db
```

**String de Conexão**:

```
postgresql://user:password@localhost:3032/camara_db?schema=public
```

---

### 🛠️ pgAdmin (Porta 3033)

**Descrição**: Interface web para gerenciar PostgreSQL

**Versão**: pgAdmin 4

**Acesso**:

- Produção: `https://pgadmin.camara.marau.kssoft.com.br`
- Local: `http://localhost:3033`

**Login**:

```
Email: admin@camara.local
Password: admin
```

---

### 📱 Web App (Porta 3034)

**Descrição**: Aplicação web/mobile para cidadãos

**Stack**:

- Expo Web
- React Native Web
- TypeScript
- Nginx (produção)

**Funcionalidades**:

- Visualizar vereadores
- Acompanhar sessões ao vivo
- Consultar projetos e leis
- Ler notícias e eventos
- Participar de pesquisas

**Acesso**:

- Produção: `https://app.camara.marau.kssoft.com.br`
- Local: `http://localhost:3034`
- PWA installable ✅

---

### 🔓 Porta Reserva (3035)

Reservada para futuros serviços:

- Sistema de e-mail
- Serviço de notificações
- Analytics
- Etc.

---

## 🔧 Configuração de Desenvolvimento

### 1. Backend (API)

```bash
cd backend

# .env
PORT=3031
DATABASE_URL="postgresql://postgres:password@localhost:3032/camara_db"

npm run dev
```

### 2. Dashboard

```bash
cd dashboard

# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3031

npm run dev -- -p 3030
```

### 3. Web App

```bash
cd marau-app

npm run web
# ou
npm run serve:web  # build estático na porta 3034
```

### 4. PostgreSQL (Docker)

```bash
docker run -d \
  --name postgres-camara \
  -p 3032:5432 \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=camara_db \
  postgres:16-alpine
```

### 5. pgAdmin (Docker)

```bash
docker run -d \
  --name pgadmin-camara \
  -p 3033:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@camara.local \
  -e PGADMIN_DEFAULT_PASSWORD=admin \
  dpage/pgadmin4
```

---

## 🌐 URLs de Produção

```
┌─────────────────────────────────────────────────────────────────┐
│                    CÂMARA MUNICIPAL DE MARAÚ                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🖥️  Dashboard:  https://dashboard.camara.marau.kssoft.com.br   │
│  🔌  API:        https://api.camara.marau.kssoft.com.br         │
│  📱  Web App:    https://app.camara.marau.kssoft.com.br         │
│  🛠️  pgAdmin:    https://pgadmin.camara.marau.kssoft.com.br     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Firewall / Segurança

### Portas que devem estar abertas:

- **3030**: Dashboard (HTTPS via Coolify)
- **3031**: API (HTTPS via Coolify)
- **3034**: Web App (HTTPS via Coolify)

### Portas internas (não expor):

- **3032**: PostgreSQL (apenas Docker network)
- **3033**: pgAdmin (opcional, apenas se necessário)

---

## 📝 Checklist de Configuração

### Desenvolvimento Local:

- [ ] PostgreSQL rodando na 3032
- [ ] Backend rodando na 3031
- [ ] Dashboard rodando na 3030
- [ ] Web App rodando na 3034
- [ ] pgAdmin acessível na 3033 (opcional)

### Produção (Coolify):

- [ ] Backend deployado (porta 3031)
- [ ] Dashboard deployado (porta 3030)
- [ ] Web App deployado (porta 3034)
- [ ] PostgreSQL configurado
- [ ] Domínios configurados
- [ ] SSL ativo em todos os domínios

---

## 🐛 Troubleshooting

### Porta já em uso:

```bash
# Windows
netstat -ano | findstr :3031
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3031 | xargs kill -9
```

### Verificar portas abertas:

```bash
# Windows
netstat -ano | findstr "303"

# Linux/Mac
lsof -i -P -n | grep 303
```

---

**Última atualização**: 4 de novembro de 2025  
**Versão**: 2.0 (Reorganização de portas)
