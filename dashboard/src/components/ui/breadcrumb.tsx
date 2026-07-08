import Link from 'next/link';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/** Breadcrumb discreto com separador ponto médio (·). */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-[11.5px] text-ink-muted', className)}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <Fragment key={`${item.label}-${i}`}>
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-ink transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-ink-2 font-medium' : ''}>{item.label}</span>
            )}
            {!isLast && <span className="text-ink-soft">·</span>}
          </Fragment>
        );
      })}
    </nav>
  );
}
