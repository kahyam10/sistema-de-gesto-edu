# App mobile — Gestão Educacional

App Expo (SDK 54) para **professores** (chamada do dia, avaliações e notas) e
**responsáveis/alunos** (boletim, frequência e comunicados). Direção, secretaria
e SEMEC continuam no painel web.

Fica fora dos workspaces npm da raiz (lock próprio) para não conflitar a versão
do React com o dashboard.

## Rodar em desenvolvimento (emulador Android)

1. Suba a API: na raiz, `npm run dev:docker` (API em `127.0.0.1:3051`).
2. Aqui: `npm install` e depois `npm run android`.
   O emulador enxerga a sua máquina por `10.0.2.2`, então o app usa
   `http://10.0.2.2:3051` sem abrir a API para a rede.

Para apontar para outra API: `EXPO_PUBLIC_API_URL=https://api.exemplo.gov.br npm start`.
Build de produção **recusa** URL sem `https://` (ver `src/config.ts`).

## Sessão e segurança

- Login em `POST /api/auth/mobile/login`: devolve access token (15 min) e
  refresh token rotativo no corpo.
- Os dois ficam **só** no `expo-secure-store` (Keychain/Keystore,
  `WHEN_UNLOCKED_THIS_DEVICE_ONLY`). Nunca no AsyncStorage.
- Requisições usam `Authorization: Bearer`. Em 401 o cliente renova uma única vez
  (`src/api/client.ts`); se a renovação falhar, apaga os tokens e volta ao login.
- Sair revoga a sessão no servidor e limpa o cache local.
- O professor só vê e lança dados das próprias turmas (validado no servidor).

## Comandos

| Comando | O que faz |
|---|---|
| `npm run android` | Expo no emulador Android |
| `npm test` | testes (jest-expo) |
| `npm run typecheck` | `tsc --noEmit` |
| `npx expo-doctor` | confere versões do SDK |

## Estrutura

```
src/
  api/         cliente HTTP, tokens (secure-store), endpoints e tipos
  auth/        AuthContext (login, reidratação, logout)
  navigation/  navegação por papel (professor × responsável)
  screens/     telas (professor/, responsavel/)
  components/  UI compartilhada
```

Pendente: notificações push (precisa de credenciais Firebase/EAS) e o endpoint
de cadastro do responsável pelo próprio app (hoje a secretaria cria o acesso).
