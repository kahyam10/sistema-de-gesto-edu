import { cn } from '@/lib/utils';
import * as React from 'react';

const palette = ['#1351B4', '#1F6FB2', '#A94B8C', '#D97706', '#3B86A8', '#5C7A4F'];

function deterministicColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function initialsOf(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0])
      .join('')
      .toUpperCase() || '?'
  );
}

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  size?: number;
  color?: string;
}

/** Avatar de iniciais com cor determinística derivada do nome. */
export function Avatar({ name, size = 36, color, className, style, ...rest }: AvatarProps) {
  const c = color ?? deterministicColor(name);
  const initials = initialsOf(name);
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-[-0.3px]',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `${c}1A`,
        color: c,
        fontSize: size * 0.36,
        ...style,
      }}
      {...rest}
    >
      {initials}
    </div>
  );
}
