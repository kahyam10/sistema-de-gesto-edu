// Par de tokens numa única chave do secure-store (sem par inconsistente se o
// app morrer no meio da gravação) e renovação que sobrevive a resposta perdida.
const mockArmazenamento = new Map<string, string>();
jest.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
  getItemAsync: jest.fn(async (k: string) => mockArmazenamento.get(k) ?? null),
  setItemAsync: jest.fn(async (k: string, v: string) => void mockArmazenamento.set(k, v)),
  deleteItemAsync: jest.fn(async (k: string) => void mockArmazenamento.delete(k)),
}));

import * as SecureStore from "expo-secure-store";
import { api, registrarAoExpirarSessao } from "../src/api/client";
import { lerAccess, lerPar, lerRefresh, limparTokens, salvarTokens } from "../src/api/tokens";

const resposta = (status: number, corpo?: unknown) =>
  ({ status, ok: status >= 200 && status < 300, json: async () => corpo }) as Response;

describe("tokens numa chave única", () => {
  beforeEach(async () => {
    await limparTokens();
    mockArmazenamento.clear();
    jest.clearAllMocks();
  });

  it("salvar grava access+refresh numa ÚNICA escrita", async () => {
    await salvarTokens("acc-1", "ref-1");
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
    expect([...mockArmazenamento.keys()]).toEqual(["ge.sessao.par"]);
  });

  it("migra as chaves antigas e apaga-as depois de gravar a nova", async () => {
    mockArmazenamento.set("ge.sessao.access", "acc-antigo");
    mockArmazenamento.set("ge.sessao.refresh", "ref-antigo");
    expect(await lerPar()).toEqual({ access: "acc-antigo", refresh: "ref-antigo" });
    expect(mockArmazenamento.has("ge.sessao.par")).toBe(true);
    expect(mockArmazenamento.has("ge.sessao.access")).toBe(false);
    expect(mockArmazenamento.has("ge.sessao.refresh")).toBe(false);
  });

  it("par antigo incompleto (gravação interrompida) não é usado", async () => {
    mockArmazenamento.set("ge.sessao.access", "acc-solto");
    expect(await lerRefresh()).toBeNull();
    expect(await lerAccess()).toBeNull();
    expect(mockArmazenamento.size).toBe(0);
  });

  it("conteúdo corrompido na chave nova = sem sessão", async () => {
    mockArmazenamento.set("ge.sessao.par", "{nao-json");
    expect(await lerPar()).toBeNull();
  });
});

describe("renovação com resposta perdida", () => {
  beforeEach(async () => {
    await limparTokens();
    mockArmazenamento.clear();
    (global as { fetch?: unknown }).fetch = jest.fn();
  });

  it("rede cai na renovação → erro de conexão, tokens mantidos, sessão NÃO encerrada", async () => {
    await salvarTokens("velho", "refresh-velho");
    const expirou = jest.fn();
    registrarAoExpirarSessao(expirou);
    (fetch as jest.Mock)
      .mockResolvedValueOnce(resposta(401))
      .mockRejectedValueOnce(new TypeError("Network request failed"));
    await expect(api("/api/x")).rejects.toThrow("Sem conexão");
    expect(expirou).not.toHaveBeenCalled();
    expect(await lerRefresh()).toBe("refresh-velho");

    // próxima tentativa: o servidor reemite a partir do mesmo refresh
    (fetch as jest.Mock)
      .mockResolvedValueOnce(resposta(401))
      .mockResolvedValueOnce(resposta(200, { accessToken: "novo", refreshToken: "refresh-novo" }))
      .mockResolvedValueOnce(resposta(200, { ok: 1 }));
    expect(await api("/api/x")).toEqual({ ok: 1 });
    const refreshCall = (fetch as jest.Mock).mock.calls[3];
    expect(JSON.parse(refreshCall[1].body)).toEqual({ refreshToken: "refresh-velho" });
    expect(await lerPar()).toEqual({ access: "novo", refresh: "refresh-novo" });
    registrarAoExpirarSessao(null);
  });

  it("corpo da renovação cortado → tratado como falta de rede", async () => {
    await salvarTokens("velho", "refresh-velho");
    (fetch as jest.Mock)
      .mockResolvedValueOnce(resposta(401))
      .mockResolvedValueOnce({ status: 200, ok: true, json: async () => { throw new SyntaxError("fim inesperado"); } } as unknown as Response);
    await expect(api("/api/x")).rejects.toThrow("Sem conexão");
    expect(await lerRefresh()).toBe("refresh-velho");
  });

  it("409 sem par novo guardado → sessão encerrada (não finge que renovou)", async () => {
    await salvarTokens("velho", "refresh-velho");
    const expirou = jest.fn();
    registrarAoExpirarSessao(expirou);
    (fetch as jest.Mock).mockResolvedValueOnce(resposta(401)).mockResolvedValueOnce(resposta(409, { code: "RETRY" }));
    await expect(api("/api/x")).rejects.toThrow("Sua sessão expirou");
    expect(expirou).toHaveBeenCalled();
    expect((fetch as jest.Mock).mock.calls).toHaveLength(2); // não repetiu o request com token velho
    registrarAoExpirarSessao(null);
  });

  it("renovações simultâneas usam uma única chamada (single-flight)", async () => {
    await salvarTokens("velho", "refresh-velho");
    let liberar: ((r: Response) => void) | null = null;
    (fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.endsWith("/api/auth/mobile/refresh")) {
        return new Promise<Response>((res) => (liberar = res));
      }
      return Promise.resolve(resposta((fetch as jest.Mock).mock.calls.length <= 2 ? 401 : 200, { ok: 1 }));
    });
    const a = api("/api/a");
    const b = api("/api/b");
    for (let i = 0; i < 100 && !liberar; i++) await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    liberar!(resposta(200, { accessToken: "novo", refreshToken: "refresh-novo" }));
    await Promise.all([a, b]);
    const renovacoes = (fetch as jest.Mock).mock.calls.filter(([u]) => String(u).endsWith("/mobile/refresh"));
    expect(renovacoes).toHaveLength(1);
  });
});
