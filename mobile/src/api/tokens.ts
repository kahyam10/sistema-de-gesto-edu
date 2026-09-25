// Tokens da sessão SÓ no expo-secure-store (Keychain no iOS / Keystore no Android).
// Nunca em AsyncStorage, que é texto puro no aparelho.
import * as SecureStore from "expo-secure-store";

const CHAVE_ACCESS = "ge.sessao.access";
const CHAVE_REFRESH = "ge.sessao.refresh";

const opcoes: SecureStore.SecureStoreOptions = {
  // Só com o aparelho desbloqueado e sem migrar para backup/outro aparelho
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

// Cache em memória para não ler o Keystore a cada request
let accessEmMemoria: string | null = null;

export async function lerAccess(): Promise<string | null> {
  if (accessEmMemoria) return accessEmMemoria;
  accessEmMemoria = await SecureStore.getItemAsync(CHAVE_ACCESS, opcoes);
  return accessEmMemoria;
}

export async function lerRefresh(): Promise<string | null> {
  return SecureStore.getItemAsync(CHAVE_REFRESH, opcoes);
}

export async function salvarTokens(access: string, refresh: string) {
  accessEmMemoria = access;
  await SecureStore.setItemAsync(CHAVE_ACCESS, access, opcoes);
  await SecureStore.setItemAsync(CHAVE_REFRESH, refresh, opcoes);
}

export async function limparTokens() {
  accessEmMemoria = null;
  await SecureStore.deleteItemAsync(CHAVE_ACCESS, opcoes);
  await SecureStore.deleteItemAsync(CHAVE_REFRESH, opcoes);
}
