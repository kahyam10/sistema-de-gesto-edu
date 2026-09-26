// Tabelas de autorização do guard global (importadas pelo server.ts).
// Extraídas do server.ts para função pura testável — mesma mecânica:
// PRIMEIRA regra que casar vence. A checagem de propriedade do DIRETOR
// (consulta o banco) permanece inline no hook do server.

// Rotas sem access token: login e as rotas de sessão, que se autenticam pelo
// cookie de refresh (path restrito a /api/auth) — logout precisa funcionar
// mesmo com o access token já expirado.
export const PUBLIC_API = new Set([
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
  // App mobile (tokens no corpo, ver lib/sessao.ts)
  "/api/auth/mobile/login",
  "/api/auth/mobile/refresh",
  "/api/auth/mobile/logout",
]);
export const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const GESTAO = ["ADMIN", "SEMEC"];
export const OPERACAO = ["ADMIN", "SEMEC", "DIRETOR", "COORDENADOR", "SECRETARIA"];
// Professores lançam frequência, notas e consultam/gerem sua grade
export const PEDAGOGICO = [...OPERACAO, "PROFESSOR"];
// Ações pessoais (recibos de leitura) valem para qualquer autenticado
export const TODOS = [...PEDAGOGICO, "USER", "RESPONSAVEL"];

export interface RegraEscrita {
  pattern: RegExp;
  methods?: string[];
  roles: string[];
}

export const REGRAS_ESCRITA: RegraEscrita[] = [
  // Vínculos operacionais: aluno/professor em turma, escolas/formações de profissional
  {
    pattern:
      /^\/api\/(turmas\/[^/]+\/(alunos|professores)|profissionais\/[^/]+\/(escolas|formacoes))(\/|$)/,
    roles: OPERACAO,
  },
  // Módulo 3 — acessos de responsáveis ao portal (secretaria cria e revoga, incl. DELETE)
  {
    pattern: /^\/api\/matriculas\/[^/]+\/acessos(\/|$)/,
    roles: OPERACAO,
  },
  // Questionários do censo
  {
    pattern: /^\/api\/(escolas|turmas|profissionais)\/[^/]+\/censo$/,
    roles: OPERACAO,
  },
  // Expurgo LGPD de documentos da matrícula: só gestão
  {
    pattern: /^\/api\/matriculas\/[^/]+\/documentos$/,
    methods: ["DELETE"],
    roles: GESTAO,
  },
  // Documentos da matrícula: upload e exclusão individual pela equipe operacional
  {
    pattern: /^\/api\/matriculas\/[^/]+\/documentos(\/|$)/,
    roles: OPERACAO,
  },
  // Salas (infraestrutura gerida pela própria escola)
  {
    pattern: /^\/api\/(salas|escolas\/[^/]+\/salas)(\/|$)/,
    roles: OPERACAO,
  },
  // Pedagógico: professores lançam frequência/notas/avaliações e grade
  {
    pattern: /^\/api\/(frequencia|notas|avaliacoes|grade-horaria)(\/|$)/,
    roles: PEDAGOGICO,
  },
  // Programas especiais: busca ativa, AEE e acompanhamento (equipe + professores AEE)
  {
    pattern: /^\/api\/(busca-ativa|aee|acompanhamento)(\/|$)/,
    roles: PEDAGOGICO,
  },
  // Recibos de leitura/confirmação: qualquer usuário autenticado
  {
    pattern:
      /^\/api\/(notificacoes\/([^/]+\/marcar-lida|usuario\/[^/]+\/marcar-todas-lidas)|comunicados\/[^/]+\/(confirmar|marcar-lido))$/,
    roles: TODOS,
  },
  // Comunicação e eventos: escrita pela equipe pedagógica
  {
    pattern:
      /^\/api\/(comunicados|notificacoes|plantoes-pedagogicos|reunioes-pais)(\/|$)/,
    roles: PEDAGOGICO,
  },
  // Módulo 6 — Alimentação escolar: só GESTAO apaga movimentações (trilha de auditoria)
  {
    pattern: /^\/api\/estoque\/movimentacoes(\/|$)/,
    methods: ["DELETE"],
    roles: GESTAO,
  },
  // Módulo 6 — Alimentação escolar: escrita pela equipe operacional
  {
    pattern: /^\/api\/(cardapios|estoque|refeicoes)(\/|$)/,
    roles: OPERACAO,
  },
  // Módulo 7 — Transporte escolar: escrita pela equipe operacional
  {
    pattern: /^\/api\/(veiculos|motoristas|rotas-transporte|manutencoes)(\/|$)/,
    roles: OPERACAO,
  },
  // Módulo 8 — Gestão democrática: escrita pela equipe pedagógica
  {
    pattern: /^\/api\/(colegiados|gremios|lideres-turma|reunioes-democraticas)(\/|$)/,
    roles: PEDAGOGICO,
  },
  // Estrutura pedagógica (disciplinas e regras de avaliação) = gestão
  {
    pattern: /^\/api\/(disciplinas|configuracao-avaliacao)(\/|$)/,
    roles: GESTAO,
  },
  // Estrutura da rede e planejamento do projeto
  {
    pattern:
      /^\/api\/(tipos-educacao|etapas|niveis-ensino|series|modules|phases|calendario)(\/|$)/,
    roles: GESTAO,
  },
  // Criação/exclusão de escolas
  { pattern: /^\/api\/escolas(\/|$)/, methods: ["POST", "DELETE"], roles: GESTAO },
  // Exclusão de qualquer outro recurso
  { pattern: /^\/api\//, methods: ["DELETE"], roles: GESTAO },
  // Demais escritas (matrículas, turmas, profissionais, update de escola)
  { pattern: /^\/api\//, roles: OPERACAO },
];

// Leituras restritas: dados sensíveis (RH, documentos de menores, exportadores
// com CPF/NIS, resumos gerenciais) — não PROFESSOR/USER, salvo indicação.
export const LEITURA_RESTRITA: Array<{ pattern: RegExp; roles: string[] }> = [
  { pattern: /^\/api\/(licencas|pontos)(\/|$)/, roles: OPERACAO },
  // Módulo 4 — quadro de lotação (jornada, regime e carga de cada profissional)
  { pattern: /^\/api\/lotacao(\/|$)/, roles: OPERACAO },
  // Documentos pessoais de menores (LGPD) — PROFESSOR/USER não leem
  { pattern: /^\/api\/matriculas\/[^/]+\/documentos(\/|$)/, roles: OPERACAO },
  // Módulo 3 — emails/vínculos de responsáveis e resumos gerenciais
  { pattern: /^\/api\/matriculas\/[^/]+\/acessos(\/|$)/, roles: OPERACAO },
  { pattern: /^\/api\/portal\/(diretor|coordenacao)(\/|$)/, roles: OPERACAO },
  { pattern: /^\/api\/portal\/professor(\/|$)/, roles: PEDAGOGICO },
  { pattern: /^\/api\/portal\/semec(\/|$)/, roles: GESTAO },
  // Exportadores oficiais (Educacenso/Sistema Presença): CPF/NIS — equipe operacional
  { pattern: /^\/api\/exportacao(\/|$)/, roles: OPERACAO },
  // Notificações são pessoais: a lista geral e os relatórios só para a equipe
  // que as envia; cada usuário lê as suas em /usuario/:id (dono checado na rota)
  { pattern: /^\/api\/notificacoes(\/relatorios(\/|$)|\/?$)/, roles: OPERACAO },
  // Trilha de auditoria (quem acessou dados pessoais) — só gestão da rede
  { pattern: /^\/api\/auditoria(\/|$)/, roles: GESTAO },
];

// Módulo 3 — RESPONSAVEL lê APENAS o próprio portal (allowlist; tudo fora dela = 403)
export const LEITURA_RESPONSAVEL: RegExp[] = [
  /^\/api\/auth\/me$/,
  /^\/api\/portal\/meu(\/|$)/,
  /^\/api\/comunicados(\/|$)/,
  /^\/api\/notificacoes\/usuario\/[^/]+/,
  /^\/api\/calendario(\/|$)/,
];

/**
 * Decisão pura de autorização (sem a checagem de propriedade do DIRETOR,
 * que consulta o banco e permanece no hook do server).
 */
export function autorizar(
  url: string,
  method: string,
  user: { id: string; role: string }
): "OK" | "NEGADO" {
  if (!WRITE_METHODS.has(method)) {
    if (user.role === "RESPONSAVEL") {
      const permitido = LEITURA_RESPONSAVEL.some((p) => p.test(url));
      if (!permitido) return "NEGADO";
      // Notificações são pessoais: só as do próprio usuário
      const proprio = url.match(/^\/api\/notificacoes\/usuario\/([^/]+)/);
      if (proprio && proprio[1] !== user.id) return "NEGADO";
      return "OK";
    }
    const restrita = LEITURA_RESTRITA.find((r) => r.pattern.test(url));
    if (restrita && !restrita.roles.includes(user.role)) return "NEGADO";
    return "OK";
  }
  const regra = REGRAS_ESCRITA.find(
    (r) => r.pattern.test(url) && (r.methods === undefined || r.methods.includes(method))
  );
  if (regra && !regra.roles.includes(user.role)) return "NEGADO";
  return "OK";
}
