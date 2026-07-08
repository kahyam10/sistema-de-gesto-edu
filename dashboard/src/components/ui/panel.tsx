import { cn } from '@/lib/utils';
import * as React from 'react';

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  action?: React.ReactNode;
  headerRight?: React.ReactNode;
  pad?: boolean;
}

/**
 * Panel — superfície branca com borda hairline e header opcional.
 * O contêiner universal de conteúdo do design.
 */
export function Panel({
  title,
  action,
  headerRight,
  pad = true,
  className,
  children,
  ...rest
}: PanelProps) {
  return (
    <div
      className={cn(
        'bg-surface-card border border-hairline rounded-lg shadow-sm',
        className,
      )}
      {...rest}
    >
      {title && (
        <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-hairline">
          <div className="text-[13.5px] font-semibold text-ink tracking-[-0.1px]">{title}</div>
          {(headerRight ?? action) && (
            <div className="text-xs font-semibold text-ink-muted">
              {headerRight ?? action}
            </div>
          )}
        </div>
      )}
      <div className={pad ? 'p-[18px]' : ''}>{children}</div>
    </div>
  );
}
