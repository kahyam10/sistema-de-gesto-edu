import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { licencaService } from "../src/services/licenca.service.js";
import { pontoService } from "../src/services/ponto.service.js";
import { ComunicadoService } from "../src/services/comunicado.service.js";

const comunicadoService = new ComunicadoService();

let profissional: { id: string };
let usuario: { id: string };

describe("RH (licenças + ponto) e Comunicação (comunicados)", () => {
  beforeAll(async () => {
    await prisma.comunicadoDestinatario.deleteMany();
    await prisma.comunicado.deleteMany();
    await prisma.ponto.deleteMany();
    await prisma.licenca.deleteMany();
    await prisma.profissionalEducacao.deleteMany();

    profissional = await prisma.profissionalEducacao.create({
      data: {
        nome: "Prof RH Teste",
        cpf: "00011122233",
        tipo: "PROFESSOR",
      },
    });
    usuario = await prisma.user.upsert({
      where: { email: "leitor@teste.com" },
      update: {},
      create: {
        email: "leitor@teste.com",
        password: "hash-irrelevante",
        nome: "Leitor Teste",
        role: "PROFESSOR",
      },
    });
  });

  it("cria licença PENDENTE e aprova com registro de quem aprovou", async () => {
    const licenca = await licencaService.create({
      profissionalId: profissional.id,
      tipo: "LICENCA_MEDICA",
      dataInicio: new Date("2026-08-01"),
      dataFim: new Date("2026-08-10"),
      motivo: "Atestado",
    });
    expect(licenca.status).toBe("PENDENTE");

    const aprovada = await licencaService.aprovar(licenca.id, {
      status: "APROVADA",
      aprovadaPor: "gestor-id",
    });
    expect(aprovada.status).toBe("APROVADA");
    expect(aprovada.aprovadaPor).toBe("gestor-id");
    expect(aprovada.dataAprovacao).not.toBeNull();
  });

  it("não processa a mesma licença duas vezes", async () => {
    const licenca = await licencaService.create({
      profissionalId: profissional.id,
      tipo: "FERIAS",
      dataInicio: new Date("2026-09-01"),
      dataFim: new Date("2026-09-15"),
    });
    await licencaService.aprovar(licenca.id, {
      status: "REJEITADA",
      aprovadaPor: "gestor-id",
      justificativaRejeicao: "Período indisponível",
    });

    await expect(
      licencaService.aprovar(licenca.id, {
        status: "APROVADA",
        aprovadaPor: "gestor-id",
      })
    ).rejects.toThrow("já foi processada");
  });

  it("mantém um único registro de ponto por profissional por dia (entrada + saída)", async () => {
    await pontoService.registrarPonto({
      profissionalId: profissional.id,
      tipo: "ENTRADA",
      horario: "08:00",
    });
    const ponto = await pontoService.registrarPonto({
      profissionalId: profissional.id,
      tipo: "SAIDA",
      horario: "12:00",
    });

    expect(ponto.entrada).toBe("08:00");
    expect(ponto.saida).toBe("12:00");
    expect(ponto.horasTrabalhadas).toBe(4);

    const registros = await prisma.ponto.findMany({
      where: { profissionalId: profissional.id },
    });
    expect(registros).toHaveLength(1);
  });

  it("comunicado registra leitura e confirmação por usuário (sem duplicar)", async () => {
    const comunicado = await comunicadoService.create({
      titulo: "Reunião geral",
      mensagem: "Reunião dia 15 às 9h",
      tipo: "GERAL",
      categoria: "INFORMATIVO",
      destinatarios: "TODOS",
      autorNome: "SEMEC",
    });

    await comunicadoService.marcarComoLido(comunicado.id, usuario.id);
    await comunicadoService.marcarComoLido(comunicado.id, usuario.id); // idempotente
    await comunicadoService.confirmar(comunicado.id, usuario.id);

    const destinatarios = await prisma.comunicadoDestinatario.findMany({
      where: { comunicadoId: comunicado.id, userId: usuario.id },
    });
    expect(destinatarios).toHaveLength(1);
    expect(destinatarios[0].lido).toBe(true);
    expect(destinatarios[0].confirmado).toBe(true);
  });
});
