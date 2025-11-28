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

  // ==================== MÓDULOS DO SISTEMA ====================
  console.log("\n📚 Criando módulos do sistema...");

  // Limpar módulos existentes
  await prisma.subModule.deleteMany();
  await prisma.module.deleteMany();
  await prisma.phase.deleteMany();

  const modulesData = [
    {
      name: "Gestão de Matrículas e Alunos",
      description:
        "Sistema completo para matrículas online/presencial, controle de vagas e gestão de alunos",
      icon: "UserPlus",
      phase: 1,
      status: "planning",
      progress: 0,
      ordem: 0,
      subModules: [
        {
          name: "Matrículas Online e Presencial",
          description:
            "Portal para realização de matrículas via web e atendimento presencial",
          status: "planning",
          ordem: 0,
        },
        {
          name: "Controle de Vagas",
          description: "Gestão de disponibilidade de vagas por turma e escola",
          status: "planning",
          ordem: 1,
        },
        {
          name: "Regras Especiais PCD",
          description:
            "Controle automático: máximo 3 alunos PCD por turma regular",
          status: "planning",
          ordem: 2,
        },
        {
          name: "Cadastro Completo de Alunos",
          description: "Ficha cadastral completa com histórico e documentação",
          status: "planning",
          ordem: 3,
        },
        {
          name: "Histórico Escolar Digital",
          description: "Registro digital do percurso acadêmico do aluno",
          status: "planning",
          ordem: 4,
        },
      ],
    },
    {
      name: "Gestão Pedagógica",
      description:
        "Calendários, frequência, notas, planejamento e acompanhamento acadêmico",
      icon: "BookOpen",
      phase: 2,
      status: "planning",
      progress: 0,
      ordem: 1,
      subModules: [
        {
          name: "Calendários",
          description:
            "Calendário letivo, avaliações, conselhos de classe e recuperação",
          status: "planning",
          ordem: 0,
        },
        {
          name: "Frequência Diária",
          description:
            "Registro de presença com integração ao Sistema Presença (Gov. Federal)",
          status: "planning",
          ordem: 1,
        },
        {
          name: "Lançamento de Notas",
          description: "Sistema de avaliação e registro de conceitos",
          status: "planning",
          ordem: 2,
        },
        {
          name: "Acompanhamento de Aprendizagens",
          description: "Monitoramento do desenvolvimento acadêmico dos alunos",
          status: "planning",
          ordem: 3,
        },
        {
          name: "Planejamento Pedagógico",
          description:
            "Planos de aula, conteúdos programáticos e banco de atividades",
          status: "planning",
          ordem: 4,
        },
      ],
    },
    {
      name: "Portais de Acesso",
      description:
        "Interfaces personalizadas para Professor, Aluno, Diretor, Secretaria, Coordenação e SEMEC",
      icon: "Layout",
      phase: 2,
      status: "planning",
      progress: 0,
      ordem: 2,
      subModules: [
        {
          name: "Portal do Professor",
          description:
            "Dashboard, frequência, notas, ocorrências e planejamento",
          status: "planning",
          ordem: 0,
        },
        {
          name: "Portal do Aluno/Responsável",
          description: "Consulta de notas, frequência, tarefas e comunicação",
          status: "planning",
          ordem: 1,
        },
        {
          name: "Portal do Diretor",
          description: "Visão geral, indicadores e gestão da escola",
          status: "planning",
          ordem: 2,
        },
        {
          name: "Portal da Secretaria Escolar",
          description:
            "Documentação, declarações, transferências e arquivo digital",
          status: "planning",
          ordem: 3,
        },
        {
          name: "Portal da Coordenação",
          description: "Acompanhamento pedagógico e gestão de projetos",
          status: "planning",
          ordem: 4,
        },
        {
          name: "Portal da SEMEC",
          description: "Dashboard municipal e indicadores consolidados",
          status: "planning",
          ordem: 5,
        },
      ],
    },
    {
      name: "Gestão de Recursos Humanos",
      description:
        "Cadastro de servidores, lotação, horários, folha de ponto e licenças",
      icon: "Users",
      phase: 1,
      status: "planning",
      progress: 0,
      ordem: 3,
      subModules: [
        {
          name: "Cadastro de Servidores",
          description: "Base completa de dados dos funcionários",
          status: "planning",
          ordem: 0,
        },
        {
          name: "Lotação de Professores",
          description: "Alocação de docentes por escola e disciplina",
          status: "planning",
          ordem: 1,
        },
        {
          name: "Gestão de Horários",
          description: "Controle de carga horária e ACs por área",
          status: "planning",
          ordem: 2,
        },
        {
          name: "Folha de Ponto Digital",
          description: "Registro eletrônico de presença de servidores",
          status: "planning",
          ordem: 3,
        },
        {
          name: "Licenças e Afastamentos",
          description: "Controle de ausências e substituições",
          status: "planning",
          ordem: 4,
        },
      ],
    },
    {
      name: "Programas Especiais",
      description: "Busca Ativa Escolar e Educação Especial (AEE)",
      icon: "Heart",
      phase: 4,
      status: "planning",
      progress: 0,
      ordem: 4,
      subModules: [
        {
          name: "Busca Ativa Escolar",
          description:
            "Interface para assistentes sociais, registro e acompanhamento",
          status: "planning",
          ordem: 0,
        },
        {
          name: "Educação Especial",
          description: "Cadastro de alunos especiais, AEE e salas de recursos",
          status: "planning",
          ordem: 1,
        },
        {
          name: "Acompanhamento Individualizado",
          description: "Planos personalizados e monitoramento contínuo",
          status: "planning",
          ordem: 2,
        },
      ],
    },
    {
      name: "Alimentação Escolar",
      description: "Cardápios, estoque, fornecedores e relatórios PNAE",
      icon: "Utensils",
      phase: 4,
      status: "planning",
      progress: 0,
      ordem: 5,
      subModules: [
        {
          name: "Gestão de Cardápios",
          description: "Planejamento nutricional de refeições escolares",
          status: "planning",
          ordem: 0,
        },
        {
          name: "Controle de Estoque",
          description: "Gestão de insumos e despensa",
          status: "planning",
          ordem: 1,
        },
        {
          name: "Registro de Refeições",
          description: "Controle de refeições servidas por escola",
          status: "planning",
          ordem: 2,
        },
        {
          name: "Relatórios FNDE/PNAE",
          description: "Prestação de contas para programas federais",
          status: "planning",
          ordem: 3,
        },
      ],
    },
    {
      name: "Transporte Escolar",
      description: "Rotas, veículos, motoristas, manutenção e relatórios PNATE",
      icon: "Bus",
      phase: 4,
      status: "planning",
      progress: 0,
      ordem: 6,
      subModules: [
        {
          name: "Gestão de Rotas",
          description: "Planejamento e otimização de itinerários",
          status: "planning",
          ordem: 0,
        },
        {
          name: "Cadastro de Veículos",
          description: "Frota escolar e documentação",
          status: "planning",
          ordem: 1,
        },
        {
          name: "Controle de Motoristas",
          description: "Gestão de condutores e habilitações",
          status: "planning",
          ordem: 2,
        },
        {
          name: "Manutenção Preventiva",
          description: "Agenda de revisões e reparos",
          status: "planning",
          ordem: 3,
        },
      ],
    },
    {
      name: "Gestão Democrática",
      description: "Colegiado, Grêmio, Líderes de Turma e assembleias",
      icon: "Scale",
      phase: 3,
      status: "planning",
      progress: 0,
      ordem: 7,
      subModules: [
        {
          name: "Colegiado Escolar",
          description: "Gestão de membros, atas e decisões",
          status: "planning",
          ordem: 0,
        },
        {
          name: "Grêmio Estudantil",
          description: "Eleições, projetos e atividades estudantis",
          status: "planning",
          ordem: 1,
        },
        {
          name: "Líderes de Turma",
          description: "Cadastro, atribuições e comunicação",
          status: "planning",
          ordem: 2,
        },
        {
          name: "Reuniões e Assembleias",
          description: "Agendamento e registro de encontros",
          status: "planning",
          ordem: 3,
        },
      ],
    },
    {
      name: "Comunicação e Eventos",
      description: "Plantões, reuniões de pais, comunicados e notificações",
      icon: "Bell",
      phase: 4,
      status: "planning",
      progress: 0,
      ordem: 8,
      subModules: [
        {
          name: "Plantão Pedagógico",
          description: "Agendamento e registro de atendimentos",
          status: "planning",
          ordem: 0,
        },
        {
          name: "Reuniões de Pais",
          description: "Convocações, atas e controle de frequência",
          status: "planning",
          ordem: 1,
        },
        {
          name: "Comunicados Gerais",
          description: "Sistema de avisos para comunidade escolar",
          status: "planning",
          ordem: 2,
        },
        {
          name: "Notificações Push/SMS/Email",
          description: "Alertas automáticos multicanal",
          status: "planning",
          ordem: 3,
        },
      ],
    },
  ];

  const createdModules: { id: string; name: string }[] = [];
  let totalSubModules = 0;

  for (const moduleData of modulesData) {
    const { subModules, ...moduleInfo } = moduleData;

    const module = await prisma.module.create({
      data: {
        ...moduleInfo,
        subModules: {
          create: subModules,
        },
      },
      include: { subModules: true },
    });

    createdModules.push({ id: module.id, name: module.name });
    totalSubModules += module.subModules.length;
  }
  console.log(
    `✅ ${modulesData.length} módulos criados com ${totalSubModules} submódulos`
  );

  // ==================== FASES DO CRONOGRAMA ====================
  console.log("📅 Criando fases do cronograma...");

  const moduleMap = new Map(createdModules.map((m) => [m.name, m.id]));

  const phasesData = [
    {
      name: "Fase 1 - Fundação",
      description:
        "Estabelecimento da base: matrículas, RH básico e portal da secretaria",
      monthRange: "Meses 1-3",
      duration: "3 meses",
      ordem: 0,
      status: "planning",
      moduleNames: [
        "Gestão de Matrículas e Alunos",
        "Gestão de Recursos Humanos",
      ],
    },
    {
      name: "Fase 2 - Núcleo Pedagógico",
      description:
        "Implementação do core pedagógico com portais para professores e alunos",
      monthRange: "Meses 4-6",
      duration: "3 meses",
      ordem: 1,
      status: "planning",
      moduleNames: ["Gestão Pedagógica", "Portais de Acesso"],
    },
    {
      name: "Fase 3 - Gestão",
      description: "Ferramentas de gestão para direção, coordenação e SEMEC",
      monthRange: "Meses 7-9",
      duration: "3 meses",
      ordem: 2,
      status: "planning",
      moduleNames: ["Gestão Democrática"],
    },
    {
      name: "Fase 4 - Expansão",
      description: "Programas especiais, alimentação, transporte e comunicação",
      monthRange: "Meses 10-12",
      duration: "3 meses",
      ordem: 3,
      status: "planning",
      moduleNames: [
        "Programas Especiais",
        "Alimentação Escolar",
        "Transporte Escolar",
        "Comunicação e Eventos",
      ],
    },
  ];

  for (const phaseData of phasesData) {
    const { moduleNames, ...phaseInfo } = phaseData;
    const moduleIds = moduleNames
      .map((name) => moduleMap.get(name))
      .filter(Boolean) as string[];

    await prisma.phase.create({
      data: {
        ...phaseInfo,
        moduleIds: JSON.stringify(moduleIds),
      },
    });
  }
  console.log(`✅ ${phasesData.length} fases criadas`);

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("\n📋 Dados criados:");
  console.log(`   - 1 usuário admin (admin@ibirapitanga.ba.gov.br / admin123)`);
  console.log(`   - ${etapas.length} etapas de ensino`);
  console.log(`   - ${totalSeries} séries`);
  console.log(`   - ${escolas.length} escolas`);
  console.log(`   - ${profissionais.length} profissionais`);
  console.log(`   - ${turmas.length} turmas`);
  console.log(`   - ${matriculas.length} matrículas`);
  console.log(`   - ${modulesData.length} módulos do sistema`);
  console.log(`   - ${totalSubModules} submódulos`);
  console.log(`   - ${phasesData.length} fases do cronograma`);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
