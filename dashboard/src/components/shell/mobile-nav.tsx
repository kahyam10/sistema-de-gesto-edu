'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Icon } from '@/components/ui/icons';
import { BrandMark } from '@/components/brand/brand-mark';
import { NavList } from './nav-list';
import type { NavSection } from './nav';

interface MobileNavProps {
  sections: NavSection[];
}

/**
 * Navegação mobile (<lg): botão hambúrguer na topbar que abre um drawer
 * lateral com o mesmo conteúdo da sidebar (extensão ao design base, que
 * é desktop-first — ver DESIGN_BASE §4.3).
 */
export function MobileNav({ sections }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-md border border-hairline bg-surface-card text-ink-2 transition-colors duration-180 hover:bg-surface-alt lg:hidden"
          aria-label="Abrir menu"
        >
          <Icon name="list" size={17} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[264px] border-none bg-brand-deep p-0 text-brand-sidebarText [&>button]:text-brand-sidebarText"
      >
        <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
        <div className="flex h-full flex-col">
          <div className="flex items-center border-b border-white/10 px-4 py-3.5">
            <Link href="/" onClick={() => setOpen(false)}>
              <BrandMark
                size={28}
                variant="onDark"
                withWordmark
                wordmarkTone="light"
                eyebrow="Gestão Educacional"
                display="Ibirapitanga - BA"
              />
            </Link>
          </div>
          <nav className="scrollbar-dark flex-1 overflow-y-auto px-2 py-2.5">
            <NavList sections={sections} onNavigate={() => setOpen(false)} />
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
