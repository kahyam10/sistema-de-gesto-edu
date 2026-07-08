'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icons';
import { BrandMark } from '@/components/brand/brand-mark';
import { NavList } from './nav-list';
import type { NavSection } from './nav';

interface SidebarProps {
  sections: NavSection[];
}

const STORAGE_KEY = 'sge.sidebar.collapsed';

/**
 * Sidebar azul-marinho fixa (desktop, ≥lg) — a superfície escura que
 * ancora a identidade. Abaixo de lg o shell usa o drawer (MobileNav).
 */
export function Sidebar({ sections }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === '1') setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  }

  return (
    <aside
      data-collapsed={collapsed || undefined}
      className={cn(
        'hidden lg:flex h-screen sticky top-0 shrink-0 flex-col bg-brand-deep text-brand-sidebarText transition-[width] duration-180',
        collapsed ? 'w-16' : 'w-[232px]',
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex items-center gap-2.5 border-b border-white/10',
          collapsed ? 'justify-center py-3.5' : 'justify-between px-4 py-3.5',
        )}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark
            size={28}
            variant="onDark"
            withWordmark={!collapsed}
            wordmarkTone="light"
            eyebrow="Gestão Educacional"
            display="Ibirapitanga - BA"
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="scrollbar-dark flex-1 overflow-y-auto px-2 py-2.5">
        <NavList sections={sections} collapsed={collapsed} />
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-2.5">
        <button
          type="button"
          onClick={toggle}
          className="flex w-full items-center justify-center gap-2 rounded-md p-1.5 text-xs text-brand-sidebarMuted hover:text-white hover:bg-white/5 transition-colors duration-180"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={14} />
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </aside>
  );
}
