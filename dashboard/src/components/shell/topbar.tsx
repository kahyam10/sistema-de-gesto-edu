'use client';

import { UserMenu } from './user-menu';

/**
 * Topbar — barra fixa de 56px, branca com borda hairline inferior.
 * O título da página fica no PageWrap de cada rota, não aqui.
 */
export function Topbar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-b border-hairline bg-surface-card px-5">
      <div className="flex-1" />
      <UserMenu />
    </header>
  );
}
