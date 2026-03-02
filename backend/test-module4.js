import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testModule4() {
  console.log('\n=== TESTE MÓDULO 4: PONTO DIGITAL E LICENÇAS ===\n');

  try {
    // 1. Listar profissionais
    console.log('📋 Profissionais cadastrados:');
    const profissionais = await prisma.profissional.findMany({
      include: {
        escolas: {
          include: {
            escola: true
          }
        }
      },
      take: 10
    });

    profissionais.forEach((prof, index) => {
      console.log(`${index + 1}. ${prof.nome} (${prof.tipo}) - ID: ${prof.id}`);
      if (prof.escolas.length > 0) {
        console.log(`   Escola: ${prof.escolas[0].escola.nome}`);
      }
    });

    if (profissionais.length === 0) {
      console.log('❌ Nenhum profissional encontrado!');
      return;
    }

    // 2. Verificar registros de ponto existentes
    console.log('\n⏰ Registros de Ponto Digital:');
    const pontos = await prisma.ponto.findMany({
      include: {
        profissional: true
      },
      take: 5,
      orderBy: {
        data: 'desc'
      }
    });

    if (pontos.length > 0) {
      pontos.forEach((ponto, index) => {
        console.log(`${index + 1}. ${ponto.profissional.nome} - ${ponto.data.toLocaleDateString()} - ${ponto.tipoRegistro}`);
        console.log(`   Entrada: ${ponto.entrada || 'N/A'} | Saída: ${ponto.saida || 'N/A'} | Status: ${ponto.status}`);
      });
    } else {
      console.log('📝 Nenhum registro de ponto encontrado. Será necessário criar via API.');
    }

    // 3. Verificar licenças existentes
    console.log('\n📄 Licenças registradas:');
    const licencas = await prisma.licenca.findMany({
      include: {
        profissional: true
      },
      take: 5,
      orderBy: {
        dataInicio: 'desc'
      }
    });

    if (licencas.length > 0) {
      licencas.forEach((licenca, index) => {
        console.log(`${index + 1}. ${licenca.profissional.nome} - ${licenca.tipo}`);
        console.log(`   ${licenca.dataInicio.toLocaleDateString()} a ${licenca.dataFim.toLocaleDateString()} - Status: ${licenca.status}`);
      });
    } else {
      console.log('📝 Nenhuma licença encontrada. Será necessário criar via API.');
    }

    console.log('\n✅ Verificação concluída!');
    console.log('\n📌 Próximos passos:');
    console.log('1. Testar criação de registros de ponto via POST /api/ponto');
    console.log('2. Testar listagem de pontos via GET /api/ponto');
    console.log('3. Testar criação de licenças via POST /api/licencas');
    console.log('4. Testar aprovação/rejeição de licenças via PATCH /api/licencas/:id/status');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testModule4();
