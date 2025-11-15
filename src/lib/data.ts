import { Module, Phase, KPI, TechStack } from './types'

export const modules: Module[] = [
  {
    id: 'mod-1',
    name: 'Gestão de Matrículas e Alunos',
    description: 'Sistema completo para matrículas online/presencial, controle de vagas e gestão de alunos',
    icon: 'UserPlus',
    phase: 1,
    status: 'planning',
    progress: 0,
    subModules: [
      {
        id: 'mod-1-1',
        name: 'Matrículas Online e Presencial',
        description: 'Portal para realização de matrículas via web e atendimento presencial',
        status: 'planning'
      },
      {
        id: 'mod-1-2',
        name: 'Controle de Vagas',
        description: 'Gestão de disponibilidade de vagas por turma e escola',
        status: 'planning'
      },
      {
        id: 'mod-1-3',
        name: 'Regras Especiais PCD',
        description: 'Controle automático: máximo 3 alunos PCD por turma regular',
        status: 'planning'
      },
      {
        id: 'mod-1-4',
        name: 'Cadastro Completo de Alunos',
        description: 'Ficha cadastral completa com histórico e documentação',
        status: 'planning'
      },
      {
        id: 'mod-1-5',
        name: 'Histórico Escolar Digital',
        description: 'Registro digital do percurso acadêmico do aluno',
        status: 'planning'
      }
    ]
  },
  {
    id: 'mod-2',
    name: 'Gestão Pedagógica',
    description: 'Calendários, frequência, notas, planejamento e acompanhamento acadêmico',
    icon: 'BookOpen',
    phase: 2,
    status: 'planning',
    progress: 0,
    subModules: [
      {
        id: 'mod-2-1',
        name: 'Calendários',
        description: 'Calendário letivo, avaliações, conselhos de classe e recuperação',
        status: 'planning'
      },
      {
        id: 'mod-2-2',
        name: 'Frequência Diária',
        description: 'Registro de presença com integração ao Sistema Presença (Gov. Federal)',
        status: 'planning'
      },
      {
        id: 'mod-2-3',
        name: 'Lançamento de Notas',
        description: 'Sistema de avaliação e registro de conceitos',
        status: 'planning'
      },
      {
        id: 'mod-2-4',
        name: 'Acompanhamento de Aprendizagens',
        description: 'Monitoramento do desenvolvimento acadêmico dos alunos',
        status: 'planning'
      },
      {
        id: 'mod-2-5',
        name: 'Planejamento Pedagógico',
        description: 'Planos de aula, conteúdos programáticos e banco de atividades',
        status: 'planning'
      }
    ]
  },
  {
    id: 'mod-3',
    name: 'Portais de Acesso',
    description: 'Interfaces personalizadas para Professor, Aluno, Diretor, Secretaria, Coordenação e SEMEC',
    icon: 'Layout',
    phase: 2,
    status: 'planning',
    progress: 0,
    subModules: [
      {
        id: 'mod-3-1',
        name: 'Portal do Professor',
        description: 'Dashboard, frequência, notas, ocorrências e planejamento',
        status: 'planning'
      },
      {
        id: 'mod-3-2',
        name: 'Portal do Aluno/Responsável',
        description: 'Consulta de notas, frequência, tarefas e comunicação',
        status: 'planning'
      },
      {
        id: 'mod-3-3',
        name: 'Portal do Diretor',
        description: 'Visão geral, indicadores e gestão da escola',
        status: 'planning'
      },
      {
        id: 'mod-3-4',
        name: 'Portal da Secretaria Escolar',
        description: 'Documentação, declarações, transferências e arquivo digital',
        status: 'planning'
      },
      {
        id: 'mod-3-5',
        name: 'Portal da Coordenação',
        description: 'Acompanhamento pedagógico e gestão de projetos',
        status: 'planning'
      },
      {
        id: 'mod-3-6',
        name: 'Portal da SEMEC',
        description: 'Dashboard municipal e indicadores consolidados',
        status: 'planning'
      }
    ]
  },
  {
    id: 'mod-4',
    name: 'Gestão de Recursos Humanos',
    description: 'Cadastro de servidores, lotação, horários, folha de ponto e licenças',
    icon: 'Users',
    phase: 1,
    status: 'planning',
    progress: 0,
    subModules: [
      {
        id: 'mod-4-1',
        name: 'Cadastro de Servidores',
        description: 'Base completa de dados dos funcionários',
        status: 'planning'
      },
      {
        id: 'mod-4-2',
        name: 'Lotação de Professores',
        description: 'Alocação de docentes por escola e disciplina',
        status: 'planning'
      },
      {
        id: 'mod-4-3',
        name: 'Gestão de Horários',
        description: 'Controle de carga horária e AC\'s por área',
        status: 'planning'
      },
      {
        id: 'mod-4-4',
        name: 'Folha de Ponto Digital',
        description: 'Registro eletrônico de presença de servidores',
        status: 'planning'
      },
      {
        id: 'mod-4-5',
        name: 'Licenças e Afastamentos',
        description: 'Controle de ausências e substituições',
        status: 'planning'
      }
    ]
  },
  {
    id: 'mod-5',
    name: 'Programas Especiais',
    description: 'Busca Ativa Escolar e Educação Especial (AEE)',
    icon: 'Heart',
    phase: 4,
    status: 'planning',
    progress: 0,
    subModules: [
      {
        id: 'mod-5-1',
        name: 'Busca Ativa Escolar',
        description: 'Interface para assistentes sociais, registro e acompanhamento',
        status: 'planning'
      },
      {
        id: 'mod-5-2',
        name: 'Educação Especial',
        description: 'Cadastro de alunos especiais, AEE e salas de recursos',
        status: 'planning'
      },
      {
        id: 'mod-5-3',
        name: 'Acompanhamento Individualizado',
        description: 'Planos personalizados e monitoramento contínuo',
        status: 'planning'
      }
    ]
  },
  {
    id: 'mod-6',
    name: 'Alimentação Escolar',
    description: 'Cardápios, estoque, fornecedores e relatórios PNAE',
    icon: 'Utensils',
    phase: 4,
    status: 'planning',
    progress: 0,
    subModules: [
      {
        id: 'mod-6-1',
        name: 'Gestão de Cardápios',
        description: 'Planejamento nutricional de refeições escolares',
        status: 'planning'
      },
      {
        id: 'mod-6-2',
        name: 'Controle de Estoque',
        description: 'Gestão de insumos e despensa',
        status: 'planning'
      },
      {
        id: 'mod-6-3',
        name: 'Registro de Refeições',
        description: 'Controle de refeições servidas por escola',
        status: 'planning'
      },
      {
        id: 'mod-6-4',
        name: 'Relatórios FNDE/PNAE',
        description: 'Prestação de contas para programas federais',
        status: 'planning'
      }
    ]
  },
  {
    id: 'mod-7',
    name: 'Transporte Escolar',
    description: 'Rotas, veículos, motoristas, manutenção e relatórios PNATE',
    icon: 'Bus',
    phase: 4,
    status: 'planning',
    progress: 0,
    subModules: [
      {
        id: 'mod-7-1',
        name: 'Gestão de Rotas',
        description: 'Planejamento e otimização de itinerários',
        status: 'planning'
      },
      {
        id: 'mod-7-2',
        name: 'Cadastro de Veículos',
        description: 'Frota escolar e documentação',
        status: 'planning'
      },
      {
        id: 'mod-7-3',
        name: 'Controle de Motoristas',
        description: 'Gestão de condutores e habilitações',
        status: 'planning'
      },
      {
        id: 'mod-7-4',
        name: 'Manutenção Preventiva',
        description: 'Agenda de revisões e reparos',
        status: 'planning'
      }
    ]
  },
  {
    id: 'mod-8',
    name: 'Gestão Democrática',
    description: 'Colegiado, Grêmio, Líderes de Turma e assembleias',
    icon: 'Scale',
    phase: 3,
    status: 'planning',
    progress: 0,
    subModules: [
      {
        id: 'mod-8-1',
        name: 'Colegiado Escolar',
        description: 'Gestão de membros, atas e decisões',
        status: 'planning'
      },
      {
        id: 'mod-8-2',
        name: 'Grêmio Estudantil',
        description: 'Eleições, projetos e atividades estudantis',
        status: 'planning'
      },
      {
        id: 'mod-8-3',
        name: 'Líderes de Turma',
        description: 'Cadastro, atribuições e comunicação',
        status: 'planning'
      },
      {
        id: 'mod-8-4',
        name: 'Reuniões e Assembleias',
        description: 'Agendamento e registro de encontros',
        status: 'planning'
      }
    ]
  },
  {
    id: 'mod-9',
    name: 'Comunicação e Eventos',
    description: 'Plantões, reuniões de pais, comunicados e notificações',
    icon: 'Bell',
    phase: 4,
    status: 'planning',
    progress: 0,
    subModules: [
      {
        id: 'mod-9-1',
        name: 'Plantão Pedagógico',
        description: 'Agendamento e registro de atendimentos',
        status: 'planning'
      },
      {
        id: 'mod-9-2',
        name: 'Reuniões de Pais',
        description: 'Convocações, atas e controle de frequência',
        status: 'planning'
      },
      {
        id: 'mod-9-3',
        name: 'Comunicados Gerais',
        description: 'Sistema de avisos para comunidade escolar',
        status: 'planning'
      },
      {
        id: 'mod-9-4',
        name: 'Notificações Push/SMS/Email',
        description: 'Alertas automáticos multicanal',
        status: 'planning'
      }
    ]
  }
]

export const phases: Phase[] = [
  {
    id: 'phase-1',
    name: 'Fase 1 - Fundação',
    monthRange: 'Meses 1-3',
    duration: '3 meses',
    modules: ['mod-1', 'mod-4'],
    status: 'planning',
    description: 'Estabelecimento da base: matrículas, RH básico e portal da secretaria'
  },
  {
    id: 'phase-2',
    name: 'Fase 2 - Núcleo Pedagógico',
    monthRange: 'Meses 4-6',
    duration: '3 meses',
    modules: ['mod-2', 'mod-3'],
    status: 'planning',
    description: 'Implementação do core pedagógico com portais para professores e alunos'
  },
  {
    id: 'phase-3',
    name: 'Fase 3 - Gestão',
    monthRange: 'Meses 7-9',
    duration: '3 meses',
    modules: ['mod-8'],
    status: 'planning',
    description: 'Ferramentas de gestão para direção, coordenação e SEMEC'
  },
  {
    id: 'phase-4',
    name: 'Fase 4 - Expansão',
    monthRange: 'Meses 10-12',
    duration: '3 meses',
    modules: ['mod-5', 'mod-6', 'mod-7', 'mod-9'],
    status: 'planning',
    description: 'Programas especiais, alimentação, transporte e comunicação'
  }
]

export const kpis: KPI[] = [
  {
    id: 'kpi-1',
    name: 'Taxa de Evasão Escolar',
    description: 'Percentual de alunos que abandonam os estudos',
    target: '< 2%',
    current: '4.5%',
    unit: '%',
    category: 'educational'
  },
  {
    id: 'kpi-2',
    name: 'Índice de Frequência',
    description: 'Média de presença dos alunos',
    target: '> 95%',
    current: '92%',
    unit: '%',
    category: 'educational'
  },
  {
    id: 'kpi-3',
    name: 'Desempenho Acadêmico',
    description: 'Média geral de aproveitamento',
    target: '≥ 7.0',
    current: '6.5',
    unit: 'nota',
    category: 'educational'
  },
  {
    id: 'kpi-4',
    name: 'Satisfação dos Usuários',
    description: 'Índice de satisfação com o sistema',
    target: '≥ 4.5',
    current: '-',
    unit: '/5',
    category: 'operational'
  },
  {
    id: 'kpi-5',
    name: 'Tempo de Resposta',
    description: 'Performance média do sistema',
    target: '< 2s',
    current: '-',
    unit: 's',
    category: 'technical'
  },
  {
    id: 'kpi-6',
    name: 'Processos Digitalizados',
    description: 'Percentual de processos automatizados',
    target: '90%',
    current: '0%',
    unit: '%',
    category: 'operational'
  },
  {
    id: 'kpi-7',
    name: 'Economia de Recursos',
    description: 'Redução de custos operacionais',
    target: '30%',
    current: '0%',
    unit: '%',
    category: 'operational'
  },
  {
    id: 'kpi-8',
    name: 'Disponibilidade do Sistema',
    description: 'Uptime do sistema',
    target: '99.5%',
    current: '-',
    unit: '%',
    category: 'technical'
  }
]

export const techStack: TechStack[] = [
  {
    category: 'Frontend',
    items: [
      { name: 'Next.js', description: 'Framework React para aplicações web', icon: 'Code' },
      { name: 'TypeScript', description: 'JavaScript com tipagem estática', icon: 'FileCode' },
      { name: 'Tailwind CSS', description: 'Framework CSS utilitário', icon: 'Palette' }
    ]
  },
  {
    category: 'Backend',
    items: [
      { name: 'Node.js', description: 'Runtime JavaScript server-side', icon: 'Server' },
      { name: 'Fastify', description: 'Framework web de alta performance', icon: 'Zap' },
      { name: 'PostgreSQL', description: 'Banco de dados relacional', icon: 'Database' },
      { name: 'Prisma', description: 'ORM TypeScript-first', icon: 'Box' }
    ]
  },
  {
    category: 'Segurança',
    items: [
      { name: 'JWT', description: 'Autenticação baseada em tokens', icon: 'Key' },
      { name: 'LGPD Compliance', description: 'Conformidade com proteção de dados', icon: 'Shield' },
      { name: 'Backup Automático', description: 'Redundância e recuperação', icon: 'HardDrive' }
    ]
  },
  {
    category: 'Qualidade',
    items: [
      { name: 'Zod', description: 'Validação de esquemas TypeScript', icon: 'CheckCircle' },
      { name: 'Testes Automatizados', description: 'Jest + Testing Library', icon: 'TestTube' },
      { name: 'Swagger', description: 'Documentação automática de API', icon: 'FileText' }
    ]
  },
  {
    category: 'Infraestrutura',
    items: [
      { name: 'Cloud Hosting', description: 'AWS/Azure/Google Cloud', icon: 'Cloud' },
      { name: 'Armazenamento de Arquivos', description: 'S3-compatible storage', icon: 'FolderOpen' },
      { name: 'Logs de Auditoria', description: 'Rastreamento completo de ações', icon: 'FileSearch' }
    ]
  }
]
