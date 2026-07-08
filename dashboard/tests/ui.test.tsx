import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { buildSparklinePath } from "@/components/ui/sparkline";

describe("primitivos do design system", () => {
  it("Badge aplica as pílulas soft por variante", () => {
    render(<Badge variant="success">Ativa</Badge>);
    const el = screen.getByText("Ativa");
    expect(el.className).toContain("bg-success-soft");
    expect(el.className).toContain("rounded-full");
  });

  it("Button default usa o azul institucional com cantos discretos", () => {
    render(<Button>Salvar</Button>);
    const el = screen.getByRole("button", { name: "Salvar" });
    expect(el.className).toContain("bg-brand");
    expect(el.className).toContain("rounded-sm");
  });

  it("Avatar gera iniciais e cor determinística pelo nome", () => {
    const { container: a } = render(<Avatar name="Maria das Graças" />);
    const { container: b } = render(<Avatar name="Maria das Graças" />);
    expect(a.textContent).toBe("MD");
    expect((a.firstChild as HTMLElement).style.color).toBe(
      (b.firstChild as HTMLElement).style.color
    );
  });

  it("Breadcrumb usa separador ponto médio e marca o último item", () => {
    render(
      <Breadcrumb items={[{ label: "Cadastros", href: "/cadastros" }, { label: "Escolas" }]} />
    );
    expect(screen.getByText("·")).toBeTruthy();
    expect(screen.getByText("Escolas").className).toContain("font-medium");
    expect(screen.getByRole("link", { name: "Cadastros" })).toBeTruthy();
  });
});

describe("buildSparklinePath", () => {
  it("gera path SVG normalizado no espaço 0-100 × 0-32", () => {
    const path = buildSparklinePath([1, 2, 3]);
    expect(path.startsWith("M 0.00")).toBe(true);
    expect(path).toContain("L 100.00");
  });

  it("retorna vazio para lista vazia", () => {
    expect(buildSparklinePath([])).toBe("");
  });
});
