'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icons';
import { useAuth } from '@/lib/auth';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  SEMEC: 'SEMEC',
  DIRETOR: 'Diretor(a)',
  COORDENADOR: 'Coordenador(a)',
  PROFESSOR: 'Professor(a)',
  SECRETARIA: 'Secretaria escolar',
  USER: 'Usuário',
};

/** Menu do usuário na topbar — dropdown com clique-fora e Escape. */
export function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  function handleLogout() {
    setOpen(false);
    logout();
    router.push('/login');
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-md pl-3 pr-1.5 py-1 transition-colors duration-180 hover:bg-surface-alt"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="text-right leading-tight">
          <div className="text-[12.5px] font-semibold tracking-[-0.1px] text-ink">{user.nome}</div>
          <div className="text-[11px] text-ink-muted">{roleLabel}</div>
        </div>
        <Avatar name={user.nome} size={34} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-60 rounded-md border border-hairline bg-white shadow-lg overflow-hidden"
        >
          <div className="px-3 py-2.5 border-b border-hairline">
            <div className="text-[13px] font-semibold text-ink">{user.nome}</div>
            <div className="text-[11.5px] text-ink-muted">{roleLabel}</div>
            <div className="mt-0.5 text-[11px] text-ink-soft truncate">{user.email}</div>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-danger hover:bg-danger-soft transition-colors duration-180"
          >
            <Icon name="logout" size={14} />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
