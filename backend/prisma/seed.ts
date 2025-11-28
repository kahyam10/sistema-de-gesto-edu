import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Limpar dados existentes
  await prisma.turmaProfessor.deleteMany();
  await prisma.escolaProfissional.deleteMany();
  await prisma.matricula.deleteMany();
  await prisma.turma.deleteMany();
  await prisma.escolaEtapa.deleteMany();
  await prisma.serie.deleteMany();
  await prisma.profissionalEducacao.deleteMany();
  await prisma.escola.deleteMany();
  await prisma.etapaEnsino.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Dados antigos removidos");

  // Criar usuário admin
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@ibirapitanga.ba.gov.br",
      password: adminPassword,
      nome: "Administrador SEMEC",
      role: "ADMIN",
    },
  });
  console.log(`✅ Usuário admin criado: ${admin.email}`);

  // Criar etapas de ensino
  const etapas = await Promise.all([
    prisma.etapaEnsino.create({
      data: {
        nome: "Educação Infantil",
        descricao: "Creche e Pré-escola (0 a 5 anos)",
        ordem: 1,
      },
    }),
    prisma.etapaEnsino.create({
      data: {
        nome: "Ensino Fundamental I",
        descricao: "1º ao 5º ano (6 a 10 anos)",
        ordem: 2,
      },
    }),
    prisma.etapaEnsino.create({
      data: {
        nome: "Ensino Fundamental II",
        descricao: "6º ao 9º ano (11 a 14 anos)",
        ordem: 3,
      },
    }),
  ]);
  console.log(`✅ ${etapas.length} etapas de ensino criadas`);

  // Criar séries para cada etapa
  const seriesInfantil = await Promise.all([
    prisma.serie.create({
      data: { nome: "Creche I", ordem: 1, etapaId: etapas[0].id },
    }),
    prisma.serie.create({
      data: { nome: "Creche II", ordem: 2, etapaId: etapas[0].id },
    }),
    prisma.serie.create({
      data: { nome: "Creche III", ordem: 3, etapaId: etapas[0].id },
    }),
    prisma.serie.create({
      data: { nome: "Pré I", ordem: 4, etapaId: etapas[0].id },
    }),
    prisma.serie.create({
      data: { nome: "Pré II", ordem: 5, etapaId: etapas[0].id },
    }),
  ]);

  const seriesFundI = await Promise.all([
    prisma.serie.create({
      data: { nome: "1º Ano", ordem: 1, etapaId: etapas[1].id },
    }),
    prisma.serie.create({
      data: { nome: "2º Ano", ordem: 2, etapaId: etapas[1].id },
    }),
    prisma.serie.create({
      data: { nome: "3º Ano", ordem: 3, etapaId: etapas[1].id },
    }),
    prisma.serie.create({
      data: { nome: "4º Ano", ordem: 4, etapaId: etapas[1].id },
    }),
    prisma.serie.create({
      data: { nome: "5º Ano", ordem: 5, etapaId: etapas[1].id },
    }),
  ]);

  const seriesFundII = await Promise.all([
    prisma.serie.create({
      data: { nome: "6º Ano", ordem: 1, etapaId: etapas[2].id },
    }),
    prisma.serie.create({
      data: { nome: "7º Ano", ordem: 2, etapaId: etapas[2].id },
    }),
    prisma.serie.create({
      data: { nome: "8º Ano", ordem: 3, etapaId: etapas[2].id },
    }),
    prisma.serie.create({
      data: { nome: "9º Ano", ordem: 4, etapaId: etapas[2].id },
    }),
  ]);

  const totalSeries =
    seriesInfantil.length + seriesFundI.length + seriesFundII.length;
  console.log(`✅ ${totalSeries} séries criadas`);

  // Criar escolas
  const escolas = await Promise.all([
    prisma.escola.create({
      data: {
        nome: "Escola Municipal Dr. João Batista",
        codigo: "EM001",
        endereco: "Rua Principal, 100 - Centro",
        telefone: "(73) 3531-1001",
        email: "emjb@ibirapitanga.ba.gov.br",
        etapas: {
          create: [{ etapaId: etapas[1].id }, { etapaId: etapas[2].id }],
        },
      },
    }),
    prisma.escola.create({
      data: {
        nome: "Escola Municipal Professora Maria das Graças",
        codigo: "EM002",
        endereco: "Av. Brasil, 500 - Bairro Novo",
        telefone: "(73) 3531-1002",
        email: "emmg@ibirapitanga.ba.gov.br",
        etapas: {
          create: [{ etapaId: etapas[0].id }, { etapaId: etapas[1].id }],
        },
      },
    }),
    prisma.escola.create({
      data: {
        nome: "Centro de Educação Infantil Criança Feliz",
        codigo: "CEI001",
        endereco: "Rua das Flores, 50 - Jardim",
        telefone: "(73) 3531-1003",
        email: "ceicf@ibirapitanga.ba.gov.br",
        etapas: {
          create: [{ etapaId: etapas[0].id }],
        },
      },
    }),
    prisma.escola.create({
      data: {
        nome: "Escola Municipal Rural São José",
        codigo: "EMR001",
        endereco: "Zona Rural - Fazenda São José",
        telefone: "(73) 3531-1004",
        etapas: {
          create: [{ etapaId: etapas[1].id }],
        },
      },
    }),
    prisma.escola.create({
      data: {
        nome: "Escola Municipal Rui Barbosa",
        codigo: "EM003",
        endereco: "Praça Central, s/n - Centro",
        telefone: "(73) 3531-1005",
        email: "emrb@ibirapitanga.ba.gov.br",
        etapas: {
          create: [{ etapaId: etapas[1].id }, { etapaId: etapas[2].id }],
        },
      },
    }),
    prisma.escola.create({
      data: {
        nome: "Escola Municipal Monteiro Lobato",
        codigo: "EM004",
        endereco: "Rua dos Ipês, 200 - Vila Nova",
        telefone: "(73) 3531-1006",
        email: "emml@ibirapitanga.ba.gov.br",
        etapas: {
          create: [{ etapaId: etapas[0].id }, { etapaId: etapas[1].id }],
        },
      },
    }),
  ]);
  console.log(`✅ ${escolas.length} escolas criadas`);

  // Criar profissionais
  const profissionais = await Promise.all([
    prisma.profissionalEducacao.create({
      data: {
        nome: "Ana Paula Silva",
        cpf: "12345678901",
        email: "ana.silva@ibirapitanga.ba.gov.br",
        telefone: "(73) 99999-0001",
        tipo: "PROFESSOR",
        formacao: "Pedagogia",
        especialidade: "Alfabetização",
        matricula: "PROF001",
        escolas: {
          create: [{ escolaId: escolas[0].id }, { escolaId: escolas[1].id }],
        },
      },
    }),
    prisma.profissionalEducacao.create({
      data: {
        nome: "Carlos Santos",
        cpf: "12345678902",
        email: "carlos.santos@ibirapitanga.ba.gov.br",
        telefone: "(73) 99999-0002",
        tipo: "PROFESSOR",
        formacao: "Matemática",
        especialidade: "Ensino Fundamental II",
        matricula: "PROF002",
        escolas: { create: [{ escolaId: escolas[0].id }] },
      },
    }),
    prisma.profissionalEducacao.create({
      data: {
        nome: "Maria Oliveira",
        cpf: "12345678903",
        email: "maria.oliveira@ibirapitanga.ba.gov.br",
        telefone: "(73) 99999-0003",
        tipo: "AUXILIAR",
        formacao: "Ensino Médio",
        matricula: "AUX001",
        escolas: { create: [{ escolaId: escolas[2].id }] },
      },
    }),
    prisma.profissionalEducacao.create({
      data: {
        nome: "José Pereira",
        cpf: "12345678904",
        email: "jose.pereira@ibirapitanga.ba.gov.br",
        telefone: "(73) 99999-0004",
        tipo: "DIRETOR",
        formacao: "Pedagogia",
        especialidade: "Gestão Escolar",
        matricula: "DIR001",
        escolas: { create: [{ escolaId: escolas[0].id }] },
      },
    }),
    prisma.profissionalEducacao.create({
      data: {
        nome: "Fernanda Costa",
        cpf: "12345678905",
        telefone: "(73) 99999-0005",
        tipo: "PROFESSOR",
        formacao: "Letras - Português",
        especialidade: "Língua Portuguesa",
        matricula: "PROF003",
        escolas: {
          create: [{ escolaId: escolas[0].id }, { escolaId: escolas[4].id }],
        },
      },
    }),
  ]);
  console.log(`✅ ${profissionais.length} profissionais criados`);

  // Criar turmas
  const anoLetivo = new Date().getFullYear();
  const turmas = await Promise.all([
    // Escola 1 - Fund I e II
    prisma.turma.create({
      data: {
        nome: "1º Ano A",
        turno: "MATUTINO",
        anoLetivo,
        capacidadeMaxima: 25,
        limitePCD: 3,
        escolaId: escolas[0].id,
        serieId: seriesFundI[0].id,
      },
    }),
    prisma.turma.create({
      data: {
        nome: "6º Ano A",
        turno: "VESPERTINO",
        anoLetivo,
        capacidadeMaxima: 30,
        limitePCD: 3,
        escolaId: escolas[0].id,
        serieId: seriesFundII[0].id,
      },
    }),
    // Escola 2 - Infantil e Fund I
    prisma.turma.create({
      data: {
        nome: "Pré II - A",
        turno: "MATUTINO",
        anoLetivo,
        capacidadeMaxima: 20,
        limitePCD: 2,
        escolaId: escolas[1].id,
        serieId: seriesInfantil[4].id,
      },
    }),
    prisma.turma.create({
      data: {
        nome: "2º Ano A",
        turno: "VESPERTINO",
        anoLetivo,
        capacidadeMaxima: 25,
        limitePCD: 3,
        escolaId: escolas[1].id,
        serieId: seriesFundI[1].id,
      },
    }),
    // CEI
    prisma.turma.create({
      data: {
        nome: "Creche II - A",
        turno: "INTEGRAL",
        anoLetivo,
        capacidadeMaxima: 15,
        limitePCD: 2,
        escolaId: escolas[2].id,
        serieId: seriesInfantil[1].id,
      },
    }),
  ]);
  console.log(`✅ ${turmas.length} turmas criadas`);

  // Criar algumas matrículas de exemplo
  const matriculas = await Promise.all([
    prisma.matricula.create({
      data: {
        numeroMatricula: `${anoLetivo}00001`,
        anoLetivo,
        nomeAluno: "Pedro Henrique Silva",
        dataNascimento: new Date("2018-03-15"),
        sexo: "M",
        naturalidade: "Ibirapitanga",
        corRaca: "Pardo",
        nomeResponsavel: "Maria Silva",
        telefoneResponsavel: "(73) 99888-0001",
        endereco: "Rua das Palmeiras, 50",
        bairro: "Centro",
        cidade: "Ibirapitanga",
        estado: "BA",
        cep: "45555-000",
        escolaId: escolas[0].id,
        etapaId: etapas[1].id,
        turmaId: turmas[0].id,
      },
    }),
    prisma.matricula.create({
      data: {
        numeroMatricula: `${anoLetivo}00002`,
        anoLetivo,
        nomeAluno: "Ana Clara Santos",
        dataNascimento: new Date("2019-07-20"),
        sexo: "F",
        naturalidade: "Ibirapitanga",
        possuiDeficiencia: true,
        tipoDeficiencia: "Deficiência Auditiva",
        nomeResponsavel: "José Santos",
        telefoneResponsavel: "(73) 99888-0002",
        endereco: "Av. Brasil, 100",
        bairro: "Bairro Novo",
        cidade: "Ibirapitanga",
        estado: "BA",
        cep: "45555-000",
        escolaId: escolas[1].id,
        etapaId: etapas[0].id,
        turmaId: turmas[2].id,
      },
    }),
    prisma.matricula.create({
      data: {
        numeroMatricula: `${anoLetivo}00003`,
        anoLetivo,
        nomeAluno: "Lucas Oliveira",
        dataNascimento: new Date("2013-11-10"),
        sexo: "M",
        naturalidade: "Ubatã",
        nomeResponsavel: "Carla Oliveira",
        telefoneResponsavel: "(73) 99888-0003",
        endereco: "Rua Nova, 200",
        bairro: "Centro",
        cidade: "Ibirapitanga",
        estado: "BA",
        escolaId: escolas[0].id,
        etapaId: etapas[2].id,
        turmaId: turmas[1].id,
      },
    }),
    prisma.matricula.create({
      data: {
        numeroMatricula: `${anoLetivo}00004`,
        anoLetivo,
        nomeAluno: "Mariana Costa",
        dataNascimento: new Date("2020-01-25"),
        sexo: "F",
        naturalidade: "Ibirapitanga",
        nomeResponsavel: "Fernanda Costa",
        telefoneResponsavel: "(73) 99888-0004",
        cidade: "Ibirapitanga",
        estado: "BA",
        escolaId: escolas[2].id,
        etapaId: etapas[0].id,
        turmaId: turmas[4].id,
      },
    }),
    prisma.matricula.create({
      data: {
        numeroMatricula: `${anoLetivo}00005`,
        anoLetivo,
        nomeAluno: "Gabriel Pereira",
        dataNascimento: new Date("2017-05-30"),
        sexo: "M",
        naturalidade: "Ibirapitanga",
        possuiDeficiencia: true,
        tipoDeficiencia: "TEA - Transtorno do Espectro Autista",
        nomeResponsavel: "Roberto Pereira",
        telefoneResponsavel: "(73) 99888-0005",
        endereco: "Rua do Sol, 80",
        bairro: "Vila Nova",
        cidade: "Ibirapitanga",
        estado: "BA",
        escolaId: escolas[1].id,
        etapaId: etapas[1].id,
        turmaId: turmas[3].id,
      },
    }),
  ]);
  console.log(`✅ ${matriculas.length} matrículas criadas`);

  // Vincular professores às turmas
  await prisma.turmaProfessor.createMany({
    data: [
      {
        turmaId: turmas[0].id,
        profissionalId: profissionais[0].id,
        tipo: "PROFESSOR",
      },
      {
        turmaId: turmas[1].id,
        profissionalId: profissionais[1].id,
        tipo: "PROFESSOR",
        disciplina: "Matemática",
      },
      {
        turmaId: turmas[1].id,
        profissionalId: profissionais[4].id,
        tipo: "PROFESSOR",
        disciplina: "Português",
      },
      {
        turmaId: turmas[2].id,
        profissionalId: profissionais[0].id,
        tipo: "PROFESSOR",
      },
      {
        turmaId: turmas[4].id,
        profissionalId: profissionais[2].id,
        tipo: "AUXILIAR",
      },
    ],
  });
  console.log("✅ Professores vinculados às turmas");

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("\n📋 Dados criados:");
  console.log(`   - 1 usuário admin (admin@ibirapitanga.ba.gov.br / admin123)`);
  console.log(`   - ${etapas.length} etapas de ensino`);
  console.log(`   - ${totalSeries} séries`);
  console.log(`   - ${escolas.length} escolas`);
  console.log(`   - ${profissionais.length} profissionais`);
  console.log(`   - ${turmas.length} turmas`);
  console.log(`   - ${matriculas.length} matrículas`);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
