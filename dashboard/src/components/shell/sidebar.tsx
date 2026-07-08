'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icons';
import { BrandMark } from '@/components/brand/brand-mark';
import type { NavSection } from './nav';

interface SidebarProps {
  sections: NavSection[];
}

const STORAGE_KEY = 'sge.sidebar.collapsed';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Sidebar azul-marinho fixa — a superfície escura que ancora a identidade. */
export function Sidebar({ sections }: SidebarProps) {
  const pathname = usePathname();
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
        'flex h-screen sticky top-0 shrink-0 flex-col bg-brand-deep text-brand-sidebarText transition-[width] duration-180',
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
        {sections.map((section, sIdx) => (
          <div key={section.label ?? sIdx} className={sIdx > 0 ? 'mt-3' : ''}>
            {!collapsed && section.label && (
              <div className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[1px] text-brand-sidebarMuted">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group relative mb-0.5 flex items-center gap-2.5 rounded-md text-[13px] font-medium transition-colors duration-180',
                    collapsed ? 'justify-center px-0 py-2' : 'px-2.5 py-2',
                    active
                      ? 'bg-brand-sel text-white font-semibold'
                      : 'text-brand-sidebarText hover:bg-brand-hover hover:text-white',
                  )}
                  aria-current={active ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    name={item.icon}
                    size={17}
                    strokeWidth={active ? 2 : 1.7}
                    className="shrink-0"
                  />
                  {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-px text-[10px] font-bold text-white',
                        item.badge === '!' ? 'bg-danger' : 'bg-white/15',
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                  {collapsed && item.badge && (
                    <span
                      className={cn(
                        'absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full',
                        item.badge === '!' ? 'bg-danger' : 'bg-accent',
                      )}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
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
