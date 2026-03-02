import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getIds() {
  try {
    const profissionais = await prisma.profissional.findMany({
      select: { id: true, nome: true, tipo: true },
      take: 5
    });

    console.log('PROFISSIONAIS:');
    profissionais.forEach(p => console.log(`${p.id} | ${p.nome} | ${p.tipo}`));

    const escolas = await prisma.escola.findMany({
      select: { id: true, nome: true },
      take: 3
    });

    console.log('\nESCOLAS:');
    escolas.forEach(e => console.log(`${e.id} | ${e.nome}`));

    const matriculas = await prisma.matricula.findMany({
      select: { id: true, nomeAluno: true },
      take: 3
    });

    console.log('\nMATRICULAS:');
    matriculas.forEach(m => console.log(`${m.id} | ${m.nomeAluno}`));

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getIds();
