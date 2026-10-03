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
// Quem orienta o trabalho pedagógico da escola (sem a secretaria)
export const COORDENACAO_PEDAGOGICA = ["ADMIN", "SEMEC", "DIRETOR", "COORDENADOR"];
// Exportações oficiais (Educacenso/Sistema Presença), licenças e ponto:
// decisão do usuário (out/2026) — só gestão da rede e coordenação. DIRETOR e
// SECRETARIA não leem nem escrevem; PROFESSOR nunca teve acesso. O coordenador
// fica restrito à própria escola pelo escopo da camada de dados (lib/escopo.ts:
// Licenca/Ponto via profissional; exportadores consultam escola/matrícula com
// o prisma com escopo). Espelhado no dashboard em hooks/use-papel.ts (usePodeRH).
export const RH_EXPORTACAO = ["ADMIN", "SEMEC", "COORDENADOR"];
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
  // Módulo 2 — planejamento: conteúdo programático e revisão de planos = coordenação/direção
  {
    pattern: /^\/api\/planejamento\/(conteudos(\/|$)|planos\/[^/]+\/revisar$)/,
    roles: COORDENACAO_PEDAGOGICA,
  },
  // Módulo 2 — planos de aula e banco de atividades (inclui DELETE: autor, checado no service)
  {
    pattern: /^\/api\/planejamento(\/|$)/,
    roles: [...COORDENACAO_PEDAGOGICA, "PROFESSOR"],
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
  // Exclusão de qualquer outro recurso (inclui licenças e pontos: só gestão)
  { pattern: /^\/api\//, methods: ["DELETE"], roles: GESTAO },
  // Licenças (criar, editar, aprovar, cancelar), ponto e exportadores: depois da
  // regra de DELETE (excluir continua só da gestão) e antes da regra genérica
  { pattern: /^\/api\/(licencas|pontos|exportacao)(\/|$)/, roles: RH_EXPORTACAO },
  // Demais escritas (matrículas, turmas, profissionais, update de escola)
  { pattern: /^\/api\//, roles: OPERACAO },
];

// Leituras restritas: dados sensíveis (RH, documentos de menores, exportadores
// com CPF/NIS, resumos gerenciais) — não PROFESSOR/USER, salvo indicação.
export const LEITURA_RESTRITA: Array<{ pattern: RegExp; roles: string[] }> = [
  { pattern: /^\/api\/(licencas|pontos)(\/|$)/, roles: RH_EXPORTACAO },
  // Módulo 4 — quadro de lotação (jornada, regime e carga de cada profissional)
  { pattern: /^\/api\/lotacao(\/|$)/, roles: OPERACAO },
  // Módulo 2 — acompanhamento de aprendizagens (notas e frequência da turma)
  { pattern: /^\/api\/aprendizagem(\/|$)/, roles: PEDAGOGICO },
  // Módulo 2 — planejamento pedagógico (planos de aula de professores)
  { pattern: /^\/api\/planejamento(\/|$)/, roles: [...COORDENACAO_PEDAGOGICA, "PROFESSOR"] },
  // Documentos pessoais de menores (LGPD) — PROFESSOR/USER não leem
  { pattern: /^\/api\/matriculas\/[^/]+\/documentos(\/|$)/, roles: OPERACAO },
  // Módulo 3 — emails/vínculos de responsáveis e resumos gerenciais
  { pattern: /^\/api\/matriculas\/[^/]+\/acessos(\/|$)/, roles: OPERACAO },
  { pattern: /^\/api\/portal\/(diretor|coordenacao)(\/|$)/, roles: OPERACAO },
  { pattern: /^\/api\/portal\/professor(\/|$)/, roles: PEDAGOGICO },
  { pattern: /^\/api\/portal\/semec(\/|$)/, roles: GESTAO },
  // Exportadores oficiais (Educacenso/Sistema Presença): CPF/NIS — gestão e coordenação
  { pattern: /^\/api\/exportacao(\/|$)/, roles: RH_EXPORTACAO },
  // Notificações são pessoais: a lista geral e os relatórios só para a equipe
  // que as envia; cada usuário lê as suas em /usuario/:id (dono checado na rota)
  { pattern: /^\/api\/notificacoes(\/relatorios(\/|$)|\/?$)/, roles: OPERACAO },
  // Trilha de auditoria (quem acessou dados pessoais) — só gestão da rede
  { pattern: /^\/api\/auditoria(\/|$)/, roles: GESTAO },
];

// Módulo 3 — RESPONSAVEL, USER e papéis desconhecidos leem APENAS o próprio portal (allowlist; tudo fora dela = 403)
export const LEITURA_RESPONSAVEL: RegExp[] = [
  /^\/api\/auth\/me$/,
  /^\/api\/portal\/meu(\/|$)/,
  // Comunicados (lista/detalhe filtrados no service); estatísticas são da equipe
  /^\/api\/comunicados(\/(?!relatorios(\/|$))|$)/,
  /^\/api\/notificacoes\/usuario\/[^/]+/,
  /^\/api\/calendario(\/|$)/,
];

// Leituras liberadas à equipe (ADMIN, SEMEC, DIRETOR, COORDENADOR, SECRETARIA,
// PROFESSOR) — ALLOWLIST explícita, rota a rota (padrão do roteador, ":x" =
// um segmento). GET que não está aqui nem na LEITURA_RESTRITA é NEGADO aos
// papéis pedagógicos: rota nova nasce fechada até ser classificada, e o teste
// tests/fb-rotas-classificadas.test.ts quebra a CI enquanto isso.
export const LEITURA_PEDAGOGICA: string[] = [
  "/api/acompanhamento", "/api/acompanhamento/:id", "/api/acompanhamento/matricula/:matriculaId",
  "/api/acompanhamento/relatorios/estatisticas",
  "/api/aee/atendimentos/pei/:peiId", "/api/aee/atendimentos/sala/:salaRecursosId", "/api/aee/pei",
  "/api/aee/pei/:id", "/api/aee/pei/matricula/:matriculaId", "/api/aee/relatorios/estatisticas",
  "/api/aee/salas-recursos", "/api/aee/salas-recursos/:id",
  "/api/atividades-complementares", "/api/atividades-complementares/:id",
  "/api/auth/me",
  "/api/avaliacoes", "/api/avaliacoes/:id",
  "/api/busca-ativa", "/api/busca-ativa/:buscaAtivaId/encaminhamentos",
  "/api/busca-ativa/:buscaAtivaId/visitas", "/api/busca-ativa/:id",
  "/api/busca-ativa/relatorios/estatisticas",
  "/api/calendario/anos-letivos", "/api/calendario/anos-letivos/:anoLetivoId/estatisticas",
  "/api/calendario/anos-letivos/:anoLetivoId/eventos",
  "/api/calendario/anos-letivos/:anoLetivoId/eventos/data/:data",
  "/api/calendario/anos-letivos/:anoLetivoId/eventos/mes/:ano/:mes", "/api/calendario/anos-letivos/:id",
  "/api/calendario/anos-letivos/ativo", "/api/calendario/eventos/:id",
  "/api/cardapios", "/api/cardapios/:id",
  "/api/colegiados", "/api/colegiados/:id",
  "/api/comunicados", "/api/comunicados/:id", "/api/comunicados/relatorios/estatisticas",
  "/api/comunicados/usuario/:userId",
  "/api/configuracao-avaliacao", "/api/configuracao-avaliacao/:id",
  "/api/disciplinas", "/api/disciplinas/:id", "/api/disciplinas/etapa/:etapaId",
  "/api/escolas", "/api/escolas/:escolaId/salas", "/api/escolas/:escolaId/salas/estatisticas",
  "/api/escolas/:id", "/api/escolas/:id/estatisticas",
  "/api/estoque/alertas", "/api/estoque/itens", "/api/estoque/itens/:id", "/api/estoque/movimentacoes",
  "/api/etapas", "/api/etapas/:id",
  "/api/frequencia", "/api/frequencia/:id", "/api/frequencia/estatisticas/:matriculaId/:turmaId",
  "/api/frequencia/turma/:turmaId/aulas/:data",
  "/api/frequencia/turma/:turmaId/baixa-frequencia", "/api/frequencia/turma/:turmaId/data/:data",
  "/api/frequencia/turma/:turmaId/resumo",
  "/api/grade-horaria", "/api/grade-horaria/:id", "/api/grade-horaria/relatorios/carga",
  "/api/grade-horaria/relatorios/escola", "/api/grade-horaria/relatorios/turma",
  "/api/gremios", "/api/gremios/:id",
  "/api/lideres-turma", "/api/lideres-turma/:id",
  "/api/manutencoes", "/api/manutencoes/:id", "/api/manutencoes/custos-por-veiculo",
  "/api/matriculas", "/api/matriculas/:id", "/api/matriculas/:id/transferencias",
  "/api/matriculas/estatisticas", "/api/matriculas/numero/:numero", "/api/matriculas/sem-turma",
  "/api/modules", "/api/modules/:id",
  "/api/motoristas", "/api/motoristas/:id", "/api/motoristas/alertas-cnh",
  "/api/niveis-ensino", "/api/niveis-ensino/:id", "/api/niveis-ensino/etapa/:etapaId",
  "/api/notas", "/api/notas/:id", "/api/notas/boletim/:matriculaId", "/api/notas/boletim-turma/:turmaId",
  "/api/notas/media/:matriculaId/:turmaId/:disciplinaId",
  "/api/notas/situacao/:matriculaId/:turmaId/:disciplinaId",
  "/api/notificacoes/:id", "/api/notificacoes/usuario/:userId",
  "/api/notificacoes/usuario/:userId/count-nao-lidas",
  "/api/phases", "/api/phases/:id",
  "/api/plantoes-pedagogicos", "/api/plantoes-pedagogicos/:id",
  "/api/plantoes-pedagogicos/escola/:escolaId/periodo", "/api/plantoes-pedagogicos/relatorios/estatisticas",
  "/api/portal/meu/agenda", "/api/portal/meu/alunos", "/api/portal/meu/alunos/:matriculaId/boletim",
  "/api/portal/meu/alunos/:matriculaId/frequencia", "/api/portal/meu/cardapio",
  "/api/portal/meu/comunicados", "/api/portal/meu/dados", "/api/portal/meu/escolas",
  "/api/profissionais", "/api/profissionais/:id", "/api/profissionais/:id/formacoes",
  "/api/profissionais/escola/:escolaId",
  "/api/refeicoes", "/api/refeicoes/:id", "/api/refeicoes/relatorio-pnae",
  "/api/reunioes-democraticas", "/api/reunioes-democraticas/:id",
  "/api/reunioes-pais", "/api/reunioes-pais/:id", "/api/reunioes-pais/:reuniaoId/presencas",
  "/api/reunioes-pais/relatorios/estatisticas",
  "/api/rotas-transporte", "/api/rotas-transporte/:id",
  "/api/salas/:id",
  "/api/series", "/api/series/:id", "/api/series/nivel/:nivelId",
  "/api/tipos-educacao", "/api/tipos-educacao/:id",
  "/api/turmas", "/api/turmas/:id", "/api/turmas/:id/estatisticas", "/api/turmas/escola/:escolaId",
  "/api/veiculos", "/api/veiculos/:id", "/api/veiculos/alertas-vencimento",
];

const paraRegex = (padrao: string) =>
  new RegExp(
    "^" +
      padrao
        .split("/")
        .map((seg) => (seg === "*" ? ".*" : seg.startsWith(":") ? "[^/]+" : seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
        .join("/") +
      "/?$"
  );
const LEITURA_PEDAGOGICA_RE = LEITURA_PEDAGOGICA.map(paraRegex);

/**
 * Classe de uma leitura (GET) pelo caminho: "publica", "restrita" (com os
 * papéis), "liberada" (equipe pedagógica) ou null = não classificada (negada).
 */
export function classificarLeitura(
  url: string
): { classe: "publica" } | { classe: "restrita"; roles: string[] } | { classe: "liberada" } | null {
  if (PUBLIC_API.has(url)) return { classe: "publica" };
  const restrita = LEITURA_RESTRITA.find((r) => r.pattern.test(url));
  if (restrita) return { classe: "restrita", roles: restrita.roles };
  if (LEITURA_PEDAGOGICA_RE.some((r) => r.test(url))) return { classe: "liberada" };
  return null;
}

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
    // Negar por padrão: fora da equipe (RESPONSAVEL, USER "sem função" — o papel
    // padrão de usuário novo — ou qualquer papel desconhecido) só lê o próprio
    // portal. Antes, USER lia matrículas, notas e frequência da rede inteira.
    if (!PEDAGOGICO.includes(user.role)) {
      const permitido = LEITURA_RESPONSAVEL.some((p) => p.test(url));
      if (!permitido) return "NEGADO";
      // Notificações são pessoais: só as do próprio usuário
      const proprio = url.match(/^\/api\/notificacoes\/usuario\/([^/]+)/);
      if (proprio && proprio[1] !== user.id) return "NEGADO";
      return "OK";
    }
    // Equipe: leitura negada por padrão — só o que está classificado
    const classe = classificarLeitura(url);
    if (!classe) return "NEGADO";
    if (classe.classe === "restrita" && !classe.roles.includes(user.role)) return "NEGADO";
    return "OK";
  }
  const regra = REGRAS_ESCRITA.find(
    (r) => r.pattern.test(url) && (r.methods === undefined || r.methods.includes(method))
  );
  if (regra && !regra.roles.includes(user.role)) return "NEGADO";
  return "OK";
}
