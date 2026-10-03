import type { IconName } from '@/components/ui/icons';
import { PAPEIS_RH } from '@/hooks/use-papel';

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  badge?: string;
  /** 'all' = visível a qualquer usuário autenticado; senão allowlist de papéis. */
  roles: 'all' | readonly string[];
}

export interface NavSection {
  /** Eyebrow da seção na sidebar expandida (omitir na primeira seção). */
  label?: string;
  items: readonly NavItem[];
}

const GESTAO = ['ADMIN', 'SEMEC'] as const;
const OPERACAO = ['ADMIN', 'SEMEC', 'DIRETOR', 'COORDENADOR', 'SECRETARIA'] as const;
// Equipe interna da rede — os papéis externos (RESPONSAVEL e USER sem função)
// enxergam apenas o próprio portal.
const EQUIPE = [...OPERACAO, 'PROFESSOR'] as const;
// Planejamento pedagógico: quem orienta (sem a secretaria) e quem dá aula
const COORDENACAO_E_PROFESSOR = ['ADMIN', 'SEMEC', 'DIRETOR', 'COORDENADOR', 'PROFESSOR'] as const;

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    label: 'Operação',
    items: [
      { href: '/portal', label: 'Meu Portal', icon: 'home', roles: 'all' },
      { href: '/', label: 'Dashboard', icon: 'dashboard', roles: EQUIPE },
      { href: '/pedagogico', label: 'Pedagógico', icon: 'book', roles: EQUIPE },
      { href: '/planejamento', label: 'Planejamento', icon: 'notebook', roles: COORDENACAO_E_PROFESSOR },
      { href: '/cadastros/matriculas', label: 'Matrículas', icon: 'userPlus', roles: EQUIPE },
      { href: '/cadastros/escolas', label: 'Escolas', icon: 'building', roles: EQUIPE },
      { href: '/cadastros/profissionais', label: 'Profissionais', icon: 'users', roles: EQUIPE },
      // RH segue com a equipe operacional por causa do quadro de lotação e das
      // ACs; as abas de ponto e licenças só aparecem para PAPEIS_RH (rh/page.tsx)
      { href: '/rh', label: 'RH', icon: 'clock', roles: OPERACAO },
      { href: '/cadastros/calendario', label: 'Calendário Letivo', icon: 'calendarDays', roles: EQUIPE },
      { href: '/alimentacao', label: 'Alimentação', icon: 'utensils', roles: EQUIPE },
      { href: '/transporte', label: 'Transporte', icon: 'bus', roles: EQUIPE },
      { href: '/gestao-democratica', label: 'Gestão Democrática', icon: 'scale', roles: EQUIPE },
      { href: '/programas', label: 'Programas Especiais', icon: 'clipboard', roles: EQUIPE },
      { href: '/comunicacao', label: 'Comunicação', icon: 'speaker', roles: EQUIPE },
      // Exportações oficiais: ADMIN, SEMEC e COORDENADOR (espelha RH_EXPORTACAO do backend)
      { href: '/exportacoes', label: 'Exportações', icon: 'fileExport', roles: PAPEIS_RH },
    ],
  },
  {
    label: 'Estrutura',
    items: [
      { href: '/cadastros/hierarquia', label: 'Hierarquia de Ensino', icon: 'hierarchy', roles: GESTAO },
    ],
  },
  {
    label: 'Projeto',
    items: [
      { href: '/modulos', label: 'Módulos', icon: 'layers', roles: GESTAO },
      { href: '/cronograma', label: 'Cronograma', icon: 'calendar', roles: GESTAO },
      { href: '/desenvolvimento', label: 'Desenvolvimento', icon: 'code', roles: GESTAO },
      { href: '/kpis', label: 'KPIs', icon: 'chart', roles: GESTAO },
      { href: '/tech-stack', label: 'Tech Stack', icon: 'cpu', roles: GESTAO },
    ],
  },
] as const;

/** Filtra as seções pelo papel do usuário, removendo seções vazias. */
export function filterNavForRole(role: string | undefined): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => item.roles === 'all' || (role !== undefined && item.roles.includes(role)),
    ),
  })).filter((s) => s.items.length > 0);
}

/**
 * Item do menu que cobre a rota (prefixo mais longo). A raiz "/" não entra:
 * o Dashboard trata sozinho quem não é da equipe (redireciona ao portal).
 */
export function itemDaRota(pathname: string): NavItem | undefined {
  let melhor: NavItem | undefined;
  for (const item of NAV_SECTIONS.flatMap((s) => s.items)) {
    if (item.href === '/') continue;
    const cobre = pathname === item.href || pathname.startsWith(item.href + '/');
    if (cobre && (!melhor || item.href.length > melhor.href.length)) melhor = item;
  }
  return melhor;
}

/**
 * O papel pode abrir esta área? Mesmas regras do menu. Só evita que a tela
 * mostre uma página vazia/enganosa: quem bloqueia de fato é a API (403).
 * Rotas fora do menu (ex.: /questionario-turma/:id) ficam a cargo da API.
 */
export function podeAcessarRota(pathname: string, role: string | undefined): boolean {
  const item = itemDaRota(pathname);
  if (!item) return true;
  return item.roles === 'all' || (role !== undefined && item.roles.includes(role));
}
