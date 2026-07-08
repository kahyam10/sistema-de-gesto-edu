'use client';

import { UserMenu } from './user-menu';
import { MobileNav } from './mobile-nav';
import type { NavSection } from './nav';

interface TopbarProps {
  sections: NavSection[];
}

/**
 * Topbar — barra fixa de 56px, branca com borda hairline inferior.
 * O título da página fica no PageWrap de cada rota, não aqui.
 * Abaixo de lg exibe o hambúrguer do drawer mobile.
 */
export function Topbar({ sections }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-b border-hairline bg-surface-card px-4 sm:px-5">
      <MobileNav sections={sections} />
      <div className="flex-1" />
      <UserMenu />
    </header>
  );
}
