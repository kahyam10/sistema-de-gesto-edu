// Seed de PRODUÇÃO — idempotente, roda a cada boot do container.
// - NÃO apaga nada (sem deleteMany)
// - Admin criado a partir de ADMIN_EMAIL/ADMIN_PASSWORD (não sobrescreve se já existir)
// - Hierarquia de ensino padrão criada apenas se a tabela estiver vazia
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const HIERARQUIA = {
  nome: "Educação Básica",
  descricao: "Educação Infantil, Ensino Fundamental e Ensino Médio",
  ordem: 1,
  etapas: [
    {
      nome: "Educação Infantil",
      descricao: "Primeira etapa da educação básica (0 a 5 anos)",
      ordem: 1,
      niveis: [
        {
          nome: "Creche",
          descricao: "Atendimento a crianças de 0 a 3 anos",
          ordem: 1,
          series: ["Berçário I", "Berçário II", "Maternal I", "Maternal II"],
        },
        {
          nome: "Pré-escola",
          descricao: "Atendimento a crianças de 4 e 5 anos",
          ordem: 2,
          series: ["Pré I (4 anos)", "Pré II (5 anos)"],
        },
      ],
    },
    {
      nome: "Ensino Fundamental",
      descricao: "Segunda etapa da educação básica (6 a 14 anos)",
      ordem: 2,
      niveis: [
        {
          nome: "Anos Iniciais",
          descricao: "1º ao 5º ano (6 a 10 anos)",
          ordem: 1,
          series: ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano"],
        },
        {
          nome: "Anos Finais",
          descricao: "6º ao 9º ano (11 a 14 anos)",
          ordem: 2,
          series: ["6º Ano", "7º Ano", "8º Ano", "9º Ano"],
        },
      ],
    },
    {
      nome: "Ensino Médio",
      descricao: "Terceira etapa da educação básica (15 a 17 anos)",
      ordem: 3,
      niveis: [
        {
          nome: "Médio Regular",
          descricao: "1ª a 3ª série do Ensino Médio",
          ordem: 1,
          series: ["1ª Série", "2ª Série", "3ª Série"],
        },
      ],
    },
  ],
};

async function garantirAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios");
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD deve ter no mínimo 8 caracteres");
  }

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    console.log(`✓ Admin já existe: ${email} (senha não alterada)`);
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, password: hash, nome: "Administrador SEMEC", role: "ADMIN" },
  });
  console.log(`✓ Admin criado: ${email}`);
}

async function garantirHierarquia() {
  const total = await prisma.tipoEducacao.count();
  if (total > 0) {
    console.log("✓ Hierarquia de ensino já existe (nada a fazer)");
    return;
  }

  await prisma.tipoEducacao.create({
    data: {
      nome: HIERARQUIA.nome,
      descricao: HIERARQUIA.descricao,
      ordem: HIERARQUIA.ordem,
      etapas: {
        create: HIERARQUIA.etapas.map((etapa) => ({
          nome: etapa.nome,
          descricao: etapa.descricao,
          ordem: etapa.ordem,
          niveis: {
            create: etapa.niveis.map((nivel) => ({
              nome: nivel.nome,
              descricao: nivel.descricao,
              ordem: nivel.ordem,
              series: {
                create: nivel.series.map((nome, i) => ({
                  nome,
                  ordem: i + 1,
                })),
              },
            })),
          },
        })),
      },
    },
  });
  console.log("✓ Hierarquia de ensino padrão criada");
}

(async () => {
  console.log("🌱 Seed de produção (idempotente)...");
  await garantirAdmin();
  await garantirHierarquia();
  await prisma.$disconnect();
  console.log("✓ Seed de produção concluído");
})().catch(async (err) => {
  console.error("Erro no seed de produção:", err.message);
  await prisma.$disconnect();
  process.exit(1);
});
