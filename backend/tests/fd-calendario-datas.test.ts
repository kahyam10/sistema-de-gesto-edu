// Frente D — calendário com datas puras (meia-noite UTC) independente do fuso
// do servidor. Rode também com TZ=America/Bahia: com getDay()/setHours locais
// o sábado 09/03 virava sexta e o dia 01/04 caía em março.
// Dados 100% fictícios (ano letivo 2041, só deste arquivo).
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { calendarioService } from "../src/services/calendario.service.js";

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);
let anoLetivoId: string;

beforeAll(async () => {
  const ano = await prisma.anoLetivo.create({ data: { ano: 2041, ativo: false } });
  anoLetivoId = ano.id;
  const ev = (titulo: string, tipo: string, dataInicio: string, extra: Record<string, unknown> = {}) =>
    prisma.eventoCalendario.create({ data: { titulo, tipo, dataInicio: d(dataInicio), anoLetivoId, ...extra } });
  await ev("Início ano", "INICIO_ANO_LETIVO", "2041-02-01");
  await ev("Fim ano", "FIM_ANO_LETIVO", "2041-12-20");
  await ev("Início aulas", "INICIO_AULAS_REGULARES", "2041-03-04"); // segunda
  await ev("Fim aulas", "FIM_AULAS_REGULARES", "2041-03-17"); // domingo
  // Sem dataFim: antes, `end` era o próprio `current` → laço sem fim
  await ev("Sábado letivo", "SABADO_LETIVO", "2041-03-09"); // sábado
  await ev("Feriado municipal", "FERIADO", "2041-03-12", { reduzDiaLetivo: true }); // terça
  await ev("Reunião 09/03", "REUNIAO", "2041-03-09");
  await ev("Reunião 31/03", "REUNIAO", "2041-03-31");
  await ev("Reunião 01/04", "REUNIAO", "2041-04-01");
});

describe("calendário em UTC (independe do fuso do servidor)", () => {
  it("dias letivos: sábado letivo e feriado contados no dia certo", async () => {
    const r = await calendarioService.calcularDiasLetivos(anoLetivoId);
    // 04/03–17/03: 14 dias, 10 úteis − 1 feriado + 1 sábado letivo
    expect(r).toMatchObject({ diasTotais: 14, diasLetivos: 10, sabadosLetivos: 1, feriados: 1 });
  });

  it("eventos do mês: 01/04 é abril e 31/03 é março", async () => {
    const titulos = async (mes: number) =>
      (await calendarioService.getEventosPorMes(anoLetivoId, mes, 2041)).map((e) => e.titulo);
    const marco = await titulos(3);
    const abril = await titulos(4);
    expect(marco).toContain("Reunião 31/03");
    expect(marco).not.toContain("Reunião 01/04");
    expect(abril).toContain("Reunião 01/04");
    expect(abril).not.toContain("Reunião 31/03");
  });

  it("eventos de um dia: 10/03 não traz o evento de 09/03", async () => {
    const r = await calendarioService.findEventosByData(anoLetivoId, d("2041-03-10"));
    expect(r.map((e) => e.titulo)).not.toContain("Reunião 09/03");
    const r9 = await calendarioService.findEventosByData(anoLetivoId, d("2041-03-09"));
    expect(r9.map((e) => e.titulo)).toContain("Reunião 09/03");
  });
});
