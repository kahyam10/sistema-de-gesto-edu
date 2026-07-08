'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Icon } from '@/components/ui/icons';

/** Alterna claro/escuro. Renderiza só após a montagem para evitar
 *  divergência de hidratação (o tema vem do localStorage). */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="rounded-md p-2 text-ink-muted transition-colors duration-180 hover:bg-surface-alt hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
    >
      {mounted ? <Icon name={isDark ? 'sun' : 'moon'} size={17} /> : <span className="block size-[17px]" />}
    </button>
  );
}
