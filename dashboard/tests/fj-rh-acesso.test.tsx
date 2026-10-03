// Frente J — exportações, licenças e ponto só para ADMIN, SEMEC e COORDENADOR
// (espelha RH_EXPORTACAO do backend). DIRETOR e SECRETARIA perdem o menu de
// Exportações e as abas de ponto/licenças; lotação e ACs continuam. Dados fictícios.
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render, renderHook, screen } from "@testing-library/react";

const authMock = vi.hoisted(() => ({ user: null as null | { id: string; role: string } }));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: authMock.user }) }));
vi.mock("@/components/rh/PontoDigitalManager", () => ({ PontoDigitalManager: () => <div>conteudo-ponto</div> }));
vi.mock("@/components/rh/LicencasManager", () => ({ LicencasManager: () => <div>conteudo-licencas</div> }));
vi.mock("@/components/rh/QuadroLotacao", () => ({ QuadroLotacao: () => <div>conteudo-lotacao</div> }));
vi.mock("@/components/rh/AtividadesComplementaresManager", () => ({
  AtividadesComplementaresManager: () => <div>conteudo-acs</div>,
}));

import { PAPEIS_RH, podeRH, usePodeRH } from "@/hooks/use-papel";
import { filterNavForRole, podeAcessarRota } from "@/components/shell/nav";
import RHPage from "@/app/(app)/rh/page";

const comPapel = (role: string | null) => {
  authMock.user = role ? { id: "u-fj", role } : null;
};

afterEach(() => {
  cleanup();
  comPapel(null);
});

describe("PAPEIS_RH / podeRH / usePodeRH", () => {
  it("lista igual à do backend (ADMIN, SEMEC, COORDENADOR)", () => {
    expect([...PAPEIS_RH].sort()).toEqual(["ADMIN", "COORDENADOR", "SEMEC"]);
  });

  it.each([
    ["ADMIN", true], ["SEMEC", true], ["COORDENADOR", true],
    ["DIRETOR", false], ["SECRETARIA", false], ["PROFESSOR", false],
    ["RESPONSAVEL", false], ["USER", false],
  ] as const)("%s → %s", (role, esperado) => {
    expect(podeRH(role)).toBe(esperado);
    comPapel(role);
    expect(renderHook(() => usePodeRH()).result.current).toBe(esperado);
  });

  it("sem usuário → false", () => {
    expect(podeRH(undefined)).toBe(false);
    expect(renderHook(() => usePodeRH()).result.current).toBe(false);
  });
});

describe("menu e acesso direto pela URL", () => {
  const hrefs = (role: string) => filterNavForRole(role).flatMap((s) => s.items.map((i) => i.href));

  it.each(["DIRETOR", "SECRETARIA", "PROFESSOR"])("%s não vê Exportações e a URL é bloqueada", (role) => {
    expect(hrefs(role)).not.toContain("/exportacoes");
    expect(podeAcessarRota("/exportacoes", role)).toBe(false);
  });

  it.each(["ADMIN", "SEMEC", "COORDENADOR"])("%s vê Exportações", (role) => {
    expect(hrefs(role)).toContain("/exportacoes");
    expect(podeAcessarRota("/exportacoes", role)).toBe(true);
  });

  it("RH continua no menu da equipe operacional (lotação e ACs)", () => {
    for (const role of ["DIRETOR", "SECRETARIA", "COORDENADOR"]) expect(hrefs(role)).toContain("/rh");
    expect(hrefs("PROFESSOR")).not.toContain("/rh");
  });
});

describe("página de RH", () => {
  it.each(["DIRETOR", "SECRETARIA"])("%s não vê as abas de ponto e licenças; abre na lotação", (role) => {
    comPapel(role);
    render(<RHPage />);
    expect(screen.queryByRole("tab", { name: /Ponto Digital/ })).toBeNull();
    expect(screen.queryByRole("tab", { name: /Licenças/ })).toBeNull();
    expect(screen.getByRole("tab", { name: /Quadro de lotação/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /ACs por área/ })).toBeTruthy();
    expect(screen.getByText("conteudo-lotacao")).toBeTruthy();
    expect(screen.queryByText("conteudo-ponto")).toBeNull();
    expect(screen.queryByText("conteudo-licencas")).toBeNull();
  });

  it.each(["ADMIN", "SEMEC", "COORDENADOR"])("%s vê ponto e licenças (abre no ponto)", (role) => {
    comPapel(role);
    render(<RHPage />);
    expect(screen.getByRole("tab", { name: /Ponto Digital/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Licenças/ })).toBeTruthy();
    expect(screen.getByText("conteudo-ponto")).toBeTruthy();
  });
});
