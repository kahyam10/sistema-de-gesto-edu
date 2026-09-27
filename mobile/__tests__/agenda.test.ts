import { itensDaAgenda } from "../src/screens/comum/AgendaScreen";

describe("agenda", () => {
  it("mostra cada ocorrência de evento recorrente com a indicação da repetição", () => {
    const base = { titulo: "Formação (demo)", descricao: null, dataFim: null, horaInicio: "14:00", horaFim: "16:00", tipo: "FORMACAO", escola: null };
    const itens = itensDaAgenda({
      de: "2026-10-01", ate: "2026-10-31",
      eventos: [
        { ...base, id: "ev1@2026-10-12", dataInicio: "2026-10-12T00:00:00.000Z", tipoRecorrencia: "SEMANAL" },
        { ...base, id: "ev1@2026-10-05", dataInicio: "2026-10-05T00:00:00.000Z", tipoRecorrencia: "SEMANAL" },
        { ...base, id: "ev2", titulo: "Feriado (demo)", tipo: "FERIADO", dataInicio: "2026-10-12T00:00:00.000Z", horaInicio: null, horaFim: null },
      ],
      reunioes: [], plantoes: [],
    });
    expect(itens.map((i) => [i.chave, i.data])).toEqual([
      ["e-ev1@2026-10-05", "2026-10-05"], ["e-ev2", "2026-10-12"], ["e-ev1@2026-10-12", "2026-10-12"],
    ]);
    expect(itens[0].detalhes).toEqual(["Toda semana", "Toda a rede"]);
    expect(itens[1].detalhes).toEqual(["Toda a rede"]);
  });
});
