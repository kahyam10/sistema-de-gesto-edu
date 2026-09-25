// Cliente HTTP: Bearer do secure-store, renovação única em 401 e fim de sessão.
const mockArmazenamento = new Map<string, string>();
jest.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
  getItemAsync: jest.fn(async (k: string) => mockArmazenamento.get(k) ?? null),
  setItemAsync: jest.fn(async (k: string, v: string) => void mockArmazenamento.set(k, v)),
  deleteItemAsync: jest.fn(async (k: string) => void mockArmazenamento.delete(k)),
}));

import { api, registrarAoExpirarSessao } from "../src/api/client";
import { lerAccess, salvarTokens, limparTokens } from "../src/api/tokens";

const resposta = (status: number, corpo?: unknown) =>
  ({ status, ok: status >= 200 && status < 300, json: async () => corpo }) as Response;

describe("cliente da API", () => {
  beforeEach(async () => {
    await limparTokens();
    (global as { fetch?: unknown }).fetch = jest.fn();
  });

  it("envia o access token como Bearer", async () => {
    await salvarTokens("access-1", "refresh-1");
    (fetch as jest.Mock).mockResolvedValueOnce(resposta(200, { ok: true }));
    await api("/api/portal/meu/alunos");
    const [, init] = (fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer access-1");
  });

  it("401 → renova uma vez, salva o novo par e repete o request", async () => {
    await salvarTokens("velho", "refresh-velho");
    (fetch as jest.Mock)
      .mockResolvedValueOnce(resposta(401))
      .mockResolvedValueOnce(resposta(200, { accessToken: "novo", refreshToken: "refresh-novo" }))
      .mockResolvedValueOnce(resposta(200, [1, 2]));
    const r = await api<number[]>("/api/x");
    expect(r).toEqual([1, 2]);
    expect(await lerAccess()).toBe("novo");
    const refreshCall = (fetch as jest.Mock).mock.calls[1];
    expect(refreshCall[0]).toMatch(/\/api\/auth\/mobile\/refresh$/);
    expect(JSON.parse(refreshCall[1].body)).toEqual({ refreshToken: "refresh-velho" });
  });

  it("refresh recusado → limpa tokens e avisa o fim da sessão", async () => {
    await salvarTokens("velho", "refresh-velho");
    const expirou = jest.fn();
    registrarAoExpirarSessao(expirou);
    (fetch as jest.Mock)
      .mockResolvedValueOnce(resposta(401))
      .mockResolvedValueOnce(resposta(401));
    await expect(api("/api/x")).rejects.toThrow("Sua sessão expirou");
    expect(expirou).toHaveBeenCalled();
    expect(await lerAccess()).toBeNull();
    registrarAoExpirarSessao(null);
  });

  it("mensagem de validação da API chega ao usuário", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      resposta(400, { error: "VALIDATION", message: "Dados inválidos", issues: [{ campo: "nome", mensagem: "Nome é obrigatório" }] })
    );
    await expect(api("/api/x", { method: "POST", body: {} })).rejects.toThrow("Nome é obrigatório");
  });

  it("sem rede → erro amigável", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new TypeError("Network request failed"));
    await expect(api("/api/x")).rejects.toThrow("Sem conexão");
  });
});
