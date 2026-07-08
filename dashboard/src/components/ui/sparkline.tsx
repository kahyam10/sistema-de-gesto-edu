import { cn } from '@/lib/utils';
import * as React from 'react';

export interface SparklineProps extends React.SVGAttributes<SVGSVGElement> {
  /** SVG path data em espaço 0-100 × 0-32 */
  path: string;
  color?: string;
}

export function Sparkline({
  path,
  color = '#1351B4',
  className,
  ...rest
}: SparklineProps) {
  return (
    <svg
      width="100%"
      height={32}
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className={cn('block', className)}
      {...rest}
    >
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} />
      <path d={`${path} L 100 32 L 0 32 Z`} fill={color} opacity={0.08} />
    </svg>
  );
}

/** Constrói um path de polilinha a partir de valores numéricos. */
export function buildSparklinePath(values: number[]): string {
  if (values.length === 0) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = 100 / Math.max(values.length - 1, 1);
  return values
    .map((v, i) => {
      const x = i * stepX;
      const y = 32 - ((v - min) / span) * 30 - 1;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}
