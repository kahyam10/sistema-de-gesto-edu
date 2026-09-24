# ✅ Configuração Completa - Web App + Reorganização de Portas

## 🎯 O que foi feito

### 1. ✅ Configuração Expo Web (marau-app)

**Arquivos criados/modificados**:

- ✅ **package.json** - Adicionadas dependências web:

  - `react-dom@19.1.0`
  - `react-native-web@~0.19.13`
  - Scripts: `build:web`, `serve:web`

- ✅ **app.json** - Configuração PWA:

  - Bundler: Metro
  - Output: Static
  - Theme color, lang, display standalone

- ✅ **Dockerfile.web** - Build Docker:

  - Stage 1: Node 20 Alpine (builder)
  - Stage 2: Nginx Alpine (production)
  - Port: 3034

- ✅ **nginx.conf** - Configuração Nginx:

  - SPA routing (todas rotas → index.html)
  - Gzip compression
  - Cache de 1 ano para assets
  - Security headers

- ✅ **.dockerignore** - Otimização build:

  - Exclui: node_modules, .expo, android, ios

- ✅ **DEPLOY_WEB.md** - Documentação completa:
  - 1.279 linhas de documentação
  - Guia passo a passo Coolify
  - Troubleshooting
  - PWA features

---

### 2. ✅ Reorganização de Portas (3030-3035)

**Arquivos atualizados**:

#### Backend:

- ✅ **backend/.env.example**:
  - PORT: 3333 → **3031**
  - DATABASE_URL: 5432 → **3032**
  - CORS: Adicionado localhost:3030, localhost:3034

#### Dashboard:

- ✅ **dashboard/.env.example**:

  - Documentação completa de portas
  - Referências atualizadas

- ✅ **dashboard/package.json**:
  - dev: `next dev -p 3030`
  - start: `next start -p 3030`

#### Documentação:

- ✅ **MAPA_PORTAS.md** - Novo arquivo:

  - Tabela completa de portas
  - Descrição de cada serviço
  - URLs produção/desenvolvimento
  - Troubleshooting

- ✅ **docker-compose.yml** - Novo arquivo:

  - Orquestração completa
  - Todos os serviços (PostgreSQL, Backend, Dashboard, Web App, pgAdmin)
  - Portas corretas
  - Persistent volumes
  - Health checks

- ✅ **README.md** - Atualizado:

  - Informações de portas
  - URLs de produção
  - Status dos serviços
  - Scripts atualizados
  - Versão 2.0.0

- ✅ **DEPLOY_COOLIFY.md** - Novo arquivo:
  - Guia completo de deploy
  - Todos os serviços
  - Variáveis de ambiente
  - Troubleshooting
  - Checklist

---

## 📊 Mapa de Portas

| Porta    | Serviço               | URL Produção                                 | Status      |
| -------- | --------------------- | -------------------------------------------- | ----------- |
| **3030** | Dashboard (Next.js)   | https://dashboard.camara.marau.kssoft.com.br | ✅ Online   |
| **3031** | API Backend (Fastify) | https://api.camara.marau.kssoft.com.br       | ✅ Online   |
| **3032** | PostgreSQL            | - (interno)                                  | ✅ Online   |
| **3033** | pgAdmin               | - (opcional)                                 | 📋 Opcional |
| **3034** | Web App (Expo)        | https://app.camara.marau.kssoft.com.br       | 🚀 Deploy   |
| **3035** | Reserva               | -                                            | -           |

---

## 🚀 Próximos Passos - DEPLOY WEB APP

### 1. Testar Build Local

```powershell
# Entrar na pasta do app
cd marau-app

# Instalar dependências (se necessário)
npm install

# Build web
npm run build:web

# Testar localmente
npm run serve:web
# Acessar: http://localhost:3034
```

**Verificar**:

- ✅ Build completa sem erros
- ✅ App abre corretamente
- ✅ Navegação funciona
- ✅ Imagens carregam
- ✅ API conecta (se configurada)

---

### 2. Testar Build Docker (Opcional)

```powershell
# Build da imagem
docker build -f Dockerfile.web -t marau-web-test .

# Rodar container
docker run -p 3034:3034 marau-web-test

# Testar no navegador
# http://localhost:3034
```

---

### 3. Deploy no Coolify

#### A. Preparar Repositório

```powershell
# Commitar todas as mudanças
git add .
git commit -m "feat: Configura Expo Web + reorganiza portas 3030-3035"
git push origin main
```

#### B. Criar Aplicação no Coolify

1. **Acessar Coolify** → Projects → Seu Projeto

2. **New Application** → From Git Repository

3. **Configurações**:

   ```
   Repository: [seu-repo]
   Branch: main
   Base Directory: marau-app
   Dockerfile: Dockerfile.web
   Port: 3034
   ```

4. **Domínio**:

   ```
   Domain: app.camara.marau.kssoft.com.br
   SSL: Let's Encrypt (Auto)
   ```

5. **Environment Variables** (opcional):

   ```
   EXPO_PUBLIC_API_URL=https://api.camara.marau.kssoft.com.br
   ```

   **Nota**: Se a URL da API está hardcoded em `src/config/api.ts`, não precisa.

6. **Deploy**!

#### C. Aguardar Build

- Build time: ~5-10 minutos
- Acompanhar logs no Coolify
- Aguardar SSL provisionar

---

### 4. Verificar Deploy

```powershell
# Health check
curl https://app.camara.marau.kssoft.com.br

# Verificar SSL
curl -I https://app.camara.marau.kssoft.com.br
```

**No navegador**:

1. Acessar https://app.camara.marau.kssoft.com.br
2. Verificar app carrega
3. Testar navegação
4. Verificar PWA (DevTools → Application)
5. Testar "Add to Home Screen"

---

### 5. Verificar CORS no Backend

Se o Web App não conectar à API, adicionar domínio ao CORS:

**Coolify** → Backend → Environment Variables:

```bash
ALLOWED_ORIGINS=https://dashboard.camara.marau.kssoft.com.br,https://app.camara.marau.kssoft.com.br
```

Depois: **Redeploy** backend

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos (7):

1. `marau-app/Dockerfile.web` - Build Docker
2. `marau-app/nginx.conf` - Config Nginx
3. `marau-app/.dockerignore` - Otimização build
4. `marau-app/DEPLOY_WEB.md` - Documentação deploy
5. `MAPA_PORTAS.md` - Documentação portas
6. `docker-compose.yml` - Orquestração
7. `DEPLOY_COOLIFY.md` - Guia deploy completo

### Arquivos Modificados (5):

1. `marau-app/package.json` - Deps web + scripts
2. `marau-app/app.json` - Config PWA
3. `backend/.env.example` - Portas + CORS
4. `dashboard/.env.example` - Portas + docs
5. `dashboard/package.json` - Porta 3030
6. `README.md` - Atualização completa

---

## 🔧 Desenvolvimento Local

### Iniciar todos os serviços (Docker Compose):

```powershell
# Raiz do projeto
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

**Acesso**:

- API: http://localhost:3031
- Dashboard: http://localhost:3030
- Web App: http://localhost:3034
- PostgreSQL: localhost:3032
- pgAdmin: http://localhost:3033

---

### Iniciar serviços individualmente:

```powershell
# Backend (porta 3031)
cd backend
npm run dev

# Dashboard (porta 3030)
cd dashboard
npm run dev

# Web App (porta 3034)
cd marau-app
npm run serve:web
```

---

## 📚 Documentação Disponível

| Arquivo                     | Descrição                                    |
| --------------------------- | -------------------------------------------- |
| **MAPA_PORTAS.md**          | Mapa completo de portas, URLs, configurações |
| **DEPLOY_COOLIFY.md**       | Guia deploy todos os serviços                |
| **marau-app/DEPLOY_WEB.md** | Deploy específico do web app                 |
| **README.md**               | Visão geral do projeto                       |
| **docker-compose.yml**      | Orquestração local/produção                  |

---

## ✅ Checklist Final

### Antes de Deploy:

- [x] Configuração Expo Web completa
- [x] Dockerfile.web criado
- [x] Nginx configurado
- [x] Documentação criada
- [x] Portas reorganizadas (3030-3035)
- [x] Backend .env.example atualizado
- [x] Dashboard .env.example atualizado
- [x] CORS configurado
- [x] README atualizado
- [x] docker-compose.yml criado
- [ ] Build local testado
- [ ] Commit e push

### Durante Deploy:

- [ ] Aplicação criada no Coolify
- [ ] Base directory: `marau-app`
- [ ] Dockerfile: `Dockerfile.web`
- [ ] Port: `3034`
- [ ] Domínio: `app.camara.marau.kssoft.com.br`
- [ ] SSL configurado
- [ ] Build concluído

### Após Deploy:

- [ ] App acessível na URL
- [ ] SSL ativo (HTTPS)
- [ ] Navegação funciona
- [ ] API conecta
- [ ] PWA instalável
- [ ] CORS verificado
- [ ] Logs sem erros

---

## 🎉 Resultado Final

Após seguir os passos acima, você terá:

✅ **Backend** em https://api.camara.marau.kssoft.com.br (porta 3031)  
✅ **Dashboard** em https://dashboard.camara.marau.kssoft.com.br (porta 3030)  
✅ **Web App** em https://app.camara.marau.kssoft.com.br (porta 3034)  
✅ **PostgreSQL** na porta 3032 (interno)  
✅ **Todas as portas organizadas** (3030-3035)  
✅ **Documentação completa**  
✅ **Sistema 100% em produção**

---

## 🆘 Suporte

### Troubleshooting:

Ver documentação específica:

- `DEPLOY_COOLIFY.md` - Seção 8 (Troubleshooting Geral)
- `marau-app/DEPLOY_WEB.md` - Seção Troubleshooting

### Comandos Úteis:

```powershell
# Ver logs (Coolify web interface)
# Ou via Docker local:
docker-compose logs -f [service]

# Restart serviço
docker-compose restart [service]

# Rebuild
docker-compose up -d --build [service]

# Status
docker-compose ps
```

---

**📅 Data**: 04 de janeiro de 2025  
**🚀 Versão**: 2.0.0  
**🔌 Portas**: 3030-3035  
**✅ Status**: Configuração completa, pronto para deploy!
