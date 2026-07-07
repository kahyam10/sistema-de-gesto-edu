import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { calendarioService } from "../src/services/calendario.service.js";

describe("CalendarioService", () => {
  beforeAll(async () => {
    await prisma.eventoCalendario.deleteMany();
    await prisma.anoLetivo.deleteMany();
  });

  it("cria ano letivo", async () => {
    const anoLetivo = await calendarioService.createAnoLetivo({
      ano: 2026,
      ativo: true,
    });

    expect(anoLetivo.ano).toBe(2026);
    expect(anoLetivo.ativo).toBe(true);
  });

  it("rejeita ano letivo duplicado", async () => {
    await expect(
      calendarioService.createAnoLetivo({ ano: 2026 })
    ).rejects.toThrow("Já existe um ano letivo cadastrado para 2026");
  });

  it("ao ativar um novo ano letivo, desativa o anterior", async () => {
    const novo = await calendarioService.createAnoLetivo({
      ano: 2027,
      ativo: true,
    });

    expect(novo.ativo).toBe(true);

    const anterior = await prisma.anoLetivo.findUnique({
      where: { ano: 2026 },
    });
    expect(anterior!.ativo).toBe(false);

    const ativos = await prisma.anoLetivo.count({ where: { ativo: true } });
    expect(ativos).toBe(1);
  });

  it("rejeita evento em ano letivo inexistente", async () => {
    await expect(
      calendarioService.createEvento({
        titulo: "Feriado Teste",
        tipo: "FERIADO",
        dataInicio: new Date("2026-05-01"),
        anoLetivoId: "id-inexistente",
      })
    ).rejects.toThrow("Ano letivo não encontrado");
  });

  it("cria INICIO_ANO_LETIVO e rejeita um segundo para o mesmo ano", async () => {
    const anoLetivo = await prisma.anoLetivo.findUnique({
      where: { ano: 2026 },
    });

    const inicio = await calendarioService.createEvento({
      titulo: "Início do Ano Letivo",
      tipo: "INICIO_ANO_LETIVO",
      dataInicio: new Date("2026-02-02"),
      anoLetivoId: anoLetivo!.id,
    });

    expect(inicio.tipo).toBe("INICIO_ANO_LETIVO");

    await expect(
      calendarioService.createEvento({
        titulo: "Início duplicado",
        tipo: "INICIO_ANO_LETIVO",
        dataInicio: new Date("2026-02-09"),
        anoLetivoId: anoLetivo!.id,
      })
    ).rejects.toThrow("O Início do Ano Letivo já foi definido");
  });

  it("exige início E fim do ano letivo antes de aceitar INICIO_AULAS_REGULARES", async () => {
    const anoLetivo = await prisma.anoLetivo.findUnique({
      where: { ano: 2026 },
    });

    // Só o INICIO_ANO_LETIVO existe até aqui — deve recusar
    await expect(
      calendarioService.createEvento({
        titulo: "Início das Aulas Regulares",
        tipo: "INICIO_AULAS_REGULARES",
        dataInicio: new Date("2026-02-09"),
        anoLetivoId: anoLetivo!.id,
      })
    ).rejects.toThrow(
      "É necessário definir o Início e Fim do Ano Letivo antes de definir as Aulas Regulares"
    );

    // Com o FIM_ANO_LETIVO definido, o tipo passa a ser aceito
    await calendarioService.createEvento({
      titulo: "Fim do Ano Letivo",
      tipo: "FIM_ANO_LETIVO",
      dataInicio: new Date("2026-12-18"),
      anoLetivoId: anoLetivo!.id,
    });

    const evento = await calendarioService.createEvento({
      titulo: "Início das Aulas Regulares",
      tipo: "INICIO_AULAS_REGULARES",
      dataInicio: new Date("2026-02-09"),
      anoLetivoId: anoLetivo!.id,
    });

    expect(evento.tipo).toBe("INICIO_AULAS_REGULARES");
  });
});
