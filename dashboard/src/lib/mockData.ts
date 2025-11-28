import { EtapaEnsino, Serie, Escola, Matricula, Turma } from './types'

const primeiroNomes = [
  'Ana', 'Pedro', 'Maria', 'João', 'Lucas', 'Beatriz', 'Gabriel', 'Julia',
  'Rafael', 'Laura', 'Carlos', 'Fernanda', 'Bruno', 'Camila', 'Diego',
  'Amanda', 'Felipe', 'Isabela', 'Rodrigo', 'Mariana', 'Thiago', 'Carolina',
  'Gustavo', 'Natália', 'Leonardo', 'Patrícia', 'André', 'Juliana', 'Daniel',
  'Aline', 'Marcos', 'Bianca', 'Vinicius', 'Larissa', 'Matheus', 'Priscila',
  'Ricardo', 'Vanessa', 'Leandro', 'Renata', 'Paulo', 'Cristina', 'Henrique',
  'Simone', 'Eduardo', 'Adriana', 'Alexandre', 'Daniela', 'Fernando', 'Michele'
]

const sobrenomes = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves',
  'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho',
  'Rocha', 'Almeida', 'Nascimento', 'Araújo', 'Melo', 'Barbosa', 'Cardoso',
  'Reis', 'Castro', 'Andrade', 'Nunes', 'Ramos', 'Pinto', 'Dias', 'Monteiro',
  'Campos', 'Freitas', 'Correia', 'Mendes', 'Cavalcanti', 'Teixeira', 'Miranda'
]

const enderecos = [
  'Rua das Flores', 'Avenida Principal', 'Travessa do Sol', 'Rua da Praia',
  'Avenida Central', 'Rua do Comércio', 'Travessa da Igreja', 'Rua Nova',
  'Avenida Beira Mar', 'Rua do Porto', 'Travessa das Palmeiras', 'Rua São João',
  'Avenida da Liberdade', 'Rua Santa Rita', 'Travessa do Campo', 'Rua do Mercado'
]

const necessidadesEspeciaisTipos = [
  'Deficiência Visual Parcial',
  'Deficiência Auditiva Leve',
  'Transtorno do Espectro Autista (TEA)',
  'TDAH - Transtorno do Déficit de Atenção',
  'Dislexia',
  'Deficiência Física - Mobilidade Reduzida',
  'Síndrome de Down'
]

function gerarNomeCompleto(): string {
  const primeiro = primeiroNomes[Math.floor(Math.random() * primeiroNomes.length)]
  const sobrenome1 = sobrenomes[Math.floor(Math.random() * sobrenomes.length)]
  const sobrenome2 = sobrenomes[Math.floor(Math.random() * sobrenomes.length)]
  return `${primeiro} ${sobrenome1} ${sobrenome2}`
}

function gerarCPF(): string {
  const nums = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
  const d1 = nums.reduce((acc, n, i) => acc + n * (10 - i), 0) % 11
  const d2 = [...nums, d1 < 2 ? 0 : 11 - d1].reduce((acc, n, i) => acc + n * (11 - i), 0) % 11
  return [...nums, d1 < 2 ? 0 : 11 - d1, d2 < 2 ? 0 : 11 - d2].join('')
}

function gerarTelefone(): string {
  const ddd = 73
  const num = Math.floor(90000000 + Math.random() * 10000000)
  return `(${ddd}) 9${num}`
}

function gerarEmail(nome: string): string {
  const nomeLimpo = nome.toLowerCase().replace(/\s+/g, '.').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return `${nomeLimpo}@email.com`
}

function gerarEndereco(): string {
  const rua = enderecos[Math.floor(Math.random() * enderecos.length)]
  const numero = Math.floor(Math.random() * 500) + 1
  return `${rua}, ${numero}`
}

function gerarDataNascimento(idadeMinima: number, idadeMaxima: number): string {
  const hoje = new Date()
  const idade = Math.floor(Math.random() * (idadeMaxima - idadeMinima + 1)) + idadeMinima
  const ano = hoje.getFullYear() - idade
  const mes = Math.floor(Math.random() * 12)
  const dia = Math.floor(Math.random() * 28) + 1
  return new Date(ano, mes, dia).toISOString().split('T')[0]
}

export const seriesMockadas: Serie[] = [
  { id: 'serie-1', nome: '1º Ano', ordem: 1 },
  { id: 'serie-2', nome: '2º Ano', ordem: 2 },
  { id: 'serie-3', nome: '3º Ano', ordem: 3 },
  { id: 'serie-4', nome: '4º Ano', ordem: 4 },
  { id: 'serie-5', nome: '5º Ano', ordem: 5 },
  { id: 'serie-6', nome: '6º Ano', ordem: 6 },
  { id: 'serie-7', nome: '7º Ano', ordem: 7 },
  { id: 'serie-8', nome: '8º Ano', ordem: 8 },
  { id: 'serie-9', nome: '9º Ano', ordem: 9 }
]

export const etapasMockadas: EtapaEnsino[] = [
  {
    id: 'etapa-1',
    nome: 'Educação Infantil',
    descricao: 'Creche e Pré-escola',
    series: [
      { id: 'serie-inf-1', nome: 'Maternal I', ordem: 1 },
      { id: 'serie-inf-2', nome: 'Maternal II', ordem: 2 },
      { id: 'serie-inf-3', nome: 'Pré I', ordem: 3 },
      { id: 'serie-inf-4', nome: 'Pré II', ordem: 4 }
    ]
  },
  {
    id: 'etapa-2',
    nome: 'Ensino Fundamental I',
    descricao: 'Anos iniciais do Ensino Fundamental (1º ao 5º ano)',
    series: seriesMockadas.slice(0, 5)
  },
  {
    id: 'etapa-3',
    nome: 'Ensino Fundamental II',
    descricao: 'Anos finais do Ensino Fundamental (6º ao 9º ano)',
    series: seriesMockadas.slice(5, 9)
  }
]

export const escolasMockadas: Escola[] = [
  {
    id: 'escola-1',
    nome: 'Escola Municipal Professor José Carlos',
    codigo: 'EM-001',
    endereco: 'Rua Principal, 150 - Centro',
    telefone: '(73) 3537-1001',
    email: 'em.josecarlos@ibirapitanga.ba.gov.br',
    etapasVinculadas: ['etapa-2', 'etapa-3'],
    ativa: true
  },
  {
    id: 'escola-2',
    nome: 'Escola Municipal Maria das Graças',
    codigo: 'EM-002',
    endereco: 'Avenida Central, 300 - Bairro Novo',
    telefone: '(73) 3537-1002',
    email: 'em.mariagracas@ibirapitanga.ba.gov.br',
    etapasVinculadas: ['etapa-1', 'etapa-2'],
    ativa: true
  },
  {
    id: 'escola-3',
    nome: 'Escola Municipal São Francisco',
    codigo: 'EM-003',
    endereco: 'Rua da Igreja, 75 - São Francisco',
    telefone: '(73) 3537-1003',
    email: 'em.saofrancisco@ibirapitanga.ba.gov.br',
    etapasVinculadas: ['etapa-2'],
    ativa: true
  },
  {
    id: 'escola-4',
    nome: 'Escola Municipal Santa Rita',
    codigo: 'EM-004',
    endereco: 'Travessa das Flores, 220 - Santa Rita',
    telefone: '(73) 3537-1004',
    email: 'em.santarita@ibirapitanga.ba.gov.br',
    etapasVinculadas: ['etapa-3'],
    ativa: true
  },
  {
    id: 'escola-5',
    nome: 'Centro Educacional Horizonte',
    codigo: 'CE-005',
    endereco: 'Avenida Beira Mar, 500 - Praia',
    telefone: '(73) 3537-1005',
    email: 'ce.horizonte@ibirapitanga.ba.gov.br',
    etapasVinculadas: ['etapa-2', 'etapa-3'],
    ativa: true
  },
  {
    id: 'escola-6',
    nome: 'Escola Municipal Pequeno Príncipe',
    codigo: 'EM-006',
    endereco: 'Rua do Porto, 180 - Porto Seguro',
    telefone: '(73) 3537-1006',
    email: 'em.pequenoprinc@ibirapitanga.ba.gov.br',
    etapasVinculadas: ['etapa-1'],
    ativa: true
  }
]

function gerarTurmasPorEscola(): Turma[] {
  const turmas: Turma[] = []
  const turnos: Array<'matutino' | 'vespertino' | 'noturno'> = ['matutino', 'vespertino']
  const letras = ['A', 'B', 'C', 'D']
  
  escolasMockadas.forEach(escola => {
    escola.etapasVinculadas.forEach(etapaId => {
      const etapa = etapasMockadas.find(e => e.id === etapaId)
      if (!etapa) return
      
      etapa.series.forEach(serie => {
        const numTurmasPorSerie = Math.random() > 0.6 ? 2 : 1
        
        for (let i = 0; i < numTurmasPorSerie; i++) {
          const turno = turnos[Math.floor(Math.random() * turnos.length)]
          const letra = letras[i]
          
          turmas.push({
            id: `turma-${escola.id}-${serie.id}-${turno}-${letra}`,
            escolaId: escola.id,
            serieId: serie.id,
            nome: `${serie.nome} ${letra}`,
            turno: turno,
            anoLetivo: '2025',
            capacidadeMaxima: 30,
            limitePCD: 2,
            ativa: true
          })
        }
      })
    })
  })
  
  return turmas
}

export const turmasMockadas = gerarTurmasPorEscola()

function gerarMatriculas(): Matricula[] {
  const matriculas: Matricula[] = []
  const totalAlunos = 200
  const percentualPCD = 0.08
  const totalPCD = Math.floor(totalAlunos * percentualPCD)
  
  const turmasComContadores = turmasMockadas.map(turma => ({
    turma,
    alunosMatriculados: 0,
    pcdMatriculados: 0
  }))
  
  function obterTurmaDisponivel(serieId: string, isPCD: boolean): typeof turmasComContadores[0] | null {
    const turmasCandidatas = turmasComContadores.filter(tc => 
      tc.turma.serieId === serieId && 
      tc.turma.ativa &&
      tc.alunosMatriculados < tc.turma.capacidadeMaxima
    )
    
    if (isPCD) {
      const turmasComVagaPCD = turmasCandidatas.filter(tc => 
        tc.pcdMatriculados < tc.turma.limitePCD
      )
      if (turmasComVagaPCD.length === 0) return null
      
      turmasComVagaPCD.sort((a, b) => a.alunosMatriculados - b.alunosMatriculados)
      return turmasComVagaPCD[0]
    }
    
    if (turmasCandidatas.length === 0) return null
    turmasCandidatas.sort((a, b) => a.alunosMatriculados - b.alunosMatriculados)
    return turmasCandidatas[0]
  }
  
  const idadesMinMaxPorSerie: Record<string, { min: number, max: number }> = {
    'serie-inf-1': { min: 2, max: 3 },
    'serie-inf-2': { min: 3, max: 4 },
    'serie-inf-3': { min: 4, max: 5 },
    'serie-inf-4': { min: 5, max: 6 },
    'serie-1': { min: 6, max: 7 },
    'serie-2': { min: 7, max: 8 },
    'serie-3': { min: 8, max: 9 },
    'serie-4': { min: 9, max: 10 },
    'serie-5': { min: 10, max: 11 },
    'serie-6': { min: 11, max: 12 },
    'serie-7': { min: 12, max: 13 },
    'serie-8': { min: 13, max: 14 },
    'serie-9': { min: 14, max: 15 }
  }
  
  let pcdCriados = 0
  
  for (let i = 0; i < totalAlunos; i++) {
    const turmaComContador = turmasComContadores[Math.floor(Math.random() * turmasComContadores.length)]
    if (!turmaComContador) continue
    
    const { turma } = turmaComContador
    const escola = escolasMockadas.find(e => e.id === turma.escolaId)
    if (!escola) continue
    
    const etapa = etapasMockadas.find(et => et.series.some(s => s.id === turma.serieId))
    if (!etapa) continue
    
    const serie = etapa.series.find(s => s.id === turma.serieId)
    if (!serie) continue
    
    const isPCD = pcdCriados < totalPCD && Math.random() < 0.15
    
    const turmaDisponivel = obterTurmaDisponivel(serie.id, isPCD)
    if (!turmaDisponivel) {
      i--
      continue
    }
    
    const nomeAluno = gerarNomeCompleto()
    const nomeResponsavel = gerarNomeCompleto()
    const idadeInfo = idadesMinMaxPorSerie[serie.id] || { min: 6, max: 15 }
    
    const necessidadesEspeciais = isPCD
    let descricaoNecessidades: string | undefined
    
    if (necessidadesEspeciais) {
      descricaoNecessidades = necessidadesEspeciaisTipos[Math.floor(Math.random() * necessidadesEspeciaisTipos.length)]
      pcdCriados++
      turmaDisponivel.pcdMatriculados++
    }
    
    const matricula: Matricula = {
      id: `mat-${Date.now()}-${i}`,
      escolaId: turmaDisponivel.turma.escolaId,
      etapaEnsinoId: etapa.id,
      serieId: serie.id,
      turmaId: turmaDisponivel.turma.id,
      nomeAluno,
      dataNascimento: gerarDataNascimento(idadeInfo.min, idadeInfo.max),
      cpfAluno: gerarCPF(),
      nomeResponsavel,
      cpfResponsavel: gerarCPF(),
      telefoneResponsavel: gerarTelefone(),
      emailResponsavel: gerarEmail(nomeResponsavel),
      endereco: gerarEndereco(),
      necessidadesEspeciais,
      descricaoNecessidades,
      dataMatricula: new Date(2025, 0, Math.floor(Math.random() * 31) + 1).toISOString().split('T')[0],
      status: 'ativa'
    }
    
    turmaDisponivel.alunosMatriculados++
    matriculas.push(matricula)
  }
  
  return matriculas
}

export const matriculasMockadas = gerarMatriculas()

export function gerarEstatisticasTurmas() {
  const estatisticas = turmasMockadas.map(turma => {
    const alunosDaTurma = matriculasMockadas.filter(m => m.turmaId === turma.id)
    const pcdNaTurma = alunosDaTurma.filter(m => m.necessidadesEspeciais)
    
    return {
      turma,
      totalAlunos: alunosDaTurma.length,
      totalPCD: pcdNaTurma.length,
      vagasDisponiveis: turma.capacidadeMaxima - alunosDaTurma.length,
      vagasPCDDisponiveis: turma.limitePCD - pcdNaTurma.length,
      percentualOcupacao: Math.round((alunosDaTurma.length / turma.capacidadeMaxima) * 100)
    }
  })
  
  return estatisticas
}

export function gerarEstatisticasEscolas() {
  const estatisticas = escolasMockadas.map(escola => {
    const turmasDaEscola = turmasMockadas.filter(t => t.escolaId === escola.id)
    const alunosDaEscola = matriculasMockadas.filter(m => m.escolaId === escola.id)
    const pcdNaEscola = alunosDaEscola.filter(m => m.necessidadesEspeciais)
    
    return {
      escola,
      totalTurmas: turmasDaEscola.length,
      totalAlunos: alunosDaEscola.length,
      totalPCD: pcdNaEscola.length,
      percentualPCD: Math.round((pcdNaEscola.length / alunosDaEscola.length) * 100)
    }
  })
  
  return estatisticas
}

export function gerarResumoGeral() {
  const totalEscolas = escolasMockadas.filter(e => e.ativa).length
  const totalTurmas = turmasMockadas.filter(t => t.ativa).length
  const totalAlunos = matriculasMockadas.filter(m => m.status === 'ativa').length
  const totalPCD = matriculasMockadas.filter(m => m.necessidadesEspeciais && m.status === 'ativa').length
  const turmasViolandoLimite = gerarEstatisticasTurmas().filter(et => et.totalPCD > et.turma.limitePCD)
  
  return {
    totalEscolas,
    totalTurmas,
    totalAlunos,
    totalPCD,
    percentualPCD: Math.round((totalPCD / totalAlunos) * 100),
    turmasViolandoLimitePCD: turmasViolandoLimite.length,
    mediaAlunosPorTurma: Math.round(totalAlunos / totalTurmas)
  }
}
