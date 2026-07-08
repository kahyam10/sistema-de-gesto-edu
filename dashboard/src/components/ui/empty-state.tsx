import { cn } from '@/lib/utils';
import { Icon, type IconName } from './icons';
import * as React from 'react';

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = 'info',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
        <Icon name={icon} size={20} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description && (
          <p className="max-w-md text-[13px] text-ink-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Variante compacta para dentro de widgets do dashboard. */
export function EmptyWidget({ icon, label }: { icon: IconName; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-alt text-ink-muted">
        <Icon name={icon} size={16} strokeWidth={1.8} />
      </div>
      <div className="max-w-[260px] text-[12.5px] text-ink-muted">{label}</div>
    </div>
  );
}
