'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { BrandMark } from '@/components/brand/brand-mark';

const REMEMBER_KEY = 'sge.login.rememberedEmail';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, router]);

  // Recupera e-mail memorizado no primeiro render.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setEmail(saved);
        setRemember(true);
      } else {
        setRemember(false);
      }
    } catch {
      /* localStorage indisponível — segue sem pré-preencher */
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao autenticar.');
      setLoading(false);
      return;
    }

    // Persiste / limpa "memorizar usuário" só após login bem-sucedido.
    try {
      if (remember) {
        window.localStorage.setItem(REMEMBER_KEY, email);
      } else {
        window.localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {
      /* ignora falha de storage */
    }

    router.replace('/');
  }

  return (
    <div className="min-h-screen flex font-sans bg-surface text-ink">
      {/* ── Esquerda · painel da marca ─────────────────────────── */}
      <div
        className="hidden md:flex flex-[1.1] relative overflow-hidden text-white"
        style={{ background: '#0A2761', padding: '40px 48px' }}
      >
        <svg
          className="absolute inset-0 opacity-60 pointer-events-none"
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="dgg" cx="20%" cy="100%" r="80%">
              <stop offset="0%" stopColor="#0C3FA0" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0C3FA0" stopOpacity="0" />
            </radialGradient>
            <pattern id="dgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dgrid)" />
          <rect width="100%" height="100%" fill="url(#dgg)" />
        </svg>

        <div className="relative flex flex-col w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <BrandMark size={114} variant="onDark" />
            <div className="leading-tight">
              <div className="text-[10px] font-semibold tracking-[1.4px] uppercase text-white/60">
                Gestão Educacional
              </div>
              <div className="font-display text-[18px] font-semibold tracking-tight">
                Ibirapitanga - BA
              </div>
              <div className="text-[10px] tracking-[0.4px] uppercase text-white/45 mt-0.5">
                Sistema integrado da rede municipal de ensino
              </div>
            </div>
          </div>

          <div className="flex-1" />

          <div className="relative max-w-[460px]">
            <div className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-[0.4px] mb-[18px] bg-white/[0.08] border border-white/[0.12]">
              Painel de gestão · acesso restrito
            </div>
            <h1 className="m-0 font-display text-[40px] font-medium tracking-[-1px] leading-[1.05]">
              Educação municipal,
              <br />
              <span style={{ color: '#9DBFF8' }}>gerida com clareza.</span>
            </h1>
            <p className="mt-4 mb-0 text-[14.5px] leading-[1.55] max-w-[420px] text-white/70">
              Acompanhe matrículas, turmas, calendário letivo e o censo escolar
              em tempo real em todas as escolas de Ibirapitanga.
            </p>
          </div>

          <div className="relative mt-9 grid grid-cols-3 gap-[22px] max-w-[460px]">
            {[
              { v: '6', l: 'Escolas municipais' },
              { v: '18', l: 'Séries de ensino' },
              { v: '100%', l: 'Gestão digital' },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-[24px] font-medium tracking-[-0.4px]">{s.v}</div>
                <div className="text-[11px] text-white/60 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="relative mt-9 text-[11px] flex justify-between text-white/45">
            <span>Prefeitura de Ibirapitanga · Secretaria Municipal de Educação</span>
            <span>v 1.0.0</span>
          </div>
        </div>
      </div>

      {/* ── Direita · formulário ───────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-surface">
        <form onSubmit={onSubmit} className="w-full max-w-[380px]">
          <h2 className="m-0 font-display text-[28px] font-medium tracking-[-0.6px]">
            Acesse o painel
          </h2>
          <p className="mt-1.5 mb-7 text-[13.5px] leading-[1.5] text-ink-muted">
            Use suas credenciais profissionais.
            <br />
            Acesso registrado conforme LGPD.
          </p>

          {/* E-mail */}
          <Field label="E-mail institucional">
            <InputBox active={!!email}>
              <UserIcon />
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.nome@ibirapitanga.ba.gov.br"
                className="flex-1 border-0 outline-none bg-transparent font-sans text-[13.5px] text-ink placeholder:text-ink-soft"
              />
            </InputBox>
          </Field>

          {/* Senha */}
          <Field label="Senha">
            <InputBox active={!!password}>
              <ShieldIcon />
              <input
                type={showPwd ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="flex-1 border-0 outline-none bg-transparent font-sans text-[13.5px] text-ink"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
                className="bg-transparent border-0 p-1 cursor-pointer text-ink-muted flex"
              >
                <EyeIcon />
              </button>
            </InputBox>
          </Field>

          {/* Memorizar usuário */}
          <label className="mt-1 flex items-center gap-2 cursor-pointer text-[12.5px] text-ink-3 select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="sr-only"
            />
            <span
              className={`
                w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-colors
                ${remember ? 'bg-brand-600 border-brand-600' : 'bg-white border-hairline-strong'}
              `}
            >
              {remember && (
                <svg
                  className="w-3 h-3 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
            </span>
            Memorizar meu usuário neste computador
          </label>

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="
              mt-[22px] w-full h-[46px] border-0 rounded-[7px]
              bg-brand-600 hover:bg-brand-hover text-white
              font-sans text-[14px] font-semibold tracking-[0.2px]
              cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
              transition-colors
            "
          >
            {loading ? 'Entrando...' : 'Entrar no painel'}
            {!loading && <ArrowRightIcon />}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-2.5 my-[22px]">
            <div className="flex-1 h-px bg-hairline" />
            <span className="text-[11px] text-ink-muted font-medium uppercase tracking-[0.8px]">
              ou
            </span>
            <div className="flex-1 h-px bg-hairline" />
          </div>

          {/* SSO alternativo · desabilitado */}
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Login com gov.br ainda não disponível"
            className="
              w-full h-11 border border-hairline-strong rounded-[7px]
              bg-white flex items-center justify-center gap-2.5
              font-sans text-[13px] font-semibold text-ink-2
              opacity-60 cursor-not-allowed
            "
          >
            <span
              className="w-[18px] h-[18px] rounded flex items-center justify-center font-bold text-[10px] text-white"
              style={{ background: '#1351B4' }}
            >
              g
            </span>
            Entrar com Conta gov.br
            <span className="ml-1 text-[10px] font-semibold uppercase tracking-[0.6px] text-ink-soft">
              em breve
            </span>
          </button>

          {/* Footer info */}
          <div className="mt-7 p-[12px_14px] rounded-[7px] flex gap-2.5 items-start bg-info-soft">
            <InfoIcon />
            <div className="text-[11.5px] text-ink-2 leading-[1.5]">
              Sistema homologado e implantado pela <b>KSsoft</b>; em caso de
              dificuldades de acesso solicite suporte à SEMEC.
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Field wrapper ────────────────────────────────────────────────
function Field({
  label,
  right,
  children,
}: {
  label: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3.5">
      <div className="flex justify-between items-baseline mb-[5px]">
        <label className="text-[11.5px] font-semibold uppercase tracking-[0.8px] text-ink-muted">
          {label}
        </label>
        {right}
      </div>
      {children}
    </div>
  );
}

function InputBox({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`
        h-[42px] rounded-[7px] flex items-center px-3 gap-[9px] bg-white
        border ${active ? 'border-brand-600' : 'border-hairline'}
        focus-within:border-brand-600 transition-colors
      `}
    >
      {children}
    </div>
  );
}

// ── Ícones ───────────────────────────────────────────────────────
function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5B6B85" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5B6B85" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1F6FB2" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 12h1v5h1" />
    </svg>
  );
}
