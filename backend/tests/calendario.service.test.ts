import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { calendarioService } from "../src/services/calendario.service.js";
import { createEventoRecorrenteSchema } from "../src/schemas/index.js";

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

  it("evento recorrente aparece em cada ocorrência do mês, até o fim do ano letivo", async () => {
    const anoLetivo = await prisma.anoLetivo.findUnique({ where: { ano: 2026 } });
    // Fim do ano letivo = 18/12/2026 (teste anterior); formação toda quinta desde 03/12
    const base = await calendarioService.createEvento({
      titulo: "Formação semanal (teste)", tipo: "FORMACAO", dataInicio: new Date("2026-12-03"),
      recorrente: true, tipoRecorrencia: "SEMANAL", anoLetivoId: anoLetivo!.id,
    });
    const dezembro = await calendarioService.getEventosPorMes(anoLetivo!.id, 12, 2026);
    const doBase = dezembro.filter((e) => e.titulo === "Formação semanal (teste)");
    expect(doBase.map((e) => e.dataInicio.toISOString().slice(0, 10))).toEqual(["2026-12-03", "2026-12-10", "2026-12-17"]);
    expect(doBase.every((e) => "ocorrenciaDe" in e && e.ocorrenciaDe.id === base.id)).toBe(true);
    // Antes da dataInicio não aparece
    const novembro = await calendarioService.getEventosPorMes(anoLetivo!.id, 11, 2026);
    expect(novembro.some((e) => e.titulo === "Formação semanal (teste)")).toBe(false);
  });

  it("valida a recorrência na entrada", () => {
    const base = { titulo: "X", tipo: "FORMACAO", dataInicio: "2026-10-01", anoLetivoId: "a", recorrente: true };
    expect(createEventoRecorrenteSchema.safeParse({ ...base }).success).toBe(false); // sem frequência
    expect(createEventoRecorrenteSchema.safeParse({ ...base, tipoRecorrencia: "SEMANAL", diaRecorrencia: "SEGUNDA" }).success).toBe(true);
    expect(createEventoRecorrenteSchema.safeParse({ ...base, tipoRecorrencia: "SEMANAL", diaRecorrencia: "segunda-feira" }).success).toBe(false);
    expect(createEventoRecorrenteSchema.safeParse({ ...base, tipoRecorrencia: "MENSAL", diaRecorrencia: "32" }).success).toBe(false);
    expect(createEventoRecorrenteSchema.safeParse({ ...base, tipoRecorrencia: "MENSAL", reduzDiaLetivo: true }).success).toBe(false);
    expect(createEventoRecorrenteSchema.safeParse({ ...base, tipo: "FIM_ANO_LETIVO", tipoRecorrencia: "ANUAL" }).success).toBe(false);
  });
});
