import { cn } from '@/lib/utils';

type Variant = 'onDark' | 'onLight';
type WordmarkTone = 'light' | 'dark';

interface BrandMarkProps {
  size?: number;
  variant?: Variant;
  withWordmark?: boolean;
  wordmarkTone?: WordmarkTone;
  eyebrow?: string;
  display?: string;
  className?: string;
}

/**
 * Marca do sistema — mesma geometria do design base (quadrado 64×64 rx-14,
 * símbolo em dois tons de azul, wordmark com eyebrow uppercase + nome em
 * Fraunces), com o miolo trocado para o domínio educação (livro aberto).
 */
export function BrandMark({
  size = 28,
  variant = 'onDark',
  withWordmark = false,
  wordmarkTone = 'light',
  eyebrow = 'Gestão Educacional',
  display = 'Ibirapitanga - BA',
  className,
}: BrandMarkProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Mark size={size} variant={variant} />
      {withWordmark && (
        <span className="leading-tight">
          <span
            className={cn(
              'block text-[9.5px] font-semibold uppercase tracking-[1px]',
              wordmarkTone === 'light' ? 'text-brand-sidebarMuted' : 'text-ink-muted',
            )}
          >
            {eyebrow}
          </span>
          <span
            className={cn(
              'block font-display text-[14px] font-semibold tracking-[-0.2px]',
              wordmarkTone === 'light' ? 'text-white' : 'text-ink',
            )}
          >
            {display}
          </span>
        </span>
      )}
    </span>
  );
}

function Mark({ size, variant }: { size: number; variant: Variant }) {
  if (variant === 'onLight') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
        <rect x="2" y="2" width="60" height="60" rx="14" fill="#0C3FA0" />
        {/* Livro aberto */}
        <path
          d="M32 20 C27 16.5 19.5 16 13 17.5 L13 44 C19.5 42.5 27 43 32 46.5 C37 43 44.5 42.5 51 44 L51 17.5 C44.5 16 37 16.5 32 20 Z"
          fill="#fff"
        />
        <path d="M32 20 L32 46.5" stroke="#0C3FA0" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M18 24 L27 25.5 M18 30 L27 31.5 M18 36 L27 37.5" stroke="rgba(12,63,160,0.45)" strokeWidth="2" strokeLinecap="round" />
        <path d="M46 24 L37 25.5 M46 30 L37 31.5 M46 36 L37 37.5" stroke="rgba(12,63,160,0.45)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="2" y="2" width="60" height="60" rx="14" fill="#fff" />
      {/* Livro aberto em dois tons de azul */}
      <path
        d="M32 20 C27 16.5 19.5 16 13 17.5 L13 44 C19.5 42.5 27 43 32 46.5 Z"
        fill="#0C3FA0"
      />
      <path
        d="M32 20 C37 16.5 44.5 16 51 17.5 L51 44 C44.5 42.5 37 43 32 46.5 Z"
        fill="#2670E8"
      />
      <path d="M32 20 L32 46.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 24 L27 25.5 M18 30 L27 31.5 M18 36 L27 37.5" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round" />
      <path d="M46 24 L37 25.5 M46 30 L37 31.5 M46 36 L37 37.5" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
