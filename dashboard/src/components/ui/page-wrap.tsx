import { cn } from '@/lib/utils';
import { Breadcrumb, type BreadcrumbItem } from './breadcrumb';
import * as React from 'react';

export interface PageWrapProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  breadcrumb?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * PageWrap — header (breadcrumb + título display + ações) + conteúdo.
 * Toda página interna é envolvida por este componente. Sem max-width.
 */
export function PageWrap({
  title,
  subtitle,
  breadcrumb,
  actions,
  children,
  className,
}: PageWrapProps) {
  return (
    <div className={cn('px-6 py-5 space-y-5', className)}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          {breadcrumb && breadcrumb.length > 0 && <Breadcrumb items={breadcrumb} />}
          <h1 className="font-display text-[26px] font-medium leading-tight tracking-[-0.5px] text-ink">
            {title}
          </h1>
          {subtitle && <p className="text-[13px] text-ink-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      <div className="space-y-5">{children}</div>
    </div>
  );
}
