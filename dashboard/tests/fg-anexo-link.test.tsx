import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AnexoLink } from "@/components/comunicacao/ComunicadoManager";

afterEach(cleanup);

describe("AnexoLink (comunicados antigos com anexoUrl inseguro)", () => {
  it("https vira link clicável que abre em nova aba sem opener", () => {
    render(<AnexoLink url="https://exemplo.gov.br/anexo.pdf" />);
    const link = screen.getByRole("link", { name: /anexo/i });
    expect(link.getAttribute("href")).toBe("https://exemplo.gov.br/anexo.pdf");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it.each(["javascript:alert(1)", "http://exemplo.gov.br/anexo.pdf", "data:text/html,oi"])(
    "%s aparece como texto, sem link, com aviso",
    (url) => {
      render(<AnexoLink url={url} />);
      expect(screen.queryByRole("link")).toBeNull();
      expect(screen.getByText(/link não seguro/i)).toBeTruthy();
    },
  );
});
