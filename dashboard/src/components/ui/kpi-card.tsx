import { cn } from '@/lib/utils';
import { Icon, type IconName } from './icons';
import { Sparkline } from './sparkline';
import * as React from 'react';

export interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  delta?: string;
  deltaPos?: 'up' | 'down' | 'flat';
  deltaSuffix?: string;
  sparkline?: string;
  /** Cor (hex) do sparkline + tint do ícone. Default: chart-1. */
  color?: string;
  icon?: IconName;
  className?: string;
}

/**
 * KpiCard — tile de estatística compacto. Valor em fonte display (Fraunces).
 */
export function KpiCard({
  label,
  value,
  unit,
  delta,
  deltaPos,
  deltaSuffix,
  sparkline,
  color = '#1351B4',
  icon,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-surface-card border border-hairline rounded-lg p-4 shadow-sm',
        className,
      )}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="uppercase-label">{label}</span>
        {icon && (
          <div
            className="flex h-[26px] w-[26px] items-center justify-center rounded-md"
            style={{ background: `${color}1A` }}
          >
            <Icon name={icon} size={14} strokeWidth={1.9} style={{ color }} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-[28px] font-medium leading-none tracking-[-0.6px] text-ink">
          {value}
        </span>
        {unit && <span className="text-xs text-ink-muted">{unit}</span>}
      </div>
      {delta && (
        <div
          className={cn(
            'mt-1.5 flex items-center gap-1 text-[11.5px] font-semibold',
            deltaPos === 'up' && 'text-success',
            deltaPos === 'down' && 'text-danger',
            (!deltaPos || deltaPos === 'flat') && 'text-ink-muted',
          )}
        >
          {deltaPos === 'up' && <Icon name="trendUp" size={12} strokeWidth={2.2} />}
          {deltaPos === 'down' && <Icon name="trendDown" size={12} strokeWidth={2.2} />}
          <span>{delta}</span>
          {deltaSuffix && <span className="ml-0.5 font-medium text-ink-muted">{deltaSuffix}</span>}
        </div>
      )}
      {sparkline && (
        <div className="mt-2">
          <Sparkline path={sparkline} color={color} />
        </div>
      )}
    </div>
  );
}
