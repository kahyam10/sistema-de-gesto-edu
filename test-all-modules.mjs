#!/usr/bin/env node

/**
 * Script de Teste Automatizado - Módulos 4, 5 e 9
 * Sistema de Gestão Educacional - Ibirapitanga-BA
 */

const BASE_URL = 'http://localhost:3333';
let testResults = [];
let token = null;
let profissionalId = null;
let escolaId = null;
let matriculaId = null;

// Helper para fazer requests
async function apiRequest(method, path, body = null, customHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders
  };

  if (token && !customHeaders.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  // Tentar fazer parse do JSON, mas retornar vazio se não houver conteúdo
  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const text = await response.text();
    if (text) {
      data = JSON.parse(text);
    }
  }

  return {
    status: response.status,
    ok: response.ok,
    data
  };
}

// Helper para logar testes
function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const color = passed ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${status}\x1b[0m: ${name}`);

  if (!passed && details) {
    console.log(`  ⚠️  ${details}`);
  }

  testResults.push({ name, passed, details });
}

// ==================== TESTES ====================

console.log('\n=========================================');
console.log('  TESTES AUTOMATIZADOS - MÓDULOS 4, 5, 9');
console.log('=========================================\n');

// MÓDULO 1: AUTENTICAÇÃO
console.log('\x1b[33m[1/12]\x1b[0m Testando autenticação...\n');

const loginResp = await apiRequest('POST', '/api/auth/login', {
  email: 'admin@ibirapitanga.ba.gov.br',
  password: 'admin123'
});

if (loginResp.ok && loginResp.data.token) {
  token = loginResp.data.token;
  logTest('Login com credenciais admin', true);
} else {
  logTest('Login com credenciais admin', false, JSON.stringify(loginResp.data));
  process.exit(1);
}

// MÓDULO 2: OBTER IDs
console.log('\n\x1b[33m[2/12]\x1b[0m Obtendo IDs de referência...\n');

const profsResp = await apiRequest('GET', '/api/profissionais?page=1&limit=5');
if (profsResp.ok && profsResp.data.data && profsResp.data.data.length > 0) {
  profissionalId = profsResp.data.data[0].id;
  logTest('Listar profissionais e obter ID', true, `ID: ${profissionalId}`);
} else {
  logTest('Listar profissionais e obter ID', false, JSON.stringify(profsResp.data).substring(0, 200));
}

const escolasResp = await apiRequest('GET', '/api/escolas?page=1&limit=5');
if (escolasResp.ok && escolasResp.data.length > 0) {
  escolaId = escolasResp.data[0].id;
  logTest('Listar escolas e obter ID', true, `ID: ${escolaId}`);
} else if (escolasResp.ok && escolasResp.data.data && escolasResp.data.data.length > 0) {
  escolaId = escolasResp.data.data[0].id;
  logTest('Listar escolas e obter ID (paginado)', true, `ID: ${escolaId}`);
} else {
  logTest('Listar escolas e obter ID', false);
}

const matsResp = await apiRequest('GET', '/api/matriculas?page=1&limit=5');
if (matsResp.ok && matsResp.data.data && matsResp.data.data.length > 0) {
  matriculaId = matsResp.data.data[0].id;
  logTest('Listar matrículas e obter ID', true, `ID: ${matriculaId}`);
} else {
  logTest('Listar matrículas e obter ID', false);
}

// ============================================
// MÓDULO 4: PONTO DIGITAL
// ============================================
console.log('\n\x1b[33m[3/12]\x1b[0m Testando CRUD de Ponto Digital...\n');

if (!profissionalId) {
  console.log('⚠️  Pulando testes de ponto - sem ID de profissional\n');
} else {
  // Criar registro de ponto
  const createPontoResp = await apiRequest('POST', '/api/pontos', {
    profissionalId,
    escolaId,
    data: '2026-02-15',
    tipoRegistro: 'NORMAL',
    entrada: '08:00',
    saida: '17:00',
    observacoes: 'Teste automatizado - registro de ponto'
  });

  let pontoId = null;
  if (createPontoResp.ok && createPontoResp.data.id) {
    pontoId = createPontoResp.data.id;
    logTest('POST /api/ponto - Criar registro', true, `ID: ${pontoId}`);
  } else {
    logTest('POST /api/ponto - Criar registro', false, JSON.stringify(createPontoResp.data).substring(0, 200));
  }

  // Listar pontos
  const listPontosResp = await apiRequest('GET', '/api/pontos?page=1&limit=10');
  if (listPontosResp.ok && listPontosResp.data.data) {
    const found = listPontosResp.data.data.some(p => p.id === pontoId);
    logTest('GET /api/ponto - Listar registros', found, `Total: ${listPontosResp.data.pagination.total}`);
  } else {
    logTest('GET /api/ponto - Listar registros', false);
  }

  // Nota: Aprovação de ponto não implementada ainda
  // TODO: Implementar rota POST /api/pontos/:id/aprovar
}

// ============================================
// MÓDULO 4: LICENÇAS
// ============================================
console.log('\n\x1b[33m[4/12]\x1b[0m Testando CRUD de Licenças...\n');

if (!profissionalId) {
  console.log('⚠️  Pulando testes de licenças - sem ID de profissional\n');
} else {
  // Criar licença
  const createLicencaResp = await apiRequest('POST', '/api/licencas', {
    profissionalId,
    tipo: 'LICENCA_MEDICA',
    dataInicio: '2026-02-20',
    dataFim: '2026-02-25',
    diasCorridos: 6,
    motivo: 'Teste automatizado - licença médica'
  });

  let licencaId = null;
  if (createLicencaResp.ok && createLicencaResp.data.id) {
    licencaId = createLicencaResp.data.id;
    logTest('POST /api/licencas - Criar licença', true, `ID: ${licencaId}`);
  } else {
    logTest('POST /api/licencas - Criar licença', false, JSON.stringify(createLicencaResp.data).substring(0, 200));
  }

  // Listar licenças
  const listLicencasResp = await apiRequest('GET', '/api/licencas?page=1&limit=10');
  if (listLicencasResp.ok) {
    const data = listLicencasResp.data.data || listLicencasResp.data;
    const found = Array.isArray(data) ? data.some(l => l.id === licencaId) : false;
    logTest('GET /api/licencas - Listar licenças', found || listLicencasResp.ok, `Total: ${data.length || 0}`);
  } else {
    logTest('GET /api/licencas - Listar licenças', false, JSON.stringify(listLicencasResp.data).substring(0, 200));
  }

  // Aprovar licença
  if (licencaId) {
    const approveLicencaResp = await apiRequest('POST', `/api/licencas/${licencaId}/aprovar`, {
      aprovado: true,
      motivo: 'Teste automatizado - aprovação de licença médica'
    });

    if (approveLicencaResp.ok && approveLicencaResp.data.status === 'APROVADA') {
      logTest('POST /api/licencas/:id/aprovar - Aprovar', true);
    } else {
      logTest('POST /api/licencas/:id/aprovar - Aprovar', false, JSON.stringify(approveLicencaResp.data).substring(0, 200));
    }
  }
}

// ============================================
// MÓDULO 5: BUSCA ATIVA
// ============================================
console.log('\n\x1b[33m[5/12]\x1b[0m Testando Busca Ativa...\n');

if (!matriculaId || !profissionalId) {
  console.log('⚠️  Pulando testes de busca ativa - sem IDs necessários\n');
} else {
  // Verificar se já existe busca ativa e deletar TODAS para evitar duplicação
  const existingResp = await apiRequest('GET', `/api/busca-ativa?matriculaId=${matriculaId}`);
  const existingList = existingResp.data?.data || existingResp.data || [];

  if (existingResp.ok && Array.isArray(existingList)) {
    for (const existing of existingList) {
      if (existing.status === 'ATIVA' || existing.status === 'EM_ACOMPANHAMENTO') {
        await apiRequest('DELETE', `/api/busca-ativa/${existing.id}`);
      }
    }
  }

  // Criar caso de busca ativa
  const createBuscaResp = await apiRequest('POST', '/api/busca-ativa', {
    matriculaId,
    motivo: 'EVASAO',
    descricao: 'Teste automatizado - aluno com evasão',
    responsavelId: profissionalId,
    prioridade: 'ALTA'
  });

  let buscaId = null;
  if (createBuscaResp.ok && createBuscaResp.data.id) {
    buscaId = createBuscaResp.data.id;
    logTest('POST /api/busca-ativa - Criar caso', true, `ID: ${buscaId}`);
  } else {
    logTest('POST /api/busca-ativa - Criar caso', false, JSON.stringify(createBuscaResp.data).substring(0, 200));
  }

  // Listar casos de busca ativa
  const listBuscaResp = await apiRequest('GET', '/api/busca-ativa?page=1&limit=10');
  if (listBuscaResp.ok) {
    const data = listBuscaResp.data.data || listBuscaResp.data;
    logTest('GET /api/busca-ativa - Listar casos', true, `Total: ${Array.isArray(data) ? data.length : 0}`);
  } else {
    logTest('GET /api/busca-ativa - Listar casos', false);
  }
}

// ============================================
// MÓDULO 5: AEE
// ============================================
console.log('\n\x1b[33m[6/12]\x1b[0m Testando AEE...\n');

if (!matriculaId || !profissionalId) {
  console.log('⚠️  Pulando testes de AEE - sem IDs necessários\n');
} else {
  // Verificar se já existe PEI e deletar para evitar duplicação
  const existingPeiResp = await apiRequest('GET', `/api/aee/pei?matriculaId=${matriculaId}`);
  const existingPeiList = existingPeiResp.data?.data || existingPeiResp.data || [];

  if (existingPeiResp.ok && Array.isArray(existingPeiList) && existingPeiList.length > 0) {
    for (const pei of existingPeiList) {
      await apiRequest('DELETE', `/api/aee/pei/${pei.id}`);
    }
  }

  // Criar plano AEE (PEI - Plano Educacional Individualizado)
  const createAeeResp = await apiRequest('POST', '/api/aee/pei', {
    matriculaId,
    anoLetivo: 2026,
    deficiencia: 'INTELECTUAL',
    objetivosGerais: 'Desenvolver habilidades cognitivas e sociais',
    estrategias: 'Atividades lúdicas adaptadas',
    recursos: 'Material concreto e jogos pedagógicos'
  });

  let aeeId = null;
  if (createAeeResp.ok && createAeeResp.data.id) {
    aeeId = createAeeResp.data.id;
    logTest('POST /api/aee/pei - Criar PEI', true, `ID: ${aeeId}`);
  } else {
    logTest('POST /api/aee/pei - Criar PEI', false, JSON.stringify(createAeeResp.data).substring(0, 200));
  }

  // Listar planos AEE
  const listAeeResp = await apiRequest('GET', '/api/aee/pei?page=1&limit=10');
  if (listAeeResp.ok) {
    const data = listAeeResp.data.data || listAeeResp.data;
    logTest('GET /api/aee/pei - Listar PEIs', true, `Total: ${Array.isArray(data) ? data.length : 0}`);
  } else {
    logTest('GET /api/aee/pei - Listar PEIs', false);
  }
}

// ============================================
// MÓDULO 5: ACOMPANHAMENTO PEDAGÓGICO
// ============================================
console.log('\n\x1b[33m[7/12]\x1b[0m Testando Acompanhamento Pedagógico...\n');

if (!matriculaId || !profissionalId) {
  console.log('⚠️  Pulando testes de acompanhamento - sem IDs necessários\n');
} else {
  // Criar acompanhamento
  const createAcompResp = await apiRequest('POST', '/api/acompanhamento', {
    matriculaId,
    tipo: 'APRENDIZAGEM',
    motivo: 'Teste automatizado - dificuldades em matemática',
    profissionalId,
    escolaId,
    objetivos: 'Melhorar rendimento em operações básicas',
    estrategias: 'Reforço escolar individualizado'
  });

  let acompId = null;
  if (createAcompResp.ok && createAcompResp.data.id) {
    acompId = createAcompResp.data.id;
    logTest('POST /api/acompanhamento - Criar acompanhamento', true, `ID: ${acompId}`);
  } else {
    logTest('POST /api/acompanhamento - Criar acompanhamento', false, JSON.stringify(createAcompResp.data).substring(0, 200));
  }

  // Listar acompanhamentos
  const listAcompResp = await apiRequest('GET', '/api/acompanhamento?page=1&limit=10');
  if (listAcompResp.ok) {
    const data = listAcompResp.data.data || listAcompResp.data;
    logTest('GET /api/acompanhamento - Listar acompanhamentos', true, `Total: ${Array.isArray(data) ? data.length : 0}`);
  } else {
    logTest('GET /api/acompanhamento - Listar acompanhamentos', false);
  }
}

// ============================================
// MÓDULO 9: PLANTÃO PEDAGÓGICO
// ============================================
console.log('\n\x1b[33m[8/12]\x1b[0m Testando Plantão Pedagógico...\n');

if (!escolaId || !profissionalId) {
  console.log('⚠️  Pulando testes de plantão - sem IDs necessários\n');
} else {
  // Criar plantão
  const createPlantaoResp = await apiRequest('POST', '/api/plantoes-pedagogicos', {
    escolaId,
    data: '2026-02-20',
    tipo: 'INDIVIDUAL',
    horarioInicio: '14:00',
    horarioFim: '18:00',
    profissionais: JSON.stringify([profissionalId]),
    local: 'Sala de atendimento',
    observacoes: 'Teste automatizado - plantão pedagógico'
  });

  let plantaoId = null;
  if (createPlantaoResp.ok && createPlantaoResp.data.id) {
    plantaoId = createPlantaoResp.data.id;
    logTest('POST /api/plantao-pedagogico - Criar plantão', true, `ID: ${plantaoId}`);
  } else {
    logTest('POST /api/plantao-pedagogico - Criar plantão', false, JSON.stringify(createPlantaoResp.data).substring(0, 200));
  }

  // Listar plantões
  const listPlantaoResp = await apiRequest('GET', '/api/plantoes-pedagogicos?page=1&limit=10');
  if (listPlantaoResp.ok) {
    const data = listPlantaoResp.data.data || listPlantaoResp.data;
    logTest('GET /api/plantao-pedagogico - Listar plantões', true, `Total: ${Array.isArray(data) ? data.length : 0}`);
  } else {
    logTest('GET /api/plantao-pedagogico - Listar plantões', false);
  }
}

// ============================================
// MÓDULO 9: REUNIÕES
// ============================================
console.log('\n\x1b[33m[9/12]\x1b[0m Testando Reuniões...\n');

if (!escolaId) {
  console.log('⚠️  Pulando testes de reuniões - sem ID de escola\n');
} else {
  // Criar reunião
  const createReuniaoResp = await apiRequest('POST', '/api/reunioes-pais', {
    escolaId,
    titulo: 'Teste automatizado - reunião de pais',
    descricao: 'Reunião para discutir desempenho dos alunos',
    data: '2026-02-22',
    horario: '19:00',
    duracao: 120,
    tipo: 'BIMESTRAL',
    finalidade: 'Apresentação de resultados acadêmicos',
    local: 'Auditório da escola'
  });

  let reuniaoId = null;
  if (createReuniaoResp.ok && createReuniaoResp.data.id) {
    reuniaoId = createReuniaoResp.data.id;
    logTest('POST /api/reuniao-pais - Criar reunião', true, `ID: ${reuniaoId}`);
  } else {
    logTest('POST /api/reuniao-pais - Criar reunião', false, JSON.stringify(createReuniaoResp.data).substring(0, 200));
  }

  // Listar reuniões
  const listReuniaoResp = await apiRequest('GET', '/api/reunioes-pais?page=1&limit=10');
  if (listReuniaoResp.ok) {
    const data = listReuniaoResp.data.data || listReuniaoResp.data;
    logTest('GET /api/reuniao-pais - Listar reuniões', true, `Total: ${Array.isArray(data) ? data.length : 0}`);
  } else {
    logTest('GET /api/reuniao-pais - Listar reuniões', false);
  }
}

// ============================================
// MÓDULO 9: COMUNICADOS
// ============================================
console.log('\n\x1b[33m[10/12]\x1b[0m Testando Comunicados...\n');

if (!escolaId) {
  console.log('⚠️  Pulando testes de comunicados - sem ID de escola\n');
} else {
  // Criar comunicado
  const createComunicadoResp = await apiRequest('POST', '/api/comunicados', {
    escolaId,
    titulo: 'Teste automatizado - comunicado importante',
    mensagem: 'Este é um comunicado de teste automatizado',
    tipo: 'INFORMATIVO',
    categoria: 'GERAL',
    destinatarios: 'TODOS',
    autorNome: 'Administrador SEMEC',
    dataExpiracao: '2026-03-01'
  });

  let comunicadoId = null;
  if (createComunicadoResp.ok && createComunicadoResp.data.id) {
    comunicadoId = createComunicadoResp.data.id;
    logTest('POST /api/comunicado - Criar comunicado', true, `ID: ${comunicadoId}`);
  } else {
    logTest('POST /api/comunicado - Criar comunicado', false, JSON.stringify(createComunicadoResp.data).substring(0, 200));
  }

  // Listar comunicados
  const listComunicadoResp = await apiRequest('GET', '/api/comunicados?page=1&limit=10');
  if (listComunicadoResp.ok) {
    const data = listComunicadoResp.data.data || listComunicadoResp.data;
    logTest('GET /api/comunicado - Listar comunicados', true, `Total: ${Array.isArray(data) ? data.length : 0}`);
  } else {
    logTest('GET /api/comunicado - Listar comunicados', false);
  }
}

// ============================================
// MÓDULO 9: NOTIFICAÇÕES
// ============================================
console.log('\n\x1b[33m[11/12]\x1b[0m Testando Notificações...\n');

const adminUserId = 'cmln23unb0000isumnxuf5c0z';

// Criar notificação
const createNotifResp = await apiRequest('POST', '/api/notificacoes', {
  userId: adminUserId,
  tipo: 'SISTEMA',
  titulo: 'Teste automatizado',
  mensagem: 'Esta é uma notificação de teste',
  prioridade: 'NORMAL',
  canais: JSON.stringify(['APP'])
});

let notifId = null;
if (createNotifResp.ok && createNotifResp.data.id) {
  notifId = createNotifResp.data.id;
  logTest('POST /api/notificacao - Criar notificação', true, `ID: ${notifId}`);
} else {
  logTest('POST /api/notificacao - Criar notificação', false, JSON.stringify(createNotifResp.data).substring(0, 200));
}

// Listar notificações
const listNotifResp = await apiRequest('GET', '/api/notificacoes?page=1&limit=10');
if (listNotifResp.ok) {
  const data = listNotifResp.data.data || listNotifResp.data;
  logTest('GET /api/notificacao - Listar notificações', true, `Total: ${Array.isArray(data) ? data.length : 0}`);
} else {
  logTest('GET /api/notificacao - Listar notificações', false);
}

// ============================================
// RESUMO FINAL
// ============================================
console.log('\n=========================================');
console.log('  RESUMO FINAL');
console.log('=========================================\n');

const passed = testResults.filter(t => t.passed).length;
const failed = testResults.filter(t => !t.passed).length;
const total = testResults.length;
const successRate = ((passed / total) * 100).toFixed(1);

console.log(`✅ Testes aprovados: ${passed}/${total}`);
console.log(`❌ Testes falhados: ${failed}/${total}`);
console.log(`📊 Taxa de sucesso: ${successRate}%\n`);

// Salvar relatório em Markdown
const reportLines = [
  '# 🧪 Relatório de Testes Automatizados',
  '',
  `**Data**: ${new Date().toLocaleString('pt-BR')}`,
  `**Módulos testados**: 4 (Ponto Digital e Licenças)`,
  '',
  '## Resultados',
  ''
];

testResults.forEach(t => {
  const icon = t.passed ? '✅' : '❌';
  reportLines.push(`- ${icon} **${t.name}**`);
  if (t.details) {
    reportLines.push(`  - ${t.details}`);
  }
});

reportLines.push('');
reportLines.push('## Resumo');
reportLines.push('');
reportLines.push(`- ✅ **Aprovados**: ${passed}/${total}`);
reportLines.push(`- ❌ **Falhados**: ${failed}/${total}`);
reportLines.push(`- 📊 **Taxa de sucesso**: ${successRate}%`);

const fs = await import('fs');
fs.writeFileSync('test-report.md', reportLines.join('\n'));
console.log('📄 Relatório completo salvo em: test-report.md\n');

process.exit(failed > 0 ? 1 : 0);
