import type { IconName } from '@/components/ui/icons';

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

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    label: 'Operação',
    items: [
      { href: '/', label: 'Dashboard', icon: 'dashboard', roles: 'all' },
      { href: '/pedagogico', label: 'Pedagógico', icon: 'book', roles: 'all' },
      { href: '/cadastros/matriculas', label: 'Matrículas', icon: 'userPlus', roles: 'all' },
      { href: '/cadastros/escolas', label: 'Escolas', icon: 'building', roles: 'all' },
      { href: '/cadastros/profissionais', label: 'Profissionais', icon: 'users', roles: 'all' },
      { href: '/cadastros/calendario', label: 'Calendário Letivo', icon: 'calendarDays', roles: 'all' },
      { href: '/programas', label: 'Programas Especiais', icon: 'clipboard', roles: 'all' },
      { href: '/comunicacao', label: 'Comunicação', icon: 'speaker', roles: 'all' },
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
