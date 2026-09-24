import { describe, it, expect, beforeAll } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";
import { portalService } from "../src/services/portal.service.js";
import { matriculaService } from "../src/services/matricula.service.js";
import { frequenciaService } from "../src/services/frequencia.service.js";
import { authService } from "../src/services/auth.service.js";
import { BusinessError, NotFoundError, PermissionError } from "../src/errors/index.js";

let escola: { id: string };
let etapa: { id: string };
let turma: { id: string };
let matriculaA: { id: string };
let matriculaB: { id: string };
let matriculaAlheia: { id: string };

const EMAIL_RESP = "responsavel.portal@teste.com";
const SENHA_RESP = "senha-portal-123";

describe("Módulo 3 — Portais (vínculo responsável + portais)", () => {
  beforeAll(async () => {
    // Limpeza em ordem reversa de FK (padrão matricula/pedagogico.service.test)
    await prisma.matriculaUsuario.deleteMany();
    await prisma.comunicadoDestinatario.deleteMany();
    await prisma.notificacao.deleteMany();
    await prisma.documentoMatricula.deleteMany();
    await prisma.user.deleteMany();
    await prisma.nota.deleteMany();
    await prisma.avaliacao.deleteMany();
    await prisma.frequencia.deleteMany();
    await prisma.gradeHoraria.deleteMany();
    await prisma.disciplina.deleteMany();
    await prisma.turmaProfessor.deleteMany();
    await prisma.escolaProfissional.deleteMany();
    await prisma.transferenciaMatricula.deleteMany();
    await prisma.matricula.deleteMany();
    await prisma.turma.deleteMany();
    await prisma.serie.deleteMany();
    await prisma.nivelEnsino.deleteMany();
    await prisma.escolaEtapa.deleteMany();
    await prisma.escola.deleteMany();
    await prisma.etapaEnsino.deleteMany();
    await prisma.tipoEducacao.deleteMany();

    const tipo = await prisma.tipoEducacao.create({
      data: { nome: "Regular Portal" },
    });
    etapa = await prisma.etapaEnsino.create({
      data: { nome: "Fundamental Portal", tipoEducacaoId: tipo.id },
    });
    const nivel = await prisma.nivelEnsino.create({
      data: { nome: "Anos Iniciais Portal", etapaId: etapa.id },
    });
    const serie = await prisma.serie.create({
      data: { nome: "4º Ano Portal", nivelId: nivel.id },
    });
    escola = await prisma.escola.create({
      data: { nome: "Escola Portal", codigo: "PORTAL-01" },
    });
    turma = await prisma.turma.create({
      data: {
        nome: "4A",
        turno: "MATUTINO",
        anoLetivo: 2026,
        escolaId: escola.id,
        serieId: serie.id,
      },
    });
    matriculaA = await prisma.matricula.create({
      data: {
        numeroMatricula: "PORTAL0001",
        anoLetivo: 2026,
        status: "ATIVA",
        nomeAluno: "Aluno Portal A",
        dataNascimento: new Date("2016-02-01"),
        sexo: "M",
        nomeResponsavel: "Resp Portal A",
        escolaId: escola.id,
        etapaId: etapa.id,
        turmaId: turma.id,
      },
    });
    matriculaB = await prisma.matricula.create({
      data: {
        numeroMatricula: "PORTAL0002",
        anoLetivo: 2026,
        status: "ATIVA",
        nomeAluno: "Aluno Portal B",
        dataNascimento: new Date("2015-09-15"),
        sexo: "F",
        nomeResponsavel: "Resp Portal B",
        escolaId: escola.id,
        etapaId: etapa.id,
        turmaId: turma.id,
      },
    });
    matriculaAlheia = await prisma.matricula.create({
      data: {
        numeroMatricula: "PORTAL0003",
        anoLetivo: 2026,
        status: "ATIVA",
        nomeAluno: "Aluno Alheio",
        dataNascimento: new Date("2015-01-20"),
        sexo: "M",
        nomeResponsavel: "Resp Alheio",
        escolaId: escola.id,
        etapaId: etapa.id,
        turmaId: turma.id,
      },
    });
    await prisma.disciplina.create({
      data: {
        nome: "Português Portal",
        codigo: "PORT-PORTAL",
        etapaId: etapa.id,
      },
    });

    // Frequência conhecida do aluno A: 1 presença + 1 falta = 50%
    await frequenciaService.registrarTurma({
      turmaId: turma.id,
      data: new Date("2026-03-02"),
      presencas: [
        { matriculaId: matriculaA.id, status: "PRESENTE" },
        { matriculaId: matriculaB.id, status: "PRESENTE" },
        { matriculaId: matriculaAlheia.id, status: "PRESENTE" },
      ],
    });
    await frequenciaService.registrarTurma({
      turmaId: turma.id,
      data: new Date("2026-03-03"),
      presencas: [
        { matriculaId: matriculaA.id, status: "FALTA" },
        { matriculaId: matriculaB.id, status: "PRESENTE" },
        { matriculaId: matriculaAlheia.id, status: "PRESENTE" },
      ],
    });
  });

  it("criarAcesso cria usuário RESPONSAVEL com senha hasheada e vincula à matrícula (login funciona)", async () => {
    const vinculo = await matriculaService.criarAcesso(matriculaA.id, {
      email: EMAIL_RESP,
      nome: "Responsável Portal",
      senha: SENHA_RESP,
      tipoVinculo: "RESPONSAVEL",
      parentesco: "Mãe",
    });

    expect(vinculo.matriculaId).toBe(matriculaA.id);
    expect(vinculo.ativo).toBe(true);
    expect(vinculo.parentesco).toBe("Mãe");
    expect(vinculo.user.role).toBe("RESPONSAVEL");

    // Senha hasheada no banco (não em texto plano) e login funcionando
    const noBanco = await prisma.user.findUnique({ where: { email: EMAIL_RESP } });
    expect(noBanco!.password).not.toBe(SENHA_RESP);
    expect(await bcrypt.compare(SENHA_RESP, noBanco!.password)).toBe(true);

    const logado = await authService.login({ email: EMAIL_RESP, password: SENHA_RESP });
    expect(logado.role).toBe("RESPONSAVEL");
    expect(logado).not.toHaveProperty("password");
  });

  it("reutiliza usuário de email existente sem trocar a senha, apenas vinculando", async () => {
    const antes = await prisma.user.findUnique({ where: { email: EMAIL_RESP } });

    const vinculo = await matriculaService.criarAcesso(matriculaB.id, {
      email: EMAIL_RESP,
      nome: "Nome Ignorado",
      senha: "senha-ignorada-999",
      tipoVinculo: "RESPONSAVEL",
      parentesco: "Mãe",
    });

    expect(vinculo.matriculaId).toBe(matriculaB.id);
    expect(vinculo.userId).toBe(antes!.id);

    const depois = await prisma.user.findUnique({ where: { email: EMAIL_RESP } });
    expect(depois!.password).toBe(antes!.password); // senha NÃO foi alterada
    expect(depois!.nome).toBe(antes!.nome); // cadastro NÃO foi sobrescrito

    // Nenhum usuário novo criado
    const total = await prisma.user.count({ where: { email: EMAIL_RESP } });
    expect(total).toBe(1);
  });

  it("rejeita vínculo duplicado ativo com BIZ_022", async () => {
    await expect(
      matriculaService.criarAcesso(matriculaA.id, {
        email: EMAIL_RESP,
        tipoVinculo: "RESPONSAVEL",
      })
    ).rejects.toMatchObject({ code: "BIZ_022", statusCode: 409 });

    await expect(
      matriculaService.criarAcesso(matriculaA.id, {
        email: EMAIL_RESP,
        tipoVinculo: "RESPONSAVEL",
      })
    ).rejects.toBeInstanceOf(BusinessError);
  });

  it("exige nome e senha para email inexistente (BIZ_024)", async () => {
    await expect(
      matriculaService.criarAcesso(matriculaA.id, {
        email: "sem-cadastro@teste.com",
        tipoVinculo: "RESPONSAVEL",
      })
    ).rejects.toMatchObject({ code: "BIZ_024" });
  });

  it("nega boletim de matrícula não vinculada ao usuário (PERM_005, 403)", async () => {
    const user = await prisma.user.findUnique({ where: { email: EMAIL_RESP } });

    const promessa = portalService.boletimAluno(user!.id, matriculaAlheia.id);
    await expect(promessa).rejects.toBeInstanceOf(PermissionError);
    await expect(
      portalService.boletimAluno(user!.id, matriculaAlheia.id)
    ).rejects.toMatchObject({ code: "PERM_005", statusCode: 403 });

    // Frequência segue a mesma regra de escopo
    await expect(
      portalService.frequenciaAluno(user!.id, matriculaAlheia.id)
    ).rejects.toMatchObject({ code: "PERM_005", statusCode: 403 });
  });

  it("nega acesso com vínculo inativo (PERM_005)", async () => {
    const user = await prisma.user.findUnique({ where: { email: EMAIL_RESP } });
    await prisma.matriculaUsuario.update({
      where: { matriculaId_userId: { matriculaId: matriculaB.id, userId: user!.id } },
      data: { ativo: false },
    });

    await expect(
      portalService.boletimAluno(user!.id, matriculaB.id)
    ).rejects.toMatchObject({ code: "PERM_005" });

    // alunosDoUsuario também deixa de listar o vínculo inativo
    const alunos = await portalService.alunosDoUsuario(user!.id);
    expect(alunos.map((a) => a.matricula.id)).toEqual([matriculaA.id]);
  });

  it("retorna boletim e frequência do aluno vinculado", async () => {
    const user = await prisma.user.findUnique({ where: { email: EMAIL_RESP } });

    const boletim = await portalService.boletimAluno(user!.id, matriculaA.id);
    expect(boletim.matricula.id).toBe(matriculaA.id);
    expect(boletim.matricula.nomeAluno).toBe("Aluno Portal A");
    expect(Array.isArray(boletim.disciplinas)).toBe(true);
    expect(boletim.disciplinas.length).toBeGreaterThan(0);
    expect(boletim.frequencia.percentualPresenca).toBe(50);
    expect(boletim.situacaoGeral).toBe("EM_CURSO");

    const frequencia = await portalService.frequenciaAluno(user!.id, matriculaA.id);
    expect(frequencia.matricula.id).toBe(matriculaA.id);
    expect(frequencia.estatisticas!.totalAulas).toBe(2);
    expect(frequencia.estatisticas!.presencas).toBe(1);
    expect(frequencia.estatisticas!.percentualPresenca).toBe(50);
    expect(frequencia.registros).toHaveLength(2);
  });

  it("resumoProfessor exige usuário com profissional vinculado (BIZ_021)", async () => {
    const semProfissional = await prisma.user.create({
      data: {
        email: "professor-sem-vinculo@teste.com",
        password: await bcrypt.hash("senha-prof-123", 10),
        nome: "Professor Sem Vínculo",
        role: "PROFESSOR",
      },
    });

    await expect(
      portalService.resumoProfessor(semProfissional.id)
    ).rejects.toBeInstanceOf(BusinessError);
    await expect(
      portalService.resumoProfessor(semProfissional.id)
    ).rejects.toMatchObject({ code: "BIZ_021" });
  });

  it("revogarAcesso com vínculo de outra matrícula → NF_030", async () => {
    const user = await prisma.user.findUnique({ where: { email: EMAIL_RESP } });
    const vinculoA = await prisma.matriculaUsuario.findUnique({
      where: { matriculaId_userId: { matriculaId: matriculaA.id, userId: user!.id } },
    });

    // vinculoId existe, mas pertence à matrícula A — não pode ser revogado via matrícula B
    await expect(
      matriculaService.revogarAcesso(matriculaB.id, vinculoA!.id)
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      matriculaService.revogarAcesso(matriculaB.id, vinculoA!.id)
    ).rejects.toMatchObject({ code: "NF_030" });

    // Pela matrícula correta, revoga de fato
    const resultado = await matriculaService.revogarAcesso(matriculaA.id, vinculoA!.id);
    expect(resultado.message).toContain("revogado");
    const restante = await prisma.matriculaUsuario.findUnique({
      where: { id: vinculoA!.id },
    });
    expect(restante).toBeNull();
  });
});
