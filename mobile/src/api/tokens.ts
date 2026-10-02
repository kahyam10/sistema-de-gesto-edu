// Tokens da sessão SÓ no expo-secure-store (Keychain no iOS / Keystore no Android).
// Nunca em AsyncStorage, que é texto puro no aparelho.
//
// O par (access + refresh) fica numa ÚNICA chave, gravada de uma vez: se o app
// morrer no meio, sobra o par antigo inteiro ou o novo inteiro — nunca um
// access novo com um refresh já rotacionado (que o servidor trataria como
// reuso e derrubaria a sessão). As chaves separadas das versões anteriores
// são lidas uma vez e migradas.
import * as SecureStore from "expo-secure-store";

const CHAVE_SESSAO = "ge.sessao.par";
// Formato antigo (duas chaves) — só leitura para migrar
const CHAVE_ACCESS_ANTIGA = "ge.sessao.access";
const CHAVE_REFRESH_ANTIGA = "ge.sessao.refresh";

const opcoes: SecureStore.SecureStoreOptions = {
  // Só com o aparelho desbloqueado e sem migrar para backup/outro aparelho
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export interface ParDeTokens {
  access: string;
  refresh: string;
}

// Cache em memória para não ler o Keystore a cada request
let parEmMemoria: ParDeTokens | null = null;

function interpretar(bruto: string | null): ParDeTokens | null {
  if (!bruto) return null;
  try {
    const v = JSON.parse(bruto) as { a?: unknown; r?: unknown };
    if (typeof v.a === "string" && typeof v.r === "string" && v.a && v.r) {
      return { access: v.a, refresh: v.r };
    }
  } catch {
    // conteúdo corrompido: trata como sem sessão
  }
  return null;
}

async function gravar(par: ParDeTokens) {
  // Memória primeiro: mesmo se o Keystore falhar, o app em execução segue
  // com o par novo (o antigo já foi rotacionado no servidor).
  parEmMemoria = par;
  // Uma única escrita: atômica do ponto de vista do app
  await SecureStore.setItemAsync(CHAVE_SESSAO, JSON.stringify({ a: par.access, r: par.refresh }), opcoes);
}

async function apagarChavesAntigas() {
  await SecureStore.deleteItemAsync(CHAVE_ACCESS_ANTIGA, opcoes);
  await SecureStore.deleteItemAsync(CHAVE_REFRESH_ANTIGA, opcoes);
}

/** Par atual (memória → chave única → migração das chaves antigas). */
export async function lerPar(): Promise<ParDeTokens | null> {
  if (parEmMemoria) return parEmMemoria;
  const atual = interpretar(await SecureStore.getItemAsync(CHAVE_SESSAO, opcoes));
  if (atual) {
    parEmMemoria = atual;
    return atual;
  }
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(CHAVE_ACCESS_ANTIGA, opcoes),
    SecureStore.getItemAsync(CHAVE_REFRESH_ANTIGA, opcoes),
  ]);
  if (access && refresh) {
    // Migração: grava a chave nova ANTES de apagar as antigas
    await gravar({ access, refresh });
    await apagarChavesAntigas();
    return parEmMemoria;
  }
  // Par antigo incompleto não serve: sobra de uma gravação interrompida
  if (access || refresh) await apagarChavesAntigas();
  return null;
}

export async function lerAccess(): Promise<string | null> {
  return (await lerPar())?.access ?? null;
}

export async function lerRefresh(): Promise<string | null> {
  return (await lerPar())?.refresh ?? null;
}

export async function salvarTokens(access: string, refresh: string) {
  await gravar({ access, refresh });
}

export async function limparTokens() {
  parEmMemoria = null;
  await SecureStore.deleteItemAsync(CHAVE_SESSAO, opcoes);
  await apagarChavesAntigas();
}
