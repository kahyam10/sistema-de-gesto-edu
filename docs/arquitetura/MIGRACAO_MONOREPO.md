# 🔄 Migração para Monorepo

## 📊 Situação Atual

```
CAMARA/
├── .git/              ← Git raiz (tem commits locais)
├── backend/
│   └── .git/          ← Git separado (repositório GitHub: kahyam10/api-camara)
├── dashboard/
│   └── .git/          ← Git separado (repositório GitHub: kahyam10/dashboard-camara)
├── marau-app/
│   └── .git/          ← Git separado (sem remote)
└── legislativo-app/
    └── .git/          ← Git separado (sem remote)
```

## 🎯 Objetivo

```
CAMARA/ (monorepo)
├── .git/              ← Git único
├── apps/
│   ├── backend/       ← Sem .git
│   ├── dashboard/     ← Sem .git
│   ├── marau-app/     ← Sem .git
│   └── legislativo-app/ ← Sem .git
├── docs/
├── DATA/
└── package.json       ← Workspace root
```

## 📋 Plano de Migração

### Opção 1: Migração Simples (Recomendada)

**Vantagens:**

- ✅ Rápida
- ✅ Mantém histórico recente
- ✅ Estrutura limpa

**Desvantagens:**

- ⚠️ Perde histórico completo dos sub-repos

**Passos:**

1. Fazer backup de tudo
2. Remover `.git` das subpastas
3. Reorganizar estrutura (apps/, packages/)
4. Criar workspace root (package.json)
5. Commit tudo no Git raiz
6. Push para novo repositório GitHub

### Opção 2: Migração com Preservação de Histórico

**Vantagens:**

- ✅ Mantém TODO o histórico
- ✅ Preserva commits dos 4 repos

**Desvantagens:**

- ⚠️ Mais complexa
- ⚠️ Requer git subtree/submodule

**Passos:**

1. Usar `git subtree` para mesclar históricos
2. Reorganizar com `git mv`
3. Configurar workspace

### Opção 3: Híbrida (Melhor Custo-Benefício)

**Vantagens:**

- ✅ Preserva histórico do backend (principal)
- ✅ Mais simples que Opção 2
- ✅ Mantém rastreabilidade

**Desvantagens:**

- ⚠️ Histórico de dashboard/apps não mesclado

**Passos:**

1. Manter Git raiz
2. Remover `.git` das subpastas
3. Adicionar tudo ao Git raiz
4. Criar tags com último commit de cada sub-repo

## 🚀 Recomendação: Opção 1 (Migração Simples)

Para este projeto, recomendo a **Opção 1** porque:

1. ✅ Backend já tem ~15 commits no GitHub (preservados)
2. ✅ Dashboard tem ~5 commits no GitHub (preservados)
3. ✅ Apps ainda não têm remote (sem risco)
4. ✅ Repositórios GitHub originais continuam existindo como backup
5. ✅ Estrutura fica mais limpa e fácil de manter

## 📝 Passo a Passo - Opção 1

### 1. Backup de Segurança

```powershell
# Fazer backup completo
cd D:\PROJETOS
Copy-Item -Path "CAMARA" -Destination "CAMARA_BACKUP_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse
```

### 2. Verificar Repositórios Remotos

```powershell
cd D:\PROJETOS\CAMARA

# Backend
cd backend
git remote -v
git log --oneline -5

# Dashboard
cd ../dashboard
git remote -v
git log --oneline -5

# Apps (verificar se tem commits importantes)
cd ../marau-app
git log --oneline -5

cd ../legislativo-app
git log --oneline -5
```

### 3. Fazer Push Final dos Repos

```powershell
# Garantir que tudo está no GitHub
cd D:\PROJETOS\CAMARA\backend
git push origin master

cd ../dashboard
git push origin master
```

### 4. Remover .git das Subpastas

```powershell
cd D:\PROJETOS\CAMARA

# Remover .git (cuidado!)
Remove-Item -Recurse -Force backend\.git
Remove-Item -Recurse -Force dashboard\.git
Remove-Item -Recurse -Force marau-app\.git
Remove-Item -Recurse -Force legislativo-app\.git
```

### 5. Reorganizar Estrutura

```powershell
cd D:\PROJETOS\CAMARA

# Criar pasta apps/
New-Item -ItemType Directory -Path "apps" -Force

# Mover projetos
Move-Item backend apps/
Move-Item dashboard apps/
Move-Item marau-app apps/
Move-Item legislativo-app apps/
```

### 6. Criar package.json Root

```json
{
  "name": "camara-marau-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["apps/*"],
  "scripts": {
    "dev:backend": "npm run dev --workspace=apps/backend",
    "dev:dashboard": "npm run dev --workspace=apps/dashboard",
    "dev:marau": "npm start --workspace=apps/marau-app",
    "dev:all": "concurrently \"npm run dev:backend\" \"npm run dev:dashboard\"",
    "build:backend": "npm run build --workspace=apps/backend",
    "build:dashboard": "npm run build --workspace=apps/dashboard",
    "build:all": "npm run build:backend && npm run build:dashboard"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

### 7. Criar .gitignore Root

```gitignore
# Dependencies
node_modules/
package-lock.json

# Builds
dist/
build/
.next/

# Environment
.env
.env.local
.env*.local

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Logs
logs/
*.log
npm-debug.log*

# Uploads
uploads/

# Expo
.expo/
```

### 8. Commit no Git Raiz

```powershell
cd D:\PROJETOS\CAMARA

git add .
git commit -m "refactor: migrar para monorepo com workspaces"
```

### 9. Criar Repositório GitHub

```powershell
# Criar novo repo no GitHub: kahyam10/camara-marau-monorepo
# Depois:

git remote add origin https://github.com/kahyam10/camara-marau-monorepo.git
git branch -M main
git push -u origin main
```

### 10. Atualizar Coolify

No Coolify, atualizar os paths:

- Backend: `apps/backend`
- Dashboard: `apps/dashboard`

## 📁 Estrutura Final

```
camara-marau-monorepo/
├── .git/
├── .gitignore
├── package.json
├── README.md
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── dashboard/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── marau-app/
│   │   ├── src/
│   │   ├── app.json
│   │   └── package.json
│   └── legislativo-app/
│       ├── src/
│       ├── app.json
│       └── package.json
├── docs/
│   ├── DEPLOY_COOLIFY.md
│   ├── SISTEMA_CONFIGURACAO_DINAMICA.md
│   └── ...
└── DATA/
    ├── MARAU/
    └── IBIRAPITANGA/
```

## ✅ Benefícios do Monorepo

1. **Gerenciamento Unificado**

   - ✅ Um único `git clone`
   - ✅ Uma branch para tudo
   - ✅ Pull requests unificados

2. **Dependências Compartilhadas**

   - ✅ Tipos TypeScript compartilhados
   - ✅ Configurações ESLint/Prettier comuns
   - ✅ Scripts de build centralizados

3. **Deploy Simplificado**

   - ✅ Coolify aponta para subpastas
   - ✅ CI/CD unificado
   - ✅ Versionamento sincronizado

4. **Desenvolvimento**
   - ✅ `npm run dev:all` roda tudo
   - ✅ Hot reload entre apps
   - ✅ Debug integrado

## 🔄 Rollback (Se Necessário)

Se algo der errado, restaurar backup:

```powershell
cd D:\PROJETOS
Remove-Item -Recurse -Force CAMARA
Copy-Item -Path "CAMARA_BACKUP_*" -Destination "CAMARA" -Recurse
```

## 📞 Suporte

Após migração, atualizar:

- [ ] README.md com nova estrutura
- [ ] Docs de deploy
- [ ] Configurações do Coolify
- [ ] Links em documentos

---

## ⚠️ ATENÇÃO

**ANTES DE EXECUTAR:**

1. ✅ Fazer backup completo
2. ✅ Verificar que backend/dashboard estão no GitHub
3. ✅ Commit de quaisquer mudanças pendentes
4. ✅ Testar em ambiente de desenvolvimento primeiro

**EXECUTAR EM ORDEM:**

1. Backup
2. Push final
3. Remover .git
4. Reorganizar
5. Commit
6. Push

---

**Tempo estimado:** 30-45 minutos
**Risco:** Baixo (com backup)
**Benefício:** Alto (organização e manutenção)
