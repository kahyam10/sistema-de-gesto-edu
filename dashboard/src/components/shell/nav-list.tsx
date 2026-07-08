'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icons';
import type { NavSection } from './nav';

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface NavListProps {
  sections: NavSection[];
  collapsed?: boolean;
  onNavigate?: () => void;
}

/** Lista de navegação da sidebar — compartilhada entre desktop e drawer mobile. */
export function NavList({ sections, collapsed = false, onNavigate }: NavListProps) {
  const pathname = usePathname();

  return (
    <>
      {sections.map((section, sIdx) => (
        <div key={section.label ?? sIdx} className={sIdx > 0 ? 'mt-3' : ''}>
          {!collapsed && section.label && (
            <div className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[1px] text-brand-sidebarMuted">
              {section.label}
            </div>
          )}
          {section.items.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
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
    </>
  );
}
