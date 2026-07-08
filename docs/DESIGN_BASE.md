# DESIGN_BASE.md — Fonte de verdade do design "Gestão SUS Municipal"

> **Propósito deste documento.** Replicar fielmente o design/UI do dashboard deste projeto em OUTRO sistema (gestão educacional, Next.js 15 App Router + Tailwind CSS 3.4 + shadcn/ui + next-themes com dark mode por classe + ícones Phosphor/Lucide). Este arquivo é **autocontido**: todo o código e todos os valores necessários estão colados aqui verbatim. Não há dados de negócio, credenciais ou informações de pacientes — apenas design.
>
> **Como ler:** a seção 2 traz os tokens exatos; a seção 3 traz o código-fonte completo dos componentes; a seção 4 descreve como as páginas são compostas; a seção 5 diz o que adaptar para o domínio educação e para o stack de destino.

---

## 1. Stack visual deste projeto

| Aspecto | Valor |
|---|---|
| Framework | **Next.js 15.1.3** (App Router) + **React 19.0.0** — Server Components por padrão; `'use client'` apenas em componentes interativos |
| Estilo | **Tailwind CSS 3.4.17** exclusivamente (utility-first). Sem CSS Modules, sem styled-components, sem MUI. Um único `globals.css` com `@layer` para utilitários compostos |
| Biblioteca de componentes | **Kit próprio, estilo shadcn** em `src/components/ui/` (Button, Badge, Panel, KpiCard, PageWrap, DataTable, EmptyState, Avatar, Breadcrumb, Sparkline, Icon). **NÃO é shadcn/ui instalado** — não existem `input.tsx`, `select.tsx`, `dialog.tsx`, `toast.tsx`, `skeleton.tsx`. Radix UI é usado diretamente onde necessário (`@radix-ui/react-dialog` para modais). CVA não é usado nos componentes — variantes são `Record<Variant, string>` simples |
| Utilitário de classes | `cn()` = `twMerge(clsx(...))` (clsx 2.1.1 + tailwind-merge 2.6.0) — idêntico ao padrão shadcn |
| Ícones | **lucide-react 0.469.0**, SEMPRE via wrapper central `<Icon name="..." />` (`src/components/ui/icons.tsx`). Defaults do wrapper: `size={18}`, `strokeWidth={1.6}`. Tamanhos reais em uso: 12–17px em UI densa (nav 17px, botões 12–16px, células de tabela 12–13px). Stroke fino (1.6–1.9) é parte da identidade; item ativo da nav usa strokeWidth 2 |
| Gráficos | **Nenhuma biblioteca.** Todos os gráficos são **SVG desenhado à mão** (sparklines, gráfico de linhas multissérie, barras de progresso em `div`). Ver componente `Sparkline` e os widgets do dashboard na seção 3 |
| Dark mode | `darkMode: ['class']` está configurado no Tailwind, **mas o app é 100% light-only** — não existe bloco `.dark`, nenhum token escuro, nenhum toggle de tema. O "escuro" do design é a **sidebar azul-marinho fixa** (`#062654`), que existe nos dois casos. Ver seção 5 para a estratégia de dark mode no sistema de destino |
| Fontes | `next/font/google` com 3 famílias expostas como variáveis CSS: **Inter** (`--font-sans`, texto geral), **Fraunces** (`--font-display`, serifada — títulos e números de destaque, pesos 400/500/600), **JetBrains Mono** (`--font-mono`, números tabulares/código). Carregadas no root layout com `display: 'swap'` |
| Animações | Plugin `tailwindcss-animate` instalado; na prática quase tudo é `transition-colors duration-180` (180ms é a duração canônica, definida como token) |
| Tabelas/Forms (lógica) | `@tanstack/react-table` e `react-hook-form`+`zod` estão nas dependências, mas as telas principais usam tabelas manuais e forms controlados com `useState` + validação zod no submit |

---

## 2. Design tokens (VERBATIM)

### 2.1 `tailwind.config.ts` — completo

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } },
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0C3FA0',
          50: '#EEF4FF',
          100: '#D4E5FF',
          200: '#A9CBFF',
          300: '#7EB0FF',
          400: '#4285F4',
          500: '#0C3FA0',
          600: '#0C3FA0',
          700: '#072B73',
          800: '#081F4A',
          900: '#071D41',
          soft: '#E7EEFB',
          faint: '#F2F6FC',
          deep: '#062654',
          hover: '#0E3C7A',
          sel: '#164E9F',
          light: '#2670E8',
          gold: '#D4A24C',
          sidebarText: '#C9D6EE',
          sidebarMuted: '#7E8FB0',
        },
        accent: {
          DEFAULT: '#F4B942',
          soft: '#FDF3DC',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#EEF1F6',
          alt: '#FAFBFD',
          card: '#FFFFFF',
          elev: '#F8F9FB',
          soft: '#E8F3EE',
        },
        ink: {
          DEFAULT: '#1A2421',
          2: '#2F3A35',
          3: '#3B4A5E',
          muted: '#6B7872',
          soft: '#95A1B5',
          mutedLight: '#9AA7B8',
        },
        border: {
          DEFAULT: '#E3E7E4',
          strong: '#C4CCDA',
          dark: '#CFD4DC',
        },
        hairline: {
          DEFAULT: '#E3E7E4',
          strong: '#CFD4DC',
        },
        danger: { DEFAULT: '#C8391F', soft: '#FCEAE4' },
        warn: { DEFAULT: '#D97706', soft: '#FCEED2' },
        warning: { DEFAULT: '#D97706', soft: '#FCEED2' },
        success: { DEFAULT: '#0F8A5F', soft: '#DFF1E8' },
        ok: { DEFAULT: '#0F8A5F', soft: '#DFF1E8' },
        info: { DEFAULT: '#1F6FB2', soft: '#E2EEF8' },
        chart: {
          1: '#1351B4',
          2: '#1F6FB2',
          3: '#A94B8C',
          4: '#D97706',
          5: '#3B86A8',
          6: '#5C7A4F',
          7: '#C8391F',
          8: '#6B7872',
        },
      },
      borderRadius: { xs: '4px', sm: '6px', md: '8px', lg: '10px', xl: '14px' },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Fraunces', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['10.5px', { lineHeight: '1.3' }],
      },
      letterSpacing: {
        label: '0.7px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(15,23,40,0.05)',
        md: '0 1px 3px rgba(15,23,40,0.06), 0 4px 16px rgba(15,23,40,0.06)',
        lg: '0 8px 32px rgba(15,23,40,0.10)',
      },
      transitionDuration: { 180: '180ms' },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
```

**Semântica dos tokens de cor (o que cada um significa):**

| Token | Hex | Uso |
|---|---|---|
| `brand` / `brand-500/600` | `#0C3FA0` | Azul institucional — botões primários, links, item ativo, chips de filtro ativos |
| `brand-deep` | `#062654` | **Fundo da sidebar** (azul-marinho quase preto) |
| `brand-hover` | `#0E3C7A` | Hover de botão primário e de item da sidebar |
| `brand-sel` | `#164E9F` | Fundo do item **ativo** da sidebar |
| `brand-sidebarText` | `#C9D6EE` | Texto padrão da sidebar (azul acinzentado claro) |
| `brand-sidebarMuted` | `#7E8FB0` | Eyebrows/labels de seção da sidebar |
| `brand-soft` | `#E7EEFB` | Fundo de badge primário, botão `soft`, seleção suave |
| `brand-light` | `#2670E8` | Azul mais vivo (segunda cor do logo) |
| `accent` | `#F4B942` | Âmbar/dourado — pontos de notificação, detalhes; usado com parcimônia |
| `surface` | `#FFFFFF` | Fundo do app e das páginas |
| `surface-alt` | `#FAFBFD` | Hover de linhas/itens, fundos alternativos sutis |
| `surface-elev` | `#F8F9FB` | Fundo de inputs de busca, sub-blocos dentro de cards |
| `surface-muted` | `#EEF1F6` | Badge neutro, círculo de empty state |
| `ink` | `#1A2421` | Texto principal (quase-preto esverdeado) |
| `ink-2` | `#2F3A35` | Texto secundário forte (células de tabela, botões outline) |
| `ink-3` | `#3B4A5E` | Texto secundário azulado |
| `ink-muted` | `#6B7872` | Labels, descrições, texto auxiliar |
| `ink-soft` | `#95A1B5` | Placeholders, timestamps, texto terciário |
| `hairline` | `#E3E7E4` | **A cor de borda universal** — bordas de cards, divisores de linhas, tudo |
| `hairline-strong` | `#CFD4DC` | Bordas de controles que precisam de mais presença (botão outline, checkbox) |
| `danger` / `danger-soft` | `#C8391F` / `#FCEAE4` | Erros, estados críticos, logout |
| `warning` / `warning-soft` | `#D97706` / `#FCEED2` | Alertas, pendências |
| `success` / `success-soft` | `#0F8A5F` / `#DFF1E8` | Sucesso, concluído, ativo |
| `info` / `info-soft` | `#1F6FB2` / `#E2EEF8` | Informativo, em andamento |
| `chart-1..8` | ver config | Paleta categórica de dados: azul `#1351B4`, azul-médio `#1F6FB2`, magenta `#A94B8C`, âmbar `#D97706`, teal `#3B86A8`, verde-oliva `#5C7A4F`, vermelho `#C8391F`, cinza `#6B7872` |

**Texto sobre fundos "soft" (contraste):** quando o texto precisa de mais contraste que o token DEFAULT sobre o fundo soft, o projeto usa hex literais: `text-[#0A6142]` sobre `success-soft`, `text-[#8B5A06]` sobre `warning-soft`, `text-[#8B6A10]` sobre `accent-soft` (ver Badge, seção 3.3).

### 2.2 `src/app/globals.css` — completo

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  /* Texto livre vindo de rich text — preserva
     paragrafos/negrito/listas com tipografia legivel. */
  .rich-text > * + * { margin-top: 0.6em; }
  .rich-text p { line-height: 1.55; }
  .rich-text strong, .rich-text b { font-weight: 600; color: theme('colors.ink.DEFAULT'); }
  .rich-text em, .rich-text i { font-style: italic; }
  .rich-text ul { list-style: disc; padding-left: 1.25rem; }
  .rich-text ol { list-style: decimal; padding-left: 1.25rem; }
  .rich-text li + li { margin-top: 0.2em; }
  .rich-text h1, .rich-text h2, .rich-text h3, .rich-text h4 {
    font-weight: 600; color: theme('colors.ink.DEFAULT');
  }
  .rich-text blockquote {
    border-left: 3px solid theme('colors.hairline.DEFAULT');
    padding-left: 0.75rem; color: theme('colors.ink.muted');
  }

  /* Scrollbar discreta para a sidebar escura. */
  .scrollbar-dark::-webkit-scrollbar { width: 6px; height: 6px; }
  .scrollbar-dark::-webkit-scrollbar-track { background: transparent; }
  .scrollbar-dark::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 3px;
  }
  .scrollbar-dark::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.22);
  }
  .scrollbar-dark { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.18) transparent; }
}

@layer base {
  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  body {
    @apply bg-surface text-ink font-sans;
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  }
  * {
    @apply border-border;
  }
  /* Numeric/code text */
  .text-mono,
  code,
  kbd,
  samp {
    @apply font-mono;
    font-variant-numeric: tabular-nums;
  }
  /* Display headings */
  .text-display {
    @apply font-display;
    letter-spacing: -0.01em;
  }
}

@layer utilities {
  /* === Surfaces === */
  .card {
    @apply bg-surface-card border border-border rounded-lg shadow-sm;
  }
  .panel {
    @apply bg-surface-card border border-hairline rounded-lg shadow-sm;
  }
  .hairline {
    @apply border-hairline;
  }
  .hairline-strong {
    @apply border-hairline-strong;
  }

  /* === Labels === */
  .uppercase-label {
    @apply text-[11.5px] font-semibold text-ink-muted uppercase tracking-label;
  }

  /* === Rows === */
  .row-hover {
    @apply hover:bg-surface-alt transition-colors duration-180;
  }

  /* === Inputs === */
  .input {
    @apply block w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm
      placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand
      disabled:opacity-50 disabled:cursor-not-allowed;
  }

  /* === Legacy buttons (kept for compat with existing code) === */
  .btn-primary {
    @apply inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium
      text-white shadow-sm hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed;
  }
  .btn-secondary {
    @apply inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2
      text-sm font-medium text-ink shadow-sm hover:bg-surface-muted/50
      disabled:opacity-50 disabled:cursor-not-allowed;
  }
  .btn-danger {
    @apply inline-flex items-center justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-medium
      text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed;
  }
  .btn-danger-outline {
    @apply inline-flex items-center justify-center rounded-md border border-rose-300 bg-white px-3 py-1.5
      text-sm font-medium text-rose-700 shadow-sm hover:bg-rose-50
      disabled:opacity-50 disabled:cursor-not-allowed;
  }
}
```

### 2.3 Fontes — `src/app/fonts.ts` e root layout (verbatim)

```ts
// src/app/fonts.ts
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google';

export const fontSans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const fontDisplay = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '500', '600'],
});

export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});
```

```tsx
// src/app/layout.tsx (estrutura; título/metadata trocar pelo domínio de destino)
import type { Metadata } from 'next';
import { fontSans, fontDisplay, fontMono } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: '<Nome do sistema>',
  description: '<Descrição>',
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

### 2.4 Escala tipográfica REAL (como usada nas telas)

A identidade tipográfica tem 3 vozes: **Fraunces (serifada)** para títulos e números-destaque, **Inter** para todo o resto, **JetBrains Mono** (tabular) para números em tabelas. Os tamanhos são majoritariamente valores arbitrários em px (`text-[13px]` etc.) — o design é ~1px menor que a escala default do Tailwind, deliberadamente denso.

| Nível | Classes exatas | Onde |
|---|---|---|
| H1 (título de página) | `font-display text-[26px] font-medium leading-tight tracking-[-0.5px] text-ink` | `PageWrap` |
| Hero (login) | `font-display text-[40px] font-medium tracking-[-1px] leading-[1.05]` | painel esquerdo do login |
| H2 (título de form/card grande) | `font-display text-[28px] font-medium tracking-[-0.6px]` | "Acesse o painel" no login |
| Valor de KPI | `font-display text-[28px] font-medium leading-none tracking-[-0.6px] text-ink` | `KpiCard` |
| Número em widget | `font-display text-[18px]`–`text-[22px] font-medium/semibold tracking-[-0.3px..-0.4px]` | listas do dashboard |
| Título de Panel | `text-[13.5px] font-semibold text-ink tracking-[-0.1px]` | header do `Panel` |
| Título de Dialog | `text-[15px] font-semibold text-ink` | header do modal |
| Corpo/célula | `text-[13px] text-ink-2` (tabela usa `text-[13px]` no `<table>`) | tabelas, nav, inputs |
| Corpo denso | `text-[12.5px]` | linhas de resumo, itens de menu/alerta |
| Descrição/subtítulo | `text-[13.5px] text-ink-muted` (login) / `text-[13px] text-ink-muted` (PageWrap subtitle) | — |
| Label de formulário | `text-[12px] font-medium text-ink-muted` | forms |
| Label uppercase ("eyebrow") | `.uppercase-label` = `text-[11.5px] font-semibold text-ink-muted uppercase tracking-label` (tracking 0.7px). Variações: th de tabela `text-[11px] tracking-label`, seção de sidebar `text-[10px] tracking-[1px]`, eyebrow do logo `text-[9.5px] tracking-[1px]` | labels de KPI, th, seções |
| Caption/meta | `text-[11.5px] text-ink-muted` e `text-[11px] text-ink-soft` | timestamps, ajuda |
| Micro | `text-[10.5px]` (`text-2xs`) | badges sm, tempos relativos |
| Numérico tabular | `font-mono text-[11px..12px] font-semibold` | contagens em tabelas |

**Line-heights:** títulos `leading-tight`/`leading-none`; corpo confia no default; textos longos `leading-[1.5]`–`[1.55]`. **Letter-spacing:** títulos display sempre negativos (−0.4 a −1px); uppercase labels sempre positivos (+0.4 a +1.4px); corpo levemente ajustado (`tracking-[-0.1px]` em nomes).

### 2.5 Raios, sombras, espaçamentos e métricas de controles

**Raios (escala custom — menor que o default Tailwind):** `rounded-xs` 4px · `rounded-sm` 6px (botões!) · `rounded-md` 8px (inputs, itens de nav, cards menores, dialogs) · `rounded-lg` 10px (cards/panels) · `rounded-xl` 14px · `rounded-full` (badges, chips de filtro, avatar). **Botões usam `rounded-sm` (6px)** — cantos discretos são identidade.

**Sombras:** `shadow-sm` `0 1px 2px rgba(15,23,40,0.05)` (cards/panels — a única sombra em quase tudo) · `shadow-md` `0 1px 3px rgba(15,23,40,0.06), 0 4px 16px rgba(15,23,40,0.06)` · `shadow-lg` `0 8px 32px rgba(15,23,40,0.10)` (dropdown do usuário) · dialog usa `shadow-xl` (default Tailwind). A elevação é quase toda comunicada por **borda hairline**, não por sombra.

**Espaçamentos padrão:**
- Página: `px-6 py-5`, seções empilhadas com `space-y-5` (20px)
- Grids de cards/widgets: `gap-3.5` (14px) no dashboard; `gap-3` (12px) em grids de listagem
- Card KPI: `p-4`; Panel: header `px-[18px] py-[14px]`, corpo `p-[18px]`; cards de listagem: `p-4` ou `p-3.5`
- Células de tabela: `px-3 py-3` (ou `py-2` densa); th `px-3 py-2.5`; tabela do dashboard `px-4 py-3`
- Forms: campos empilhados `gap-3`/`space-y-4`; label→input `gap-1`

**Métricas de controles:**
- Topbar: `h-14` (56px); busca global `h-9 w-[320px]`
- Botões (via componente): sm `px-2.5 py-1 text-xs` (~24px), md `px-3.5 py-1.5 text-[13px]` (~30px), lg `px-[18px] py-[11px] text-sm` (~40px)
- Botões de ícone da topbar: `h-[34px] w-[34px]`
- Inputs de form: `px-3 py-2 text-sm` (~38px) via `.input`; forms densos `px-2 py-2 text-[13px]`; login `h-[42px]`; botão submit do login `h-[46px]`
- Sidebar: expandida `w-[232px]`, colapsada `w-16` (64px); item de nav `px-2.5 py-2 text-[13px] rounded-md`
- Avatar: 34px (topbar), 44px (cards de listagem); genérico 36px

---

## 3. Componentes-chave (código-fonte COMPLETO)

> Todos os componentes assumem os tokens da seção 2 e o utilitário `cn()`. Os textos/labels em português do domínio saúde devem ser trocados pelos equivalentes de educação (seção 5) — **as classes não**.

### 3.0 Fundamento: `cn()` — `src/lib/utils.ts`

```ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 3.1 Wrapper de ícones — `src/components/ui/icons.tsx`

Todo ícone do app passa por aqui (nunca importar do lucide direto nas telas). Garante stroke 1.6 e nomes semânticos estáveis. No sistema de destino, manter este wrapper e mapear para Phosphor/Lucide equivalentes.

```tsx
/**
 * Centralized icon set wrapping lucide-react with consistent stroke and size defaults.
 */
import {
  LayoutDashboard, Users, User, FileText, FlaskConical, Calendar, Pill, Syringe,
  BarChart3, Stethoscope, Bell, ShieldCheck, Settings, Search, ChevronRight,
  ChevronDown, ChevronUp, ChevronLeft, Plus, Minus, X, Check, Filter, Download,
  Upload, Pencil, Trash2, MapPin, Phone, Mail, Activity, Heart, Droplet, ArrowUp,
  ArrowDown, ArrowRight, ArrowLeft, TrendingUp, TrendingDown, MoreHorizontal,
  MoreVertical, Bookmark, Package, AlertTriangle, Info, LayoutGrid, List,
  RefreshCcw, Star, Eye, Clock, Bug, Megaphone, Layers, Tag, Home, KeyRound,
  Archive, CreditCard,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

export const iconMap = {
  home: Home,
  dashboard: LayoutDashboard,
  users: Users,
  user: User,
  file: FileText,
  flask: FlaskConical,
  calendar: Calendar,
  pill: Pill,
  syringe: Syringe,
  chart: BarChart3,
  stethoscope: Stethoscope,
  bell: Bell,
  shield: ShieldCheck,
  settings: Settings,
  search: Search,
  chevron: ChevronRight,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  plus: Plus,
  minus: Minus,
  close: X,
  check: Check,
  filter: Filter,
  download: Download,
  upload: Upload,
  edit: Pencil,
  trash: Trash2,
  location: MapPin,
  phone: Phone,
  mail: Mail,
  activity: Activity,
  heart: Heart,
  droplet: Droplet,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  trendUp: TrendingUp,
  trendDown: TrendingDown,
  dots: MoreHorizontal,
  dotsV: MoreVertical,
  bookmark: Bookmark,
  package: Package,
  warning: AlertTriangle,
  info: Info,
  grid: LayoutGrid,
  list: List,
  refresh: RefreshCcw,
  star: Star,
  eye: Eye,
  clock: Clock,
  bug: Bug,
  speaker: Megaphone,
  layers: Layers,
  tag: Tag,
  key: KeyRound,
  archive: Archive,
  creditCard: CreditCard,
} as const;

export type IconName = keyof typeof iconMap;

export interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

export function Icon({ name, size = 18, strokeWidth = 1.6, ...rest }: IconProps) {
  const Cmp: LucideIcon = iconMap[name] ?? MoreHorizontal;
  return <Cmp size={size} strokeWidth={strokeWidth} {...rest} />;
}
```

### 3.2 Button — `src/components/ui/button.tsx`

6 variantes: `primary` (azul cheio), `soft` (azul claro), `outline` (branco com borda), `ghost`, `danger`, `dark`. **`rounded-sm` (6px), `font-semibold`, texto 13px no md.** Foco: `focus:ring-2 ring-brand/40 ring-offset-1`.

```tsx
import { cn } from '@/lib/utils';
import { Icon, type IconName } from './icons';
import * as React from 'react';

export type ButtonVariant = 'primary' | 'soft' | 'outline' | 'ghost' | 'danger' | 'dark';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white border-transparent hover:bg-brand-hover',
  soft: 'bg-brand-soft text-brand-700 border-transparent hover:bg-brand-100',
  outline: 'bg-white text-ink-2 border-hairline-strong hover:bg-surface-alt',
  ghost: 'bg-transparent text-ink-2 border-transparent hover:bg-surface-alt',
  danger: 'bg-danger text-white border-transparent hover:opacity-90',
  dark: 'bg-ink text-white border-transparent hover:opacity-90',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3.5 py-1.5 text-[13px]',
  lg: 'px-[18px] py-[11px] text-sm',
};

const iconSize: Record<ButtonSize, number> = { sm: 12, md: 14, lg: 16 };

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'prefix'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconRight?: IconName;
  full?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, iconRight, full, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border font-semibold leading-tight tracking-[0.05px] transition-colors duration-180 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand/40 focus:ring-offset-1',
        variantStyles[variant],
        sizeStyles[size],
        full && 'w-full justify-center',
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={iconSize[size]} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize[size]} />}
    </button>
  );
});
```

**Uso das variantes:** `primary` = 1 por página (ação principal, ex. "Novo cadastro"); `outline` = ações secundárias do header (Exportar, Filtros); `ghost` = ações terciárias/toggles; `soft` = seleção/ação suave contextual; `danger` = destrutivas; `dark` = raríssimo (destaque especial).

### 3.3 Badge (chips de status) — `src/components/ui/badge.tsx`

Pílulas (`rounded-full`) com 9 tons. Opção `dot` adiciona ponto de cor à esquerda (usado para status "vivos" como Crítico/Baixo).

```tsx
import { cn } from '@/lib/utils';
import * as React from 'react';

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'accent'
  | 'outline'
  | 'dark';

const toneStyles: Record<BadgeTone, { wrap: string; dot: string }> = {
  neutral: { wrap: 'bg-surface-muted text-ink-2', dot: 'bg-ink-muted' },
  primary: { wrap: 'bg-brand-soft text-brand-700', dot: 'bg-brand' },
  success: { wrap: 'bg-success-soft text-[#0A6142]', dot: 'bg-success' },
  danger: { wrap: 'bg-danger-soft text-danger', dot: 'bg-danger' },
  warning: { wrap: 'bg-warning-soft text-[#8B5A06]', dot: 'bg-warning' },
  info: { wrap: 'bg-info-soft text-info', dot: 'bg-info' },
  accent: { wrap: 'bg-accent-soft text-[#8B6A10]', dot: 'bg-accent' },
  outline: { wrap: 'bg-transparent text-ink-2 border border-hairline', dot: 'bg-ink-muted' },
  dark: { wrap: 'bg-ink text-white', dot: 'bg-white' },
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
  size?: 'sm' | 'md';
}

export function Badge({
  tone = 'neutral',
  dot,
  size = 'md',
  className,
  children,
  ...rest
}: BadgeProps) {
  const t = toneStyles[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap tracking-[0.1px]',
        size === 'sm' ? 'px-1.5 py-px text-[10.5px]' : 'px-2.5 py-0.5 text-[11.5px]',
        t.wrap,
        className,
      )}
      {...rest}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', t.dot)} />}
      {children}
    </span>
  );
}
```

**Quando usar cada tom (semântica observada no app, com equivalentes educação):**

| Tone | Saúde (original) | Educação (equivalente) |
|---|---|---|
| `success` | concluído/ativo/aprovado/entregue | aprovado, matrícula ativa, entregue |
| `warning` | pendente/aguardando/estoque baixo/espera > 20min | pendência, aguardando análise, prazo próximo |
| `danger` | crítico/cancelado/negado/urgente | reprovado, evadido, atraso crítico |
| `info` | em andamento/em análise/agendado | em curso, em análise, agendado |
| `primary` | origem "oficial" (importado do sistema central) | registro vindo do sistema central (ex. censo) |
| `neutral` | estados sem carga semântica, contagens | idem |
| `accent` | destaque dourado raro (campanhas) | destaques/eventos |
| `outline` | metadados discretos | idem |
| `dark` | destaque máximo raro | idem |

### 3.4 Avatar — `src/components/ui/avatar.tsx`

Sem imagem: iniciais sobre a cor derivada deterministicamente do nome (mesma pessoa = mesma cor), com fundo na cor a 10% (`${c}1A`).

```tsx
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
```

### 3.5 Breadcrumb — `src/components/ui/breadcrumb.tsx`

Separador é **ponto médio `·`** (não chevron). Discreto, 11.5px, acima do título da página.

```tsx
import Link from 'next/link';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-[11.5px] text-ink-muted', className)}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <Fragment key={`${item.label}-${i}`}>
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-ink transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-ink-2 font-medium' : ''}>{item.label}</span>
            )}
            {!isLast && <span className="text-ink-soft">·</span>}
          </Fragment>
        );
      })}
    </nav>
  );
}
```

### 3.6 Panel (card de conteúdo) — `src/components/ui/panel.tsx`

O contêiner universal de conteúdo: branco, borda hairline, `rounded-lg` (10px), `shadow-sm`, header opcional com divisor.

```tsx
import { cn } from '@/lib/utils';
import * as React from 'react';

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  action?: React.ReactNode;
  headerRight?: React.ReactNode;
  pad?: boolean;
}

/**
 * Panel — white surface with hairline border, optional header row.
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
```

### 3.7 PageWrap (container de página) — `src/components/ui/page-wrap.tsx`

Toda página do app é envolvida por este componente: breadcrumb → H1 display serif 26px → subtítulo → ações à direita; conteúdo empilhado com `space-y-5`. **Sem max-width — o conteúdo é fluido.**

```tsx
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
 * PageWrap — header (breadcrumb + title + actions) + content area.
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
```

### 3.8 KpiCard + Sparkline — cards de estatística do dashboard

```tsx
// src/components/ui/kpi-card.tsx
import { cn } from '@/lib/utils';
import { Icon, type IconName } from './icons';
import { Sparkline } from './sparkline';
import * as React from 'react'; // (adicionado: o original omite e depende do tipo global de React)

export interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  delta?: string;
  deltaPos?: 'up' | 'down' | 'flat';
  sparkline?: string;
  /** Hex color for sparkline + icon tint. Defaults to brand. */
  color?: string;
  icon?: IconName;
  className?: string;
}

/**
 * KpiCard — compact stat tile. Uses display font for the headline value.
 */
export function KpiCard({
  label,
  value,
  unit,
  delta,
  deltaPos,
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
          <span className="ml-0.5 font-medium text-ink-muted">vs mês anterior</span>
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
```

```tsx
// src/components/ui/sparkline.tsx
import { cn } from '@/lib/utils';
import * as React from 'react';

export interface SparklineProps extends React.SVGAttributes<SVGSVGElement> {
  /** SVG path data using a 0-100 × 0-32 coordinate space */
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

/**
 * Build a smooth-ish polyline path from an array of numeric values.
 */
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
```

### 3.9 DataTable — `src/components/ui/data-table.tsx`

Tabela densa: th uppercase 11px tracking 0.7px, células 13px `text-ink-2`, divisores hairline horizontais (**nunca bordas verticais**), hover de linha via `.row-hover`.

```tsx
import { cn } from '@/lib/utils';
import * as React from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string | number;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  empty?: React.ReactNode;
  className?: string;
  dense?: boolean;
}

/**
 * Dense data table.
 * Server-Component-friendly (no event handlers — wrap in client comp for interactivity).
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  className,
  dense,
}: DataTableProps<T>) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-hairline">
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={cn(
                  'px-3 py-2.5 text-left font-semibold uppercase tracking-label text-[11px] text-ink-muted',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && empty ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-ink-muted">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                className="border-b border-hairline last:border-0 row-hover"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      dense ? 'px-3 py-2' : 'px-3 py-3',
                      'text-ink-2 align-middle',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.className,
                    )}
                  >
                    {col.cell(row, i)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
```

### 3.10 EmptyState — `src/components/ui/empty-state.tsx`

```tsx
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
```

Variante compacta usada **dentro de widgets do dashboard** (ícone em quadrado `rounded-md` menor):

```tsx
function EmptyWidget({ icon, label }: { icon: IconName; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-alt text-ink-muted">
        <Icon name={icon} size={16} strokeWidth={1.8} />
      </div>
      <div className="max-w-[260px] text-[12.5px] text-ink-muted">{label}</div>
    </div>
  );
}
```

### 3.10b ExportCsvButton — `src/components/ui/export-csv-button.tsx`

Wrapper fino do Button (aparece nas ações de listagem). Visualmente é apenas `Button variant="outline" size="sm" icon="download"`; a função `downloadCsv` é lógica de exportação (CSV com BOM UTF-8 e separador `;`) que o sistema de destino pode reimplementar livremente.

```tsx
'use client';

import { Button, type ButtonProps } from './button';
import { downloadCsv, type CsvCell, type CsvRow } from '@/lib/export/csv';

export interface ExportCsvButtonProps extends Omit<ButtonProps, 'onClick'> {
  filename: string;
  rows: CsvRow[];
  headers?: string[];
  label?: string;
}

export function ExportCsvButton({
  filename,
  rows,
  headers,
  label = 'Exportar CSV',
  variant = 'outline',
  size = 'sm',
  icon = 'download',
  ...rest
}: ExportCsvButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      icon={icon}
      disabled={rows.length === 0}
      onClick={() => downloadCsv({ filename, rows, headers })}
      {...rest}
    >
      {label}
    </Button>
  );
}
```

### 3.11 Shell da aplicação

**Layout do grupo `/app` — `src/app/app/layout.tsx`** (estrutura visual; a lógica de auth deve ser adaptada ao backend de destino):

```tsx
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // ... autenticação e derivação de userName/roleLabel/userEmail (adaptar ao backend) ...
  const sections = filterNavForRole(role); // filtra a nav pelo papel — ver nav.ts logo abaixo
  return (
    <div className="flex min-h-screen bg-surface text-ink">
      <Sidebar sections={sections} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          userName={userName}
          userRoleLabel={roleLabel}
          userEmail={userEmail}
        />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
```

**Sidebar — `src/components/shell/sidebar.tsx` (completo).** Azul-marinho `bg-brand-deep`, sticky full-height, `w-[232px]` ⇄ `w-16` com persistência em localStorage, seções com eyebrow uppercase, item ativo `bg-brand-sel` + branco + `font-semibold` + stroke 2:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icons';
import { BrandMark } from '@/components/brand/brand-mark';
import type { NavSection } from './nav';

interface SidebarProps {
  sections: NavSection[];
}

const STORAGE_KEY = 'sms.sidebar.collapsed';

function isActive(pathname: string, href: string): boolean {
  if (href === '/app') return pathname === '/app';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ sections }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === '1') setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  }

  return (
    <aside
      data-collapsed={collapsed || undefined}
      className={cn(
        'flex h-screen sticky top-0 shrink-0 flex-col bg-brand-deep text-brand-sidebarText transition-[width] duration-180',
        collapsed ? 'w-16' : 'w-[232px]',
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex items-center gap-2.5 border-b border-white/10',
          collapsed ? 'justify-center py-3.5' : 'justify-between px-4 py-3.5',
        )}
      >
        <Link href="/app" className="flex items-center gap-2.5">
          <BrandMark
            size={28}
            variant="onDark"
            withWordmark={!collapsed}
            wordmarkTone="light"
            eyebrow="Gestão SUS Municipal"
            display="Ibirapitanga - BA"
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="scrollbar-dark flex-1 overflow-y-auto px-2 py-2.5">
        {sections.map((section, sIdx) => (
          <div key={section.label ?? sIdx} className={sIdx > 0 ? 'mt-3' : ''}>
            {!collapsed && section.label && (
              <div className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[1px] text-brand-sidebarMuted">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group relative mb-0.5 flex items-center gap-2.5 rounded-md text-[13px] font-medium transition-colors duration-180',
                    collapsed ? 'justify-center px-0 py-2' : 'px-2.5 py-2',
                    active
                      ? 'bg-brand-sel text-white font-semibold'
                      : 'text-brand-sidebarText hover:bg-brand-hover hover:text-white',
                  )}
                  aria-current={active ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    name={item.icon}
                    size={17}
                    strokeWidth={active ? 2 : 1.7}
                    className="shrink-0"
                  />
                  {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-px text-[10px] font-bold text-white',
                        item.badge === '!' ? 'bg-danger' : 'bg-white/15',
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                  {collapsed && item.badge && (
                    <span
                      className={cn(
                        'absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full',
                        item.badge === '!' ? 'bg-danger' : 'bg-accent',
                      )}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-2.5">
        <button
          type="button"
          onClick={toggle}
          className="flex w-full items-center justify-center gap-2 rounded-md p-1.5 text-xs text-brand-sidebarMuted hover:text-white hover:bg-white/5 transition-colors duration-180"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={14} />
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </aside>
  );
}
```

**Estrutura da navegação — `src/components/shell/nav.ts`.** Grupos com eyebrow + itens com ícone e allowlist de papéis. Estrutura verbatim (labels/rotas são do domínio saúde — trocar pelo mapa da seção 5, mantendo o formato):

```ts
import type { IconName } from '@/components/ui/icons';

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  badge?: string;
  /** 'all' = visible to any authenticated staff, otherwise role allowlist. */
  roles: 'all' | readonly string[];
}

export interface NavSection {
  /** Eyebrow label shown in expanded sidebar (omit for first/unlabeled section). */
  label?: string;
  items: readonly NavItem[];
}

// Exemplo real (saúde) — 5 seções: Operação / Atendimento / Saúde pública / Rede / Sistema
export const NAV_SECTIONS: readonly NavSection[] = [
  {
    label: 'Operação',
    items: [
      { href: '/app', label: 'Dashboard', icon: 'dashboard', roles: 'all' },
      { href: '/app/cidadaos', label: 'Cidadãos', icon: 'users', roles: ['admin', 'manager', 'reception', 'nurse', 'doctor'] },
      { href: '/app/agenda', label: 'Agenda', icon: 'calendar', roles: ['admin', 'manager', 'reception', 'doctor', 'nurse'] },
      { href: '/app/regulacao', label: 'Regulação', icon: 'flask', roles: ['admin', 'manager', 'reception', 'doctor', 'nurse'] },
      { href: '/app/farmacia', label: 'Farmácia', icon: 'pill', roles: ['admin', 'manager', 'pharmacist'] },
      { href: '/app/vacinas', label: 'Vacinação', icon: 'syringe', roles: ['admin', 'manager', 'nurse'] },
    ],
  },
  {
    label: 'Atendimento',
    items: [
      { href: '/app/consultas', label: 'Consultas', icon: 'stethoscope', roles: ['admin', 'manager', 'doctor', 'nurse'] },
      { href: '/app/exames', label: 'Exames', icon: 'activity', roles: ['admin', 'manager', 'doctor', 'nurse'] },
      { href: '/app/receitas', label: 'Receitas', icon: 'file', roles: ['admin', 'manager', 'doctor', 'pharmacist'] },
      { href: '/app/dispensacoes', label: 'Dispensações', icon: 'archive', roles: ['admin', 'manager', 'pharmacist', 'doctor', 'nurse'] },
      { href: '/app/procedimentos', label: 'Procedimentos (BPA)', icon: 'creditCard', roles: ['admin', 'manager', 'reception', 'doctor', 'nurse'] },
      { href: '/app/encaminhamentos', label: 'Encaminhamentos', icon: 'arrowRight', roles: ['admin', 'manager', 'doctor', 'nurse', 'reception'] },
    ],
  },
  {
    label: 'Saúde pública',
    items: [
      { href: '/app/vigilancia/epidemiologica', label: 'Vig. Epidemiológica', icon: 'bug', roles: ['admin', 'manager', 'nurse', 'doctor'] },
      { href: '/app/vigilancia/sanitaria', label: 'Vig. Sanitária e Ambiental', icon: 'shield', roles: ['admin', 'manager', 'nurse', 'doctor'] },
      { href: '/app/mensagens', label: 'Mensagens', icon: 'speaker', roles: ['admin', 'manager'] },
      { href: '/app/relatorios', label: 'Relatórios', icon: 'chart', roles: ['admin', 'manager'] },
    ],
  },
  {
    label: 'Rede',
    items: [
      { href: '/app/unidades', label: 'Unidades', icon: 'location', roles: ['admin', 'manager'] },
      { href: '/app/profissionais', label: 'Profissionais', icon: 'user', roles: ['admin', 'manager'] },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/app/usuarios', label: 'Usuários', icon: 'key', roles: ['admin'] },
      { href: '/app/integracoes', label: 'Integrações', icon: 'layers', roles: ['admin'] },
      { href: '/app/auditoria', label: 'Auditoria', icon: 'eye', roles: ['admin'] },
      { href: '/app/configuracoes', label: 'Configurações', icon: 'settings', roles: ['admin'] },
    ],
  },
] as const;

/** Filter sections by role, dropping empty sections. */
export function filterNavForRole(role: string | undefined): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => item.roles === 'all' || (role && item.roles.includes(role)),
    ),
  })).filter((s) => s.items.length > 0);
}
```

**Topbar — `src/components/shell/topbar.tsx` (completo).** 56px, sticky, branca com borda hairline inferior. Título da página NÃO fica aqui (fica no PageWrap):

```tsx
import { Icon } from '@/components/ui/icons';
import { TopbarSearch } from './topbar-search';
import { UserMenu } from './user-menu';

export interface TopbarProps {
  userName: string;
  userRoleLabel: string;
  userEmail?: string;
  hasNotifications?: boolean;
}

/**
 * Topbar — fixed 56px bar with global search, quick actions and user menu.
 * Page titles are rendered inside <PageWrap> in each route, not here.
 */
export function Topbar({ userName, userRoleLabel, userEmail, hasNotifications }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-b border-hairline bg-surface-card px-5">
      <div className="flex-1" />
      <TopbarSearch />

      <button
        type="button"
        className="relative flex h-[34px] w-[34px] items-center justify-center rounded-md border border-hairline bg-surface-card text-ink-2 transition-colors duration-180 hover:bg-surface-alt"
        aria-label="Notificações"
      >
        <Icon name="bell" size={16} />
        {hasNotifications && (
          <span className="absolute right-1.5 top-1.5 h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-danger" />
        )}
      </button>
      <button
        type="button"
        className="flex h-[34px] w-[34px] items-center justify-center rounded-md border border-hairline bg-surface-card text-ink-2 transition-colors duration-180 hover:bg-surface-alt"
        aria-label="Configurações rápidas"
      >
        <Icon name="settings" size={16} />
      </button>

      <div className="ml-1.5 border-l border-hairline pl-3">
        <UserMenu name={userName} roleLabel={userRoleLabel} email={userEmail} />
      </div>
    </header>
  );
}
```

**Busca global — `src/components/shell/topbar-search.tsx` (completo):**

```tsx
'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/icons';

export function TopbarSearch() {
  const [value, setValue] = useState('');
  return (
    <div className="flex h-9 w-[320px] items-center gap-2 rounded-md border border-hairline bg-surface-elev px-3">
      <Icon name="search" size={15} className="text-ink-muted" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar paciente, CPF, CNS, profissional…"
        className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-soft"
        aria-label="Busca global"
      />
      <kbd className="rounded border border-hairline bg-white px-1.5 py-px font-mono text-[10px] text-ink-muted">
        ⌘K
      </kbd>
    </div>
  );
}
```

**Menu do usuário — `src/components/shell/user-menu.tsx` (completo).** Dropdown feito à mão (sem Radix): fecha em clique-fora e Escape; item "Sair" em vermelho:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icons';

export interface UserMenuProps {
  name: string;
  roleLabel: string;
  email?: string;
}

export function UserMenu({ name, roleLabel, email }: UserMenuProps) {
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
          <div className="text-[12.5px] font-semibold tracking-[-0.1px] text-ink">{name}</div>
          <div className="text-[11px] text-ink-muted">{roleLabel}</div>
        </div>
        <Avatar name={name} size={34} />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute right-0 top-[calc(100%+6px)] z-50 w-60 rounded-md border border-hairline bg-white shadow-lg overflow-hidden',
          )}
        >
          <div className="px-3 py-2.5 border-b border-hairline">
            <div className="text-[13px] font-semibold text-ink">{name}</div>
            <div className="text-[11.5px] text-ink-muted">{roleLabel}</div>
            {email && <div className="mt-0.5 text-[11px] text-ink-soft truncate">{email}</div>}
          </div>
          <Link
            href="/app/perfil"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-2 hover:bg-surface-alt transition-colors duration-180"
          >
            <Icon name="user" size={14} />
            Meu perfil
          </Link>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-danger hover:bg-danger-soft transition-colors duration-180"
            >
              <Icon name="arrowRight" size={14} />
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
```

**Marca — `src/components/brand/brand-mark.tsx` (completo).** O logo é **SVG construído em código** (quadrado 14px de raio com cruz + linha de "batimento"; em educação, substituir o miolo por um símbolo próprio mantendo a MESMA estrutura: quadrado arredondado + símbolo + wordmark com eyebrow uppercase e nome em Fraunces):

```tsx
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

export function BrandMark({
  size = 28,
  variant = 'onDark',
  withWordmark = false,
  wordmarkTone = 'light',
  eyebrow = 'Gestão SUS Municipal',
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
        <rect x="27" y="10" width="10" height="44" rx="3" fill="#fff" />
        <rect x="10" y="27" width="44" height="10" rx="3" fill="rgba(255,255,255,0.78)" />
        <path
          d="M6 38 L18 38 L22 30 L28 46 L34 22 L40 38 L58 38"
          stroke="#0C3FA0"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="32" cy="32" r="3.4" fill="#0C3FA0" />
        <circle cx="32" cy="32" r="1.6" fill="#fff" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="2" y="2" width="60" height="60" rx="14" fill="#fff" />
      <rect x="27" y="10" width="10" height="44" rx="3" fill="#0C3FA0" />
      <rect x="10" y="27" width="44" height="10" rx="3" fill="#2670E8" />
      <path
        d="M6 38 L18 38 L22 30 L28 46 L34 22 L40 38 L58 38"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="32" cy="32" r="3.4" fill="#fff" />
      <circle cx="32" cy="32" r="1.6" fill="#0C3FA0" />
    </svg>
  );
}
```

### 3.12 Tela de login — `src/app/login/page.tsx` (página completa)

Split-screen: painel esquerdo azul-marinho (`#0A2761` — navy próprio da tela de login, um degrau mais **claro/vivo** que `brand-deep` `#062654`) com grid sutil + gradiente radial, logo grande, headline serifada 40px com última linha em `#9DBFF8`, 3 estatísticas institucionais; painel direito branco com o formulário (max-w 380px). Os números/textos do painel esquerdo são **copy ilustrativa**, não dados reais — trocar pelo domínio de destino. *(Duas strings foram genericizadas em relação ao original: o placeholder de e-mail e o nome do fornecedor no rodapé — substitua pelos do sistema de destino.)*

```tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BrandMark } from '@/components/brand/brand-mark';

const REMEMBER_KEY = 'sms.login.rememberedEmail';

function buildRedirectTarget(params: URLSearchParams) {
  const next = params.get('next') ?? '/app';
  const extra = new URLSearchParams(params);
  extra.delete('next');
  extra.delete('error');

  if (!extra.toString()) return next;

  try {
    const url = new URL(next, window.location.origin);
    if (url.origin !== window.location.origin) return '/app';
    for (const [key, value] of extra.entries()) {
      if (!url.searchParams.has(key)) url.searchParams.set(key, value);
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/app';
  }
}

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recupera e-mail memorizado no primeiro render.
  useEffect(() => {
    if (typeof window === 'undefined') return;
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

    // Login via Route Handler no servidor (cookie de sessão gravado
    // sincronamente antes do redirect) — adaptar ao backend de destino.
    let res: Response;
    try {
      res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      setError('Falha de rede. Tente novamente.');
      setLoading(false);
      return;
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? 'Falha ao autenticar.');
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

    const next = buildRedirectTarget(params);
    window.location.assign(next);
  }

  const staffOnlyError = params.get('error') === 'staff_only';

  return (
    <div className="min-h-screen flex font-sans bg-surface text-ink">
      {/* ── Left · brand panel ─────────────────────────────────── */}
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
                Gestão SUS Municipal
              </div>
              <div className="font-display text-[18px] font-semibold tracking-tight">
                Ibirapitanga - BA
              </div>
              <div className="text-[10px] tracking-[0.4px] uppercase text-white/45 mt-0.5">
                Sistema integrado de saúde pública
              </div>
            </div>
          </div>

          <div className="flex-1" />

          <div className="relative max-w-[460px]">
            <div className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-[0.4px] mb-[18px] bg-white/[0.08] border border-white/[0.12]">
              Painel de gestão · acesso restrito
            </div>
            <h1 className="m-0 font-display text-[40px] font-medium tracking-[-1px] leading-[1.05]">
              Saúde pública,
              <br />
              <span style={{ color: '#9DBFF8' }}>gerida com clareza.</span>
            </h1>
            <p className="mt-4 mb-0 text-[14.5px] leading-[1.55] max-w-[420px] text-white/70">
              Acompanhe atendimentos, regulação, estoque e vigilância em tempo real
              em todas as unidades de Ibirapitanga.
            </p>
          </div>

          <div className="relative mt-9 grid grid-cols-3 gap-[22px] max-w-[460px]">
            {[
              { v: '14.382', l: 'Pacientes ativos' },
              { v: '11', l: 'Unidades de saúde' },
              { v: '99,4%', l: 'Disponibilidade' },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-[24px] font-medium tracking-[-0.4px]">{s.v}</div>
                <div className="text-[11px] text-white/60 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="relative mt-9 text-[11px] flex justify-between text-white/45">
            <span>Prefeitura de Ibirapitanga · Secretaria Municipal de Saúde</span>
            <span>v 4.7.2</span>
          </div>
        </div>
      </div>

      {/* ── Right · login form ─────────────────────────────────── */}
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

          {staffOnlyError && (
            <div className="mb-4 text-sm bg-danger-soft text-danger rounded-md p-3">
              Acesso negado. Este painel é restrito a servidores da SMS.
            </div>
          )}

          {/* E-mail / matrícula */}
          <Field label="E-mail ou matrícula">
            <InputBox active={!!email}>
              <UserIcon />
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.nome@municipio.gov.br"
                className="flex-1 border-0 outline-none bg-transparent font-sans text-[13.5px] text-ink placeholder:text-ink-soft"
              />
            </InputBox>
          </Field>

          {/* Senha */}
          <Field
            label="Senha"
            right={
              <button
                type="button"
                className="bg-transparent border-0 p-0 cursor-pointer font-sans text-[11.5px] font-semibold text-brand-600"
              >
                Esqueci minha senha
              </button>
            }
          >
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
              className="sr-only peer"
            />
            <span
              className="
                w-4 h-4 rounded border-[1.5px] border-hairline-strong bg-white
                flex items-center justify-center
                peer-checked:bg-brand-600 peer-checked:border-brand-600
                transition-colors
              "
            >
              <svg
                className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12l5 5L20 7" />
              </svg>
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
              Sistema homologado e implantado pela{' '}
              <b>{'<Fornecedor do sistema>'}</b>; em caso de dificuldades
              de acesso solicite suporte.
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

// ── Icons ───────────────────────────────────────────────────────
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">Carregando...</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
```

### 3.13 Dashboard home — `src/app/app/page.tsx` (página completa)

4 KPIs → linha 2/3+1/3 (gráfico grande + lista de alertas) → linha 3/5+2/5 (tabela de performance + fila com barras) → linha 1/2+1/2 (duas listas com números display). Os widgets marcados com `useMockData` são **placeholders ilustrativos** (dados fictícios) — no destino, ligar a dados reais equivalentes. O gráfico grande é SVG desenhado à mão com grid tracejado (`strokeDasharray '2 3'`), eixos em `font-mono` 10px e 3 séries (`chart-1`, `info`, `warning`).

```tsx
import { PageWrap } from '@/components/ui/page-wrap';
import { KpiCard } from '@/components/ui/kpi-card';
import { Panel } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon, type IconName } from '@/components/ui/icons';

const COLORS = {
  brand: '#1351B4',
  info: '#1F6FB2',
  warning: '#D97706',
  danger: '#C8391F',
  success: '#0F8A5F',
  accent: '#D97706',
  muted: '#6E7B92',
  hairline: '#E1E5EC',
  teal: '#3B86A8',
};

export default async function OverviewPage() {
  const stats = await getStats(); // contagens reais do backend

  // Sparkline paths (12 pts) — visual only
  const sp1 = 'M0 22 L9 19 L18 20 L27 16 L36 17 L45 13 L54 11 L63 14 L72 9 L81 8 L90 5 L100 6';
  const sp2 = 'M0 12 L9 14 L18 11 L27 16 L36 13 L45 18 L54 14 L63 19 L72 16 L81 21 L90 18 L100 22';
  const sp3 = 'M0 18 L9 16 L18 17 L27 14 L36 16 L45 12 L54 14 L63 11 L72 13 L81 9 L90 11 L100 8';
  const sp4 = 'M0 14 L9 17 L18 13 L27 19 L36 15 L45 21 L54 17 L63 23 L72 19 L81 25 L90 21 L100 26';

  return (
    <PageWrap
      title="Visão geral"
      breadcrumb={[{ label: 'Início' }, { label: 'Dashboard executivo' }]}
      actions={
        <>
          <Button variant="outline" size="sm" icon="calendar">
            Abr 2026
          </Button>
          <Button variant="outline" size="sm" icon="download">
            Exportar
          </Button>
          <Button size="sm" icon="refresh">
            Atualizar
          </Button>
        </>
      }
    >
      {/* KPIs (live counts) */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Cidadãos cadastrados"
          value={stats.citizens.toLocaleString('pt-BR')}
          delta="+312"
          deltaPos="up"
          sparkline={sp1}
          color={COLORS.brand}
          icon="users"
        />
        <KpiCard
          label="Consultas hoje"
          value={stats.todayAppts.toLocaleString('pt-BR')}
          delta="+8,4%"
          deltaPos="up"
          sparkline={sp4}
          color={COLORS.info}
          icon="stethoscope"
        />
        <KpiCard
          label="Exames em andamento"
          value={stats.pendingExams.toLocaleString('pt-BR')}
          delta="−4"
          deltaPos="up"
          sparkline={sp3}
          color={COLORS.teal}
          icon="flask"
        />
        <KpiCard
          label="Unidades ativas"
          value={stats.activeUnits.toLocaleString('pt-BR')}
          delta="0"
          deltaPos="flat"
          sparkline={sp2}
          color={COLORS.warning}
          icon="location"
        />
      </div>

      {/* Atendimentos + Alertas */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Atendimentos diários · últimos 30 dias"
            headerRight={
              <div className="flex items-center gap-3 text-[11px] font-medium text-ink-muted">
                <LegendDot color={COLORS.brand} label="UBS" />
                <LegendDot color={COLORS.info} label="Especialistas" />
                <LegendDot color={COLORS.warning} label="Emergência" />
              </div>
            }
          >
            <DailyChart />
          </Panel>
        </div>
        <Panel title="Alertas ativos" action="Ver todos">
          <div className="-mt-2">
            <AlertItem tone="danger" icon="warning" title="Estoque crítico" sub="Insulina NPH · UBS Centro" time="há 2h" />
            <AlertItem tone="warning" icon="bug" title="Surto de dengue" sub="Bairro Vila das Flores · 14 casos" time="há 5h" />
            <AlertItem tone="info" icon="users" title="Fila de regulação" sub="32 pacientes aguardando > 30 dias" time="hoje" />
            <AlertItem tone="warning" icon="clock" title="Equipe reduzida" sub="UBS Norte · 2 ausências" time="hoje" />
            <AlertItem tone="info" icon="syringe" title="Campanha gripe" sub="UBS Sul atingiu 80% da meta" time="ontem" last />
          </div>
        </Panel>
      </div>

      {/* Performance UBS + Regulação */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Panel
            title="Performance por UBS"
            headerRight={
              <div className="flex items-center gap-1">
                {['Atendimento', 'Espera', 'Adesão'].map((t, i) => (
                  <button
                    key={t}
                    type="button"
                    className={
                      i === 0
                        ? 'rounded-sm bg-brand-soft px-2.5 py-1 text-[11.5px] font-semibold text-brand-700'
                        : 'rounded-sm px-2.5 py-1 text-[11.5px] font-semibold text-ink-muted hover:bg-surface-alt'
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
            }
            pad={false}
          >
            <UBSTable />
          </Panel>
        </div>
        <div className="lg:col-span-2">
          <Panel title="Regulação · fila" action="Ver fila" pad={false}>
            <RegulationStack />
          </Panel>
        </div>
      </div>

      {/* Doenças + Estoque */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Panel title="Doenças notificáveis · semana 17">
          <DiseaseList />
        </Panel>
        <Panel title="Estoque crítico" action="Gerenciar">
          <StockList />
        </Panel>
      </div>
    </PageWrap>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function AlertItem({
  tone,
  icon,
  title,
  sub,
  time,
  last,
}: {
  tone: 'danger' | 'warning' | 'info';
  icon: IconName;
  title: string;
  sub: string;
  time: string;
  last?: boolean;
}) {
  const palette = {
    danger: { fg: COLORS.danger, bg: '#FCEAE4' },
    warning: { fg: COLORS.warning, bg: '#FCEED2' },
    info: { fg: COLORS.info, bg: '#E2EEF8' },
  }[tone];
  return (
    <div className={'flex items-start gap-3 py-[11px] ' + (last ? '' : 'border-b border-hairline')}>
      <div
        className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-md"
        style={{ background: palette.bg, color: palette.fg }}
      >
        <Icon name={icon} size={15} strokeWidth={1.9} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-semibold text-ink tracking-[-0.05px]">{title}</div>
        <div className="mt-0.5 text-[11.5px] text-ink-muted">{sub}</div>
      </div>
      <div className="whitespace-nowrap text-[10.5px] font-medium text-ink-soft">{time}</div>
    </div>
  );
}

function DailyChart() {
  const W = 720;
  const H = 240;
  const pad = { l: 40, r: 12, t: 12, b: 28 };
  const days = 30;
  const seed = (n: number, base: number, amp: number, off: number) =>
    Array.from(
      { length: days },
      (_, i) => base + Math.sin(i / 4 + off) * amp + (((i * 17 + n * 7) % 11) - 5) * 2,
    );
  const s1 = seed(1, 140, 18, 0);
  const s2 = seed(2, 75, 12, 1);
  const s3 = seed(3, 22, 8, 2);
  const all = [...s1, ...s2, ...s3];
  const max = Math.max(...all) * 1.1;
  const min = 0;
  const x = (i: number) => pad.l + (i / (days - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
  const path = (s: number[]) =>
    s.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = (s: number[]) => `${path(s)} L${x(days - 1)} ${H - pad.b} L${pad.l} ${H - pad.b} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={240} className="block">
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <g key={i}>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={pad.t + p * (H - pad.t - pad.b)}
            y2={pad.t + p * (H - pad.t - pad.b)}
            stroke={COLORS.hairline}
            strokeWidth={1}
            strokeDasharray={p === 1 ? '0' : '2 3'}
          />
          <text
            x={pad.l - 6}
            y={pad.t + p * (H - pad.t - pad.b) + 3}
            textAnchor="end"
            fontSize={10}
            fill={COLORS.muted}
            className="font-mono"
          >
            {Math.round(max - p * max)}
          </text>
        </g>
      ))}
      {[1, 7, 14, 21, 28].map((d) => (
        <text
          key={d}
          x={x(d - 1)}
          y={H - 8}
          textAnchor="middle"
          fontSize={10}
          fill={COLORS.muted}
          className="font-mono"
        >
          {String(d).padStart(2, '0')}/04
        </text>
      ))}
      <path d={area(s1)} fill={COLORS.brand} opacity={0.07} />
      <path d={path(s1)} fill="none" stroke={COLORS.brand} strokeWidth={2} />
      <path d={path(s2)} fill="none" stroke={COLORS.info} strokeWidth={2} />
      <path d={path(s3)} fill="none" stroke={COLORS.warning} strokeWidth={2} />
      <g transform={`translate(${x(20)} ${y(s1[20]!)})`}>
        <circle r={4} fill="#fff" stroke={COLORS.brand} strokeWidth={2} />
      </g>
    </svg>
  );
}

function UBSTable() {
  const rows: Array<{ u: string; e: number; w: number; a: number; t: 'up' | 'down' | 'flat' }> = [
    { u: 'UBS Centro', e: 426, w: 12, a: 92, t: 'up' },
    { u: 'UBS Jardim São João', e: 384, w: 16, a: 89, t: 'up' },
    { u: 'UBS Vila das Flores', e: 312, w: 24, a: 78, t: 'down' },
    { u: 'UBS Zona Norte', e: 298, w: 22, a: 84, t: 'flat' },
    { u: 'UBS Bela Vista', e: 271, w: 19, a: 81, t: 'up' },
    { u: 'UBS Santo Antônio', e: 244, w: 28, a: 73, t: 'down' },
    { u: 'UBS Vila Nova', e: 219, w: 14, a: 88, t: 'up' },
  ];
  const max = Math.max(...rows.map((r) => r.e));
  const th =
    'border-b border-hairline px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.6px] text-ink-muted';
  return (
    <table className="w-full border-collapse text-[12.5px]">
      <thead>
        <tr className="bg-surface-alt">
          <th className={th + ' w-[40%]'}>Unidade</th>
          <th className={th}>Atend.</th>
          <th className={th}>Espera</th>
          <th className={th}>Adesão</th>
          <th className={th + ' w-[24%]'}>Mensal</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const trendColor = r.t === 'down' ? COLORS.danger : r.t === 'flat' ? COLORS.muted : COLORS.success;
          const adherenceColor = r.a > 85 ? COLORS.success : r.a > 75 ? COLORS.warning : COLORS.danger;
          return (
            <tr key={r.u} className="border-t border-hairline">
              <td className="px-4 py-3 align-middle font-medium text-ink">
                <div className="flex items-center gap-2">
                  <Icon name="location" size={13} className="text-ink-muted" />
                  {r.u}
                </div>
              </td>
              <td className="px-4 py-3 align-middle font-mono font-semibold text-ink-2">{r.e}</td>
              <td className="px-4 py-3 align-middle">
                <Badge tone={r.w > 20 ? 'warning' : 'neutral'} size="sm">
                  {r.w} min
                </Badge>
              </td>
              <td className="px-4 py-3 align-middle">
                <div className="flex items-center gap-2">
                  <div className="h-1 min-w-[60px] flex-1 overflow-hidden rounded-sm bg-surface">
                    <div className="h-full" style={{ width: `${r.a}%`, background: adherenceColor }} />
                  </div>
                  <span className="font-mono text-[12px] font-semibold text-ink-2">{r.a}%</span>
                </div>
              </td>
              <td className="px-4 py-3 align-middle">
                <svg viewBox="0 0 100 24" width="100%" height={24} preserveAspectRatio="none">
                  <path
                    d={Array.from(
                      { length: 8 },
                      (_, j) => `${j ? 'L' : 'M'}${j * 14},${20 - ((Math.sin(j + i) + 1) * 8 + (r.e / max) * 4)}`,
                    ).join(' ')}
                    fill="none"
                    stroke={trendColor}
                    strokeWidth={1.5}
                  />
                </svg>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function RegulationStack() {
  const items = [
    { e: 'Cardiologia', n: 8, dias: 42, c: COLORS.danger },
    { e: 'Ortopedia', n: 6, dias: 38, c: COLORS.warning },
    { e: 'Endoscopia', n: 5, dias: 28, c: COLORS.warning },
    { e: 'Oftalmologia', n: 4, dias: 21, c: COLORS.accent },
    { e: 'Ressonância magnética', n: 4, dias: 19, c: COLORS.accent },
    { e: 'Dermatologia', n: 3, dias: 14, c: COLORS.success },
    { e: 'Endocrinologia', n: 2, dias: 11, c: COLORS.success },
  ];
  const max = Math.max(...items.map((i) => i.n));
  return (
    <div>
      {items.map((it, i) => (
        <div
          key={it.e}
          className={
            'grid grid-cols-[1fr_auto] items-center gap-2 px-[18px] py-3 ' +
            (i === items.length - 1 ? '' : 'border-b border-hairline')
          }
        >
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-[12.5px] font-medium text-ink">{it.e}</span>
              <span className="font-mono text-[11px] font-semibold text-ink-muted">{it.dias}d médios</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-sm bg-surface">
              <div className="h-full" style={{ width: `${(it.n / max) * 100}%`, background: it.c }} />
            </div>
          </div>
          <span className="ml-2 min-w-[26px] text-right font-display text-[18px] font-semibold tracking-[-0.3px] text-ink">
            {it.n}
          </span>
        </div>
      ))}
    </div>
  );
}

function DiseaseList() {
  const items = [
    { d: 'Dengue', n: 47, prev: 31, c: COLORS.danger },
    { d: 'COVID-19', n: 12, prev: 18, c: COLORS.info },
    { d: 'Sífilis', n: 8, prev: 7, c: COLORS.warning },
    { d: 'Tuberculose', n: 3, prev: 4, c: COLORS.muted },
    { d: 'Hanseníase', n: 1, prev: 1, c: COLORS.muted },
  ];
  return (
    <div className="-mt-2">
      {items.map((it, i) => {
        const delta = it.n - it.prev;
        return (
          <div
            key={it.d}
            className={
              'grid grid-cols-[1fr_auto_auto_auto] items-center gap-3.5 py-[11px] ' +
              (i === items.length - 1 ? '' : 'border-b border-hairline')
            }
          >
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full" style={{ background: it.c }} />
              <span className="text-[13px] font-medium text-ink">{it.d}</span>
            </div>
            <span className="font-display text-[22px] font-medium tracking-[-0.4px] text-ink">{it.n}</span>
            <span className="min-w-[40px] text-right font-mono text-[11px] text-ink-muted">ant. {it.prev}</span>
            <Badge tone={delta > 0 ? 'danger' : delta < 0 ? 'success' : 'neutral'} size="sm">
              {delta > 0 ? `+${delta}` : delta}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

function StockList() {
  const items = [
    { m: 'Insulina NPH 100UI', u: 'UBS Centro', n: 4, full: 60, c: COLORS.danger, status: 'Crítico' as const },
    { m: 'Losartana 50mg', u: 'Farmácia Central', n: 28, full: 200, c: COLORS.warning, status: 'Baixo' as const },
    { m: 'Dipirona 500mg', u: 'UBS Norte', n: 45, full: 300, c: COLORS.warning, status: 'Baixo' as const },
    { m: 'Amoxicilina 500mg', u: 'UBS Sul', n: 12, full: 150, c: COLORS.danger, status: 'Crítico' as const },
    { m: 'Metformina 850mg', u: 'Farmácia Central', n: 89, full: 400, c: COLORS.warning, status: 'Baixo' as const },
  ];
  return (
    <div className="-mt-2">
      {items.map((it, i) => (
        <div key={it.m} className={'py-3 ' + (i === items.length - 1 ? '' : 'border-b border-hairline')}>
          <div className="mb-1.5 flex items-baseline justify-between">
            <div>
              <div className="text-[13px] font-semibold text-ink">{it.m}</div>
              <div className="mt-0.5 text-[11px] text-ink-muted">{it.u}</div>
            </div>
            <Badge tone={it.status === 'Crítico' ? 'danger' : 'warning'} size="sm" dot>
              {it.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-surface">
              <div className="h-full" style={{ width: `${(it.n / it.full) * 100}%`, background: it.c }} />
            </div>
            <span className="min-w-[60px] text-right font-mono text-[11px] font-semibold text-ink-2">
              {it.n} / {it.full}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

*(Nota: no código original, cada widget é condicionado a `useMockData` e cai num `EmptyWidget` quando não há dados — padrão mostrado na seção 3.10.)*

### 3.14 Página de listagem/CRUD — `src/app/app/cidadaos/page.tsx` (página completa)

A listagem canônica: Server Component com filtros/busca/paginação **via URL search params** (sem estado client), toolbar em Panel (busca + botão Filtros + toggle grid/lista), chips de filtro `rounded-full` (ativo = azul cheio), 3 mini-stats, grid de cards clicáveis 1/2/3 colunas, paginação Anterior/Próxima. Trocar entidades (cidadão→aluno, UBS→escola) mantendo classes.

```tsx
import Link from 'next/link';
import { PageWrap } from '@/components/ui/page-wrap';
import { Panel } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icons';
import { ExportCsvButton } from '@/components/ui/export-csv-button';

type Row = {
  id: string;
  full_name: string;
  birth_date: string;
  sex: string | null;
  cpf_last4: string;
  phone: string | null;
  reference_unit_id: string | null;
  data_source: string;
};

const FILTERS = [
  { k: 'todos', l: 'Todos' },
  { k: 'pec', l: 'Importados PEC' },
  { k: 'app', l: 'Cadastrados no app' },
  { k: 'idosos', l: 'Idosos 60+' },
  { k: 'criancas', l: 'Crianças' },
  { k: 'gestantes', l: 'Gestantes' },
] as const;

type SourceTone = 'primary' | 'success' | 'neutral' | 'info';

const PAGE_SIZE = 30;

function ageFrom(birth: string): number {
  const b = new Date(birth);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

export default async function CitizensPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? '';
  const filter = sp.filter ?? 'todos';
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  // ... consulta ao backend com q/filter/page (adaptar à fonte de dados de destino);
  // produz: rows (página atual), total, e contadores agregados pecCount/appCount ...

  return (
    <PageWrap
      title="Cidadãos"
      breadcrumb={[{ label: 'Cadastros' }]}
      actions={
        <>
          <ExportCsvButton
            filename={`cidadaos-${new Date().toISOString().slice(0, 10)}`}
            rows={(rows ?? []).map((r) => ({
              Nome: r.full_name,
              Nascimento: r.birth_date,
              Sexo: r.sex,
              CPF: `***.***.***-${r.cpf_last4}`,
              Telefone: r.phone,
              Origem: r.data_source,
            }))}
          />
          <Button variant="outline" size="sm" icon="upload">
            Importar CNS
          </Button>
          <Button size="sm" icon="plus">
            Novo cadastro
          </Button>
        </>
      }
    >
      {/* Toolbar */}
      <Panel>
        <form method="get" className="flex items-center gap-2">
          <div className="flex h-9 flex-1 items-center gap-2 rounded-md border border-hairline bg-surface-elev px-3">
            <Icon name="search" size={15} className="text-ink-muted" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Nome, CPF, CNS, telefone…"
              className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-soft"
            />
            {filter !== 'todos' && <input type="hidden" name="filter" value={filter} />}
          </div>
          <Button type="submit" variant="outline" size="sm" icon="filter">
            Filtros
          </Button>
          <div className="h-6 w-px bg-hairline" />
          <Button variant="outline" size="sm" icon="grid" aria-label="Grid" />
          <Button variant="ghost" size="sm" icon="list" aria-label="Lista" />
        </form>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f.k;
            const params = new URLSearchParams();
            if (q) params.set('q', q);
            if (f.k !== 'todos') params.set('filter', f.k);
            const href = `/app/cidadaos${params.toString() ? `?${params.toString()}` : ''}`;
            return (
              <Link
                key={f.k}
                href={href}
                className={
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors duration-180 ' +
                  (active
                    ? 'border-brand bg-brand text-white'
                    : 'border-hairline-strong bg-surface text-ink-2 hover:bg-surface-alt')
                }
              >
                {f.l}
              </Link>
            );
          })}
        </div>
      </Panel>

      {/* Resumo de origem dos dados */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SourceStat
          tone="primary"
          label="Importados do PEC"
          value={pecCount}
          help="Pacientes vindos do prontuário do município"
        />
        <SourceStat
          tone="success"
          label="Cadastrados no app"
          value={appCount}
          help="Cidadãos que se cadastraram via aplicativo"
        />
        <SourceStat
          tone="neutral"
          label="Total ativo"
          value={pecCount + appCount}
          help="Soma das origens (sem soft-delete)"
        />
      </div>

      {/* Header line */}
      <div className="flex items-baseline justify-between">
        <div className="text-[12.5px] text-ink-muted">
          Mostrando <b className="text-ink">{rows?.length ?? 0}</b> de{' '}
          <b className="text-ink">{(total ?? 0).toLocaleString('pt-BR')}</b> cidadãos
          {filter !== 'todos' && <span className="ml-1">· filtro <b>{filter}</b></span>}
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-ink-muted">
          Ordenar:
          <button
            type="button"
            className="inline-flex items-center gap-1 font-semibold text-ink-2 hover:text-ink"
          >
            Nome
            <Icon name="chevronDown" size={12} />
          </button>
        </div>
      </div>

      {/* Cards grid */}
      {rows && rows.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => {
            const age = ageFrom(r.birth_date);
            const ubs = /* nome da unidade de referência do registro */ 'UBS de referência';
            const sourceTone: SourceTone =
              r.data_source === 'pec'
                ? 'primary'
                : r.data_source === 'app'
                  ? 'success'
                  : r.data_source === 'merged'
                    ? 'neutral'
                    : 'info';
            return (
              <Link
                key={r.id}
                href={`/app/cidadaos/${r.id}`}
                className="group relative block rounded-md border border-hairline bg-surface p-4 shadow-card-sm transition-colors duration-180 hover:border-brand-300 hover:shadow-card"
              >
                <div className="flex gap-3">
                  <Avatar name={r.full_name} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold leading-tight tracking-[-0.1px] text-ink">
                      {r.full_name}
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-ink-muted">
                      {age} anos · {r.sex === 'F' ? 'F' : r.sex === 'M' ? 'M' : '—'} · CPF ***-{r.cpf_last4}
                    </div>
                  </div>
                  <Badge tone={sourceTone} size="sm">
                    {r.data_source}
                  </Badge>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 rounded-sm bg-surface-elev px-2.5 py-2">
                  <Icon name="location" size={12} className="text-ink-muted" />
                  <span className="truncate text-[11.5px] text-ink-2">{ubs}</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-hairline pt-2.5">
                  <span className="text-[11px] text-ink-muted">
                    Telefone <b className="font-semibold text-ink-2">{r.phone ?? '—'}</b>
                  </span>
                  <Icon name="chevron" size={13} className="text-ink-muted group-hover:text-brand" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <Panel>
          <div className="py-10 text-center text-[13px] text-ink-muted">
            {q ? `Nenhum cidadão encontrado para "${q}".` : 'Nenhum cidadão cadastrado.'}
          </div>
        </Panel>
      )}

      {/* Paginação */}
      {total !== null && total !== undefined && total > PAGE_SIZE && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          q={q}
          filter={filter}
        />
      )}
    </PageWrap>
  );
}

function SourceStat({
  tone,
  label,
  value,
  help,
}: {
  tone: 'primary' | 'success' | 'neutral';
  label: string;
  value: number;
  help: string;
}) {
  const dotColor =
    tone === 'primary'
      ? 'bg-brand'
      : tone === 'success'
        ? 'bg-success'
        : 'bg-ink-muted';
  return (
    <div className="rounded-md border border-hairline bg-surface p-3.5 shadow-card-sm">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.6px] text-ink-muted">
          {label}
        </span>
      </div>
      <div className="mt-1 font-display text-[26px] font-medium tracking-[-0.4px] text-ink">
        {value.toLocaleString('pt-BR')}
      </div>
      <div className="mt-0.5 text-[11.5px] text-ink-muted">{help}</div>
    </div>
  );
}

function Pagination({
  page,
  pageSize,
  total,
  q,
  filter,
}: {
  page: number;
  pageSize: number;
  total: number;
  q: string;
  filter: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (filter !== 'todos') params.set('filter', filter);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return `/app/cidadaos${qs ? `?${qs}` : ''}`;
  };
  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);
  return (
    <div className="flex items-center justify-between border-t border-hairline pt-3 text-[12.5px] text-ink-muted">
      <div>
        Página <b className="text-ink">{page}</b> de{' '}
        <b className="text-ink">{totalPages.toLocaleString('pt-BR')}</b>
      </div>
      <div className="flex items-center gap-1.5">
        <Link
          href={buildHref(prev)}
          aria-disabled={page <= 1}
          className={
            'inline-flex items-center gap-1 rounded-md border border-hairline px-3 py-1.5 text-[12.5px] font-semibold transition-colors duration-180 ' +
            (page <= 1
              ? 'pointer-events-none opacity-40'
              : 'bg-surface text-ink-2 hover:bg-surface-alt')
          }
        >
          <Icon name="chevronLeft" size={13} /> Anterior
        </Link>
        <Link
          href={buildHref(next)}
          aria-disabled={page >= totalPages}
          className={
            'inline-flex items-center gap-1 rounded-md border border-hairline px-3 py-1.5 text-[12.5px] font-semibold transition-colors duration-180 ' +
            (page >= totalPages
              ? 'pointer-events-none opacity-40'
              : 'bg-surface text-ink-2 hover:bg-surface-alt')
          }
        >
          Próxima <Icon name="chevronRight" size={13} />
        </Link>
      </div>
    </div>
  );
}
```

> ⚠️ **Bug conhecido no original:** as classes `shadow-card-sm` e `shadow-card` usadas nos cards desta página **não existem** no tailwind.config (que define apenas `shadow-sm/md/lg`) — elas não geram sombra alguma. Na réplica, usar `shadow-sm` no repouso e `hover:shadow-md` no hover.

### 3.15 Dialog/Modal — `src/app/app/regulacao/_components/new-request-dialog.tsx` (completo)

Padrão **canônico** de modal do app: **Radix Dialog puro** (sem wrapper shadcn). Overlay `bg-black/45`, painel centrado com translate, `rounded-md`, `shadow-xl`, header com título 15px + descrição 12px + botão X, corpo rolável. Sem animação de entrada. (No original coexiste um segundo padrão de modal feito com `useState` — sem portal, sem focus-trap, sem Escape, overlay `bg-black/40` — que **não** deve ser replicado; ver §5.2, item 6.)

```tsx
'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icons';
import { NewRequestForm } from './new-request-form';

type Option = { id: string; label: string; detail?: string | null };

interface NewRequestDialogProps {
  units: Option[];
  procedures: Option[];
  triggerClassName?: string;
  full?: boolean;
}

export function NewRequestDialog({ units, procedures, triggerClassName, full }: NewRequestDialogProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button size="sm" icon="plus" className={triggerClassName} full={full}>
          Nova solicitação
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[88vh] w-[min(980px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 flex-col rounded-md border border-hairline bg-white shadow-xl focus:outline-none">
          <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
            <div>
              <Dialog.Title className="text-[15px] font-semibold text-ink">Nova solicitação regulatória</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-[12px] text-ink-muted">
                Busque o paciente, vincule uma requisição clínica e confirme os dados regulatórios.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" aria-label="Fechar" className="rounded-sm p-1.5 text-ink-muted hover:bg-surface-elev hover:text-ink">
                <Icon name="close" size={16} />
              </button>
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto p-4">
            <NewRequestForm units={units} procedures={procedures} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### 3.16 Formulário representativo

**Padrão de campo (repetido em TODOS os forms internos):** `<label>` que envolve o texto + controle, em grid:

```tsx
<label className="grid gap-1 text-[12px] font-medium text-ink-muted">
  Nome do campo
  <input className="rounded border border-hairline bg-white px-2 py-2 text-[13px] text-ink" />
</label>

// select idêntico:
<select className="rounded border border-hairline bg-white px-2 py-2 text-[13px] text-ink">…</select>
// textarea idêntico (com rows):
<textarea rows={6} className="rounded border border-hairline bg-white px-2 py-2 text-[13px] text-ink" />
```

**Formulário multi-etapas canônico — `new-request-form.tsx`** (seções numeradas "1. / 2. / 3." com eyebrow uppercase; blocos de contexto em `bg-surface-elev`; avisos inline; validação zod no submit; erro exibido como texto ao lado do botão). Trecho estrutural completo com todos os padrões visuais:

```tsx
'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function NewRequestForm({ units, procedures }: NewRequestFormProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // ... estados de busca/seleção ...

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCitizen) {
      setMessage('Selecione o paciente antes de criar a solicitação.');
      return;
    }
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage(null);
    try {
      const parsed = schema.parse({ /* campos */ });     // zod no submit
      // ... chamada ao backend ...
      router.push(`/app/regulacao/${data}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível criar a solicitação.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Etapa 1: bloco de busca em superfície elevada ── */}
      <section className="rounded-md border border-hairline bg-surface-elev p-3">
        <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.4px] text-ink-muted">1. Buscar paciente</div>
        <div className="grid gap-2 md:grid-cols-[180px_1fr_auto]">
          <select className="rounded border border-hairline bg-white px-2 py-2 text-[13px] text-ink">
            <option value="name">Nome</option>
            <option value="cpf">CPF</option>
            <option value="cns">CNS</option>
          </select>
          <input placeholder="Digite o nome do paciente" className="rounded border border-hairline bg-white px-2 py-2 text-[13px] text-ink" />
          <Button type="button" variant="outline" size="sm" disabled={searching} onClick={searchCitizens}>
            {searching ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>

        {/* Resultados: lista dividida clicável */}
        {citizens.length > 0 && (
          <div className="mt-3 divide-y divide-hairline rounded border border-hairline bg-white">
            {citizens.map((citizen) => (
              <button key={citizen.id} type="button" onClick={() => selectCitizen(citizen)}
                className="grid w-full gap-1 p-3 text-left hover:bg-surface-elev">
                <span className="font-medium text-ink">{citizen.full_name}</span>
                <span className="text-[12px] text-ink-muted">{/* metadados · separados por “·” */}</span>
              </button>
            ))}
          </div>
        )}

        {/* Confirmação de seleção: faixa azul suave */}
        {selectedCitizen && (
          <div className="mt-3 rounded border border-brand/30 bg-brand-soft px-3 py-2 text-[13px] text-brand-700">
            Paciente selecionado: <strong>{selectedCitizen.full_name}</strong>
          </div>
        )}
      </section>

      {/* ── Etapa 2: aviso de duplicidade (warning inline) ── */}
      {openRequests.length > 0 && (
        <div className="rounded border border-warning bg-warning-soft p-3 text-[12.5px] text-[#8B5A06]">
          Este paciente possui {openRequests.length} solicitação(ões) aberta(s). Verifique duplicidade antes de criar uma nova.
        </div>
      )}

      {/* Cards selecionáveis (estado selecionado = borda + fundo brand) */}
      <div className="grid gap-2 lg:grid-cols-2">
        {filteredExamRequests.map((exam) => (
          <button key={exam.id} type="button" onClick={() => useExam(exam)}
            className={`rounded border p-3 text-left transition-colors ${
              sourceExamId === exam.id ? 'border-brand bg-brand-soft' : 'border-hairline bg-white hover:bg-surface-elev'
            }`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-ink">{exam.exam_name}</span>
              <Badge tone="info" size="sm">{statusLabel}</Badge>
            </div>
            <div className="mt-1 text-[12px] text-ink-muted">{/* metadados · separados por “·” */}</div>
          </button>
        ))}
      </div>

      {/* ── Etapa 3: campos do formulário ── */}
      <form onSubmit={submit} className="space-y-4">
        <div className="text-[12px] font-semibold uppercase tracking-[0.4px] text-ink-muted">3. Dados da solicitação</div>

        <label className="grid gap-1 text-[12px] font-medium text-ink-muted">
          Unidade solicitante
          <select name="requesting_unit_id" required className="rounded border border-hairline bg-white px-2 py-2 text-[13px] text-ink">
            <option value="">Selecione</option>
            {units.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>

        <label className="grid gap-1 text-[12px] font-medium text-ink-muted">
          Prioridade
          <select name="priority" defaultValue="routine" className="rounded border border-hairline bg-white px-2 py-2 text-[13px] text-ink">
            <option value="routine">Rotina</option>
            <option value="urgent">Urgente</option>
            <option value="emergency">Emergência</option>
          </select>
        </label>

        <label className="grid gap-1 text-[12px] font-medium text-ink-muted">
          Justificativa clínica
          <textarea name="clinical_justification" required minLength={10} rows={6}
            className="rounded border border-hairline bg-white px-2 py-2 text-[13px] text-ink" />
        </label>

        {/* Ações: submit à esquerda, erro inline ao lado */}
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={busy || !selectedCitizen}>{busy ? 'Criando...' : 'Criar solicitação'}</Button>
          {message && <span className="text-[12px] text-danger">{message}</span>}
        </div>
      </form>
    </div>
  );
}
```

**Formulário simples com feedback de sucesso/erro — `change-password-form.tsx` (completo):**

```tsx
'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';

export function ChangePasswordForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get('currentPassword') || '');
    const newPassword = String(form.get('newPassword') || '');
    const confirmPassword = String(form.get('confirmPassword') || '');

    setMessage(null);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('A confirmacao nao confere com a nova senha.');
      return;
    }

    setBusy(true);
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const payload = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      setError(String(payload.error || 'Nao foi possivel alterar a senha.'));
      return;
    }

    event.currentTarget.reset();
    setMessage('Senha alterada com sucesso.');
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <label className="grid gap-1 text-[12px] font-medium text-ink-muted">
        Senha atual
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className="rounded border border-hairline bg-white px-3 py-2 text-[13px] font-normal text-ink"
        />
      </label>

      <label className="grid gap-1 text-[12px] font-medium text-ink-muted">
        Nova senha
        <input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          className="rounded border border-hairline bg-white px-3 py-2 text-[13px] font-normal text-ink"
        />
      </label>

      <label className="grid gap-1 text-[12px] font-medium text-ink-muted">
        Confirmar nova senha
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          className="rounded border border-hairline bg-white px-3 py-2 text-[13px] font-normal text-ink"
        />
      </label>

      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-[11.5px] text-ink-muted">Use pelo menos 10 caracteres.</p>
        <Button type="submit" icon="key" disabled={busy}>
          {busy ? 'Alterando...' : 'Alterar senha'}
        </Button>
      </div>

      {error && <p className="rounded border border-danger/20 bg-danger-soft px-3 py-2 text-[12px] text-danger">{error}</p>}
      {message && <p className="rounded border border-success/20 bg-success-soft px-3 py-2 text-[12px] text-success">{message}</p>}
    </form>
  );
}
```

### 3.17 Mapas canônicos status → tone de Badge (verbatim do app)

Estes registros aparecem (às vezes duplicados) nas páginas; são a linguagem de cor do app. Adapte as chaves ao domínio educação mantendo a lógica tonal:

```ts
// Fluxo de solicitação (regulação) — o mais completo:
const STATUS_TONE: Record<string, BadgeTone> = {
  pending: 'warning',
  needs_correction: 'warning',
  approved: 'info',
  awaiting_schedule: 'info',
  awaiting_vacancy_approval: 'warning',
  scheduled: 'success',
  awaiting_result: 'info',
  awaiting_return_schedule: 'info',
  return_scheduled: 'success',
  completed: 'success',
  cancelled: 'danger',
  request_vacancy_again: 'warning',
};

// Prioridade (sempre com dot):
const PRIORITY_TONE = { emergency: 'danger', urgent: 'warning', routine: 'neutral' };

// Agendamentos:
const APPOINTMENT_STATUS = {
  scheduled: 'info', confirmed: 'primary', checked_in: 'accent',
  in_progress: 'warning', completed: 'success', cancelled: 'danger', no_show: 'danger',
};

// Papéis de usuário:
const ROLE_TONE = {
  admin: 'accent', manager: 'accent', doctor: 'primary', nurse: 'primary',
  pharmacist: 'info', reception: 'success', /* fallback */ default: 'neutral',
};

// Origem do dado: pec (sistema central) = 'primary' · manual = 'neutral' · merged = 'accent'
// Ativo/inativo: ativo = 'success' (com dot) · inativo = 'neutral' (listas) ou 'danger' (headers)
```

### 3.18 Toast/notificação — **não existe toast**; feedback é inline

O app não monta nenhum sistema de toast (`@radix-ui/react-toast` está nas deps mas nunca é importado; não há sonner). Todo feedback pós-ação é **inline**, em três formas:

```tsx
// 1) Caixa de erro (canônica — change-password-form):
<p className="rounded border border-danger/20 bg-danger-soft px-3 py-2 text-[12px] text-danger">{error}</p>
// 2) Caixa de sucesso:
<p className="rounded border border-success/20 bg-success-soft px-3 py-2 text-[12px] text-success">{message}</p>
// 3) Texto curto ao lado do botão de submit:
{message && <span className="text-[12px] text-danger">{message}</span>}
// 4) Aviso (warning) em bloco dentro de forms:
<div className="rounded border border-warning bg-warning-soft p-3 text-[12.5px] text-[#8B5A06]">…</div>
// 5) Sucesso "silencioso": router.push(destino) + router.refresh() (navegar é o feedback)
```

⚠️ Bug do original a **não** replicar: vários componentes usam a classe vermelha (3) também para mensagens de sucesso. Na réplica, use a caixa verde (2) para sucesso.

### 3.19 Loading — sem skeletons, sem spinners

Não há componente Skeleton, nenhum `loading.tsx` de rota e zero `animate-spin`. Os padrões reais:

```tsx
// 1) Botão ocupado: disabled + troca de label (o padrão universal)
<Button type="submit" disabled={busy}>{busy ? 'Salvando...' : 'Salvar'}</Button>
// (o estilo desabilitado vem do Button base: disabled:opacity-50 disabled:cursor-not-allowed)

// 2) Fallback de Suspense (login): texto centrado simples
<div className="min-h-screen flex items-center justify-center">Carregando...</div>

// 3) Indicador "ao vivo" (único animate-pulse do app; wrapper esmaece a 70% em repouso):
<span
  className={'inline-flex items-center gap-1.5 text-[11px] text-ink-muted ' + (refreshing ? 'opacity-100' : 'opacity-70')}
  aria-live="polite"
>
  <span className={refreshing ? 'inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse'
                              : 'inline-block h-2 w-2 rounded-full bg-emerald-400'} />
  {refreshing ? 'Atualizando…' : 'Ao vivo'}
</span>
```

Como as páginas são Server Components com filtros via URL, o "loading" percebido é a própria navegação do Next. Se o sistema de destino quiser skeletons, deve criá-los seguindo a gramática do kit (retângulos `rounded-md bg-surface-muted animate-pulse`), mas saiba que isso é uma **extensão**, não parte do design original.

### 3.20 Tabs (link-based, URL-driven — não Radix)

Usadas na página de detalhe (11 abas via `?tab=`), renderizadas no servidor:

```tsx
<div className="-mb-px flex flex-wrap gap-0.5 border-b border-hairline">
  {tabs.map((t) => (
    <Link
      key={t.key}
      href={`?tab=${t.key}`}
      className={
        'inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-[13px] font-semibold transition-colors duration-180 ' +
        (active === t.key
          ? 'border-brand text-brand'
          : 'border-transparent text-ink-muted hover:text-ink-2')
      }
    >
      {t.label}
      {t.count !== undefined && (
        <span className={
          'rounded-full px-1.5 py-px font-mono text-[10.5px] font-bold ' +
          (active === t.key ? 'bg-brand-soft text-brand-700' : 'bg-surface-elev text-ink-muted')
        }>
          {t.count}
        </span>
      )}
    </Link>
  ))}
</div>
```

---

## 4. Padrões de composição e layout

### 4.1 Anatomia padrão de uma página

Toda rota interna segue esta ordem, de cima para baixo, dentro de `<PageWrap>` (`px-6 py-5 space-y-5`, **sem max-width** — conteúdo fluido na largura restante):

1. **Breadcrumb** (opcional, 11.5px, separador `·`) em cima do título.
2. **H1** em Fraunces 26px medium tracking −0.5px; **subtítulo** opcional 13px muted.
3. **Ações** à direita do header (alinhadas à baseline do título): padrão de 1–2 `Button variant="outline" size="sm"` + exatamente **um** `Button` primary `size="sm"`, todos com `icon` (ex.: `download`, `filter`, `plus`, `refresh`).
4. Corpo empilhado com `space-y-5` (20px): toolbar de filtros em `Panel` → mini-stats → linha de meta ("Mostrando X de Y") → grid de cards OU tabela em `Panel pad={false}` → paginação.

**Listagem — dois padrões:** (A) grid de cards clicáveis (1 → `md:2` → `xl:3` colunas, `gap-3`) como em §3.14; (B) tabela dentro de `Panel pad={false}` com header do panel contendo Badges de contagem, thead `bg-surface-elev text-[10.5px] uppercase tracking-[0.6px]`, linhas `border-t border-hairline hover:bg-surface-elev`, células `px-4 py-3`, primeira célula com `Avatar size={28}` + nome, célula final `text-right` com `Button outline sm` "Ver" em um `Link`. Rodapé dentro do mesmo Panel: faixa de meta `border-t border-hairline px-4 py-2 text-[11px] text-ink-soft` + barra de paginação `flex items-center justify-between border-t border-hairline px-4 py-3 text-[12px]`. `PAGE_SIZE = 30` (25 em sub-tabelas de detalhe).

**Página de detalhe:** PageWrap com título = nome da entidade e breadcrumb de volta à listagem; ações incluem link "voltar" (`inline-flex items-center gap-1.5 rounded-sm border border-hairline-strong bg-white px-2.5 py-1 text-xs font-semibold text-ink-2 transition-colors duration-180 hover:bg-surface-alt` com ícone `arrowLeft` 12px). Depois: **Panel de identidade** (`flex flex-wrap items-start gap-4`): `Avatar size={68}` + coluna central `min-w-0 flex-1` contendo linha de nome `flex flex-wrap items-baseline gap-2.5` (h2 `font-display text-[24px] font-medium tracking-[-0.5px]` + Badges de status `size="sm"`) e o grid de fatos `mt-3.5 grid grid-cols-2 gap-4 md:grid-cols-5` + pilha de ações rápidas à direita `flex min-w-[160px] flex-col gap-1.5` composta de **1 `Button` primary `sm` (ação principal) + 2 `Button outline sm`**, todos ocupando a largura da pilha; **tabs** URL-driven (§3.20); aba resumo em `grid grid-cols-1 gap-3.5 lg:grid-cols-[2fr_1fr]` com pilhas de Panels.

**Qual estilo de tabela usar:** três dialetos coexistem no original — na réplica, use o **padrão B acima** (células `px-4 py-3`, thead `bg-surface-elev`) para páginas de listagem completas dentro de `Panel pad={false}`; o **`DataTable`** (§3.9: células `px-3`, thead sem fundo) para tabelas genéricas embutidas em detalhes/painéis; e o estilo do §3.13 (thead `bg-surface-alt`, micro-visualizações) **apenas** dentro de widgets do dashboard.

**Células chave-valor (KV) de detalhe:** label `mb-0.5 text-[10.5px] font-semibold uppercase tracking-[0.6px] text-ink-muted`; valor `text-[13px] font-medium text-ink` (+ `font-mono tracking-[0.5px]` para números de documento; valor ausente = `—`).

**Timeline (histórico):** trilho vertical `absolute bottom-2 left-3 top-2 w-px bg-hairline`; cada evento `relative flex gap-4 mb-4`; ponto `mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface` com `style={{ background: cor, boxShadow: '0 0 0 1.5px ' + cor }}`, cores ciclando `['#1351B4','#1F6FB2','#A94B8C','#D97706','#3B86A8']`; data `font-mono text-[11px] font-semibold text-ink-muted`; título `text-[13.5px] font-semibold tracking-[-0.1px] text-ink`; corpo `mt-1.5 text-[12.5px] leading-[1.5] text-ink-2`.

### 4.2 Grid do dashboard

| Linha | Grid | Conteúdo |
|---|---|---|
| 1 | `grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4` | 4 KpiCards (cores: `#1351B4`, `#1F6FB2`, `#3B86A8`, `#D97706`) |
| 2 | `grid grid-cols-1 gap-3.5 lg:grid-cols-3` | Gráfico de linhas 30 dias (`lg:col-span-2`) + lista de alertas |
| 3 | `grid grid-cols-1 gap-3.5 lg:grid-cols-5` | Tabela de performance (`lg:col-span-3`, `pad={false}`) + fila com barras (`lg:col-span-2`, `pad={false}`) |
| 4 | `grid grid-cols-1 gap-3.5 lg:grid-cols-2` | Duas listas com números display + Badges de delta |

**Gráficos (todos SVG à mão, sem biblioteca):** linhas multissérie 720×240 (padding l40/r12/t12/b28, grid tracejado `#E1E5EC` `strokeDasharray '2 3'`, labels `font-mono` 10px `#6E7B92`, séries strokeWidth 2 em `#1351B4`/`#1F6FB2`/`#D97706`, área da 1ª série opacity 0.07, marcador `r=4 fill #fff`); sparklines 100×32 strokeWidth 1.5 + área opacity 0.08; barras de progresso = `div` track `h-1`/`h-1.5 overflow-hidden rounded-sm bg-surface` com fill inline proporcional colorido por limiar (`>85% #0F8A5F`, `>75% #D97706`, senão `#C8391F`). **Dois azuis intencionais:** `#0C3FA0` = chrome de UI (botões, sidebar, links); `#1351B4` (`chart-1`) = dados/visualizações/avatares. Não fundir os dois.

### 4.3 Comportamento responsivo

Breakpoints padrão do Tailwind (sm 640 / md 768 / lg 1024 / xl 1280). O design é **desktop-first para uso interno**:

- Login: painel esquerdo `hidden md:flex`; abaixo de md só o formulário.
- KPIs: 1 → `sm:2` → `lg:4` colunas (variação: `grid-cols-2 md:grid-cols-4` em páginas de módulo).
- Grids de conteúdo do dashboard: colapsam para 1 coluna abaixo de `lg`.
- Cards de listagem: 1 → `md:2` → `xl:3`.
- Formulários de filtro: empilham e viram `lg:grid-cols-[1fr_180px_180px_auto]` em lg.
- Tabelas: rolagem horizontal via wrapper `overflow-x-auto` (nunca colapso de colunas).
- Header do PageWrap: `flex-wrap` — ações caem para baixo do título em telas estreitas.
- **A sidebar NÃO tem modo mobile** (sem drawer/hambúrguer — fica 232/64px em qualquer viewport). O sistema de destino precisa adicionar um drawer próprio para mobile (recomendado: `Sheet` do shadcn com o mesmo conteúdo da sidebar).

### 4.4 Animações e transições (inventário completo)

- **Duração canônica: 180ms** (`duration-180`), easing default do Tailwind (`cubic-bezier(0.4,0,0.2,1)`). Nunca há `ease-*` custom.
- `transition-colors duration-180` — o padrão da casa (hovers de botões, nav, linhas, chips, links). Hovers mais comuns: `hover:bg-surface-elev`, `hover:bg-surface-alt`, `hover:underline`, `hover:text-ink`.
- `transition-[width] duration-180` — colapso da sidebar (única animação de layout).
- `transition-transform` + `group-hover:translate-x-0.5` — setas em cards-link; `group-open:rotate-90` em chevrons de `<details>`.
- `hover:shadow-md transition-shadow` — 1 ocorrência (card clicável).
- `animate-pulse` — 1 ocorrência (dot "ao vivo", §3.19). `tailwindcss-animate` está instalado mas **nenhuma** utility dele é usada; **dialogs abrem sem animação** (decisão consciente do design: instantâneo e seco).
- Foco: `focus:ring-2 focus:ring-brand/40` (+ `ring-offset-1` em botões, `focus:border-brand` em inputs). Sempre `focus:`, nunca `focus-visible:` (na réplica é aceitável migrar para `focus-visible:` mantendo os mesmos valores).

### 4.5 Tom visual

O design é um **SaaS corporativo/institucional denso**: tipografia pequena (corpo 12.5–13px), espaçamentos compactos (gaps 12–14px, paddings 16–18px), elevação comunicada por **bordas hairline** (`#E3E7E4`) em vez de sombras, cantos discretos (6–10px), fundo branco puro com blocos cinza-azulados sutilíssimos, e **uma única superfície escura** — a sidebar azul-marinho — que ancora a identidade. A personalidade vem do contraste entre a serifada Fraunces (títulos e números grandes, sempre com tracking negativo) e a Inter miúda e funcional de todo o resto, com JetBrains Mono tabular para números de tabela. Cor é usada com parcimônia semântica: azul institucional para ação/navegação, paleta soft-bg + texto-escuro para status, dourado raro como acento. Nada anima além de cores em 180ms — o app parece rápido porque é visualmente seco.

**Regras de identidade:**
1. **Sempre** use borda `hairline` + `shadow-sm` para separar superfícies; **nunca** use sombras médias/grandes para cards em repouso (shadow-lg é só para dropdowns/dialogs).
2. **Sempre** títulos de página e valores numéricos de destaque em `font-display` (serifada) com tracking negativo; **nunca** use a serifada em corpo de texto, labels ou botões.
3. **Sempre** labels/eyebrows em uppercase 10–11.5px `font-semibold` com tracking positivo (0.4–1px) e cor `ink-muted`; **nunca** um label uppercase maior que 12px.
4. **Sempre** status como Badge pill soft-bg + texto escuro da mesma família (com `dot` para estados "vivos"); **nunca** fundo saturado cheio com texto branco para status (cheio é só para o chip de filtro ativo e botões).
5. **Sempre** `transition-colors duration-180` em qualquer hover, e apenas isso; **nunca** animações de entrada, zoom, spring ou skeletons elaborados — o design é instantâneo.
6. **Sempre** números tabulares (`font-mono`) em colunas numéricas de tabela e timestamps; **nunca** Inter proporcional para colunas de números comparáveis.

---

## 5. Guia de adaptação (saúde → educação, stack de destino)

### 5.1 O que é específico do domínio saúde (trocar por equivalentes de educação)

| Original (saúde) | Equivalente sugerido (educação) |
|---|---|
| Cidadãos/Pacientes | Alunos |
| UBS / Unidades de saúde | Escolas / Unidades escolares |
| Profissionais (médico, enfermeiro, farmacêutico, recepção) | Professores, coordenadores, secretaria |
| Consultas / Agenda | Aulas / Horários / Agenda escolar |
| Exames / Regulação (fila, prioridade) | Avaliações / Fila de matrícula ou transferência |
| Farmácia / Estoque crítico | Merenda / Material escolar / Acervo |
| Vacinação | Programas (reforço, eventos, frequência) |
| Vigilância epidemiológica ("Doenças notificáveis") | Indicadores de evasão/frequência ("Alertas de evasão") |
| Receitas / Dispensações | Boletins / Históricos escolares |
| KPIs: "Cidadãos cadastrados / Consultas hoje / Exames em andamento / Unidades ativas" | "Alunos matriculados / Aulas hoje / Avaliações pendentes / Escolas ativas" |
| Papéis: admin, manager, doctor, nurse, pharmacist, reception | admin, gestor, professor, coordenador, secretaria |
| Ícones de domínio: `stethoscope`, `pill`, `syringe`, `flask`, `heart`, `droplet`, `bug` | `GraduationCap`, `BookOpen`, `School`, `ClipboardList`, `Backpack`, `NotebookPen` (Lucide) — mantenha stroke 1.6 e tamanhos 12–17px |
| BrandMark: cruz + linha de ECG dentro do quadrado rx-14 | Trocar o miolo por símbolo educacional (ex. livro aberto/capelo) **mantendo a geometria**: quadrado 64×64 rx-14, símbolo em 2 tons de azul, mesma dupla variante onDark/onLight, mesmo wordmark (eyebrow uppercase 9.5px + nome em Fraunces 14px) |
| Copy do login ("Saúde pública, gerida com clareza.", stats de pacientes/unidades) | Headline equivalente (ex. "Educação municipal, gerida com clareza.") + 3 stats do domínio; manter exatamente a tipografia/estrutura |
| Placeholder da busca global ("Buscar paciente, CPF, CNS…") | "Buscar aluno, matrícula, professor…" |
| Filtros da listagem (Importados PEC / Idosos 60+ / Gestantes…) | Por origem (Censo/Manual), série/turno, situação de matrícula |
| Textos LGPD/SUS/gov.br do login | Manter LGPD; o botão SSO secundário desabilitado é opcional |

Nenhum dado real de paciente existe neste documento — todos os nomes/números nos códigos acima são mock/ilustrativos, e mesmo assim devem ser substituídos por conteúdo do domínio educação.

### 5.2 O que NÃO se traduz diretamente para o stack de destino (e o que fazer)

**1. Tokens hex → shadcn/ui CSS variables.** Este projeto NÃO usa variáveis CSS; as cores são hex no `tailwind.config`. No destino (shadcn + next-themes), faça os dois:
   - **(a)** copie o bloco **`extend` INTEIRO** da seção 2.1 (não só `colors` — os componentes colados dependem também de `borderRadius` px, `transitionDuration.180`, `letterSpacing.label`, `fontSize.2xs`, `boxShadow` e `fontFamily`) para o `tailwind.config` de destino — assim todas as classes (`bg-brand-soft`, `duration-180`, `tracking-label`, `rounded-sm` 6px…) funcionam verbatim;
   - **(b)** aponte as variáveis shadcn para os mesmos valores, para que os componentes shadcn nativos (Dialog, Select, Toast…) fiquem coerentes.

   **Regras de merge com o config shadcn existente (obrigatórias — há colisões de chave):**
   - `borderRadius`: a escala px desta base (`xs 4 / sm 6 / md 8 / lg 10 / xl 14`) **substitui** as entradas `calc(var(--radius)…)` do shadcn. Se mantiver as do shadcn, todos os botões colados viram 4px e os panels 8px — errado. (O `--radius: 0.5rem` abaixo existe só para componentes shadcn que o leiam diretamente; nas classes Tailwind, quem manda é a escala px.)
   - `accent`: **a paleta vence** — `accent = #F4B942` (âmbar) com `accent.soft`, exigidos pelo Badge tone `accent` e pelo dot da sidebar colapsada. NÃO mapeie a chave Tailwind `accent` para `hsl(var(--accent))`; deixe `--accent/--accent-foreground` como variáveis CSS apenas para o hover interno dos componentes shadcn (Select/Dropdown/Command) — ou reestilize esses itens com `hover:bg-surface-alt`, que é o cinza de hover desta base.
   - `border`: colisão benigna — o hex da paleta (`#E3E7E4`) e `hsl(var(--border))` resolvem a mesma cor; qualquer um serve.

```css
:root {
  --background: 0 0% 100%;            /* #FFFFFF (surface) */
  --foreground: 162 16% 12%;          /* #1A2421 (ink) */
  --card: 0 0% 100%;                  /* #FFFFFF (surface-card) */
  --card-foreground: 162 16% 12%;
  --popover: 0 0% 100%;
  --popover-foreground: 162 16% 12%;
  --primary: 219 86% 34%;             /* #0C3FA0 (brand) */
  --primary-foreground: 0 0% 100%;
  --secondary: 219 71% 95%;           /* #E7EEFB (brand-soft) */
  --secondary-foreground: 220 89% 24%;/* #072B73 (brand-700) */
  --muted: 218 31% 95%;               /* #EEF1F6 (surface-muted) */
  --muted-foreground: 152 6% 45%;     /* #6B7872 (ink-muted) */
  --accent: 220 43% 99%;              /* #FAFBFD (surface-alt — hover) */
  --accent-foreground: 162 16% 12%;
  --destructive: 9 73% 45%;           /* #C8391F (danger) */
  --destructive-foreground: 0 0% 100%;
  --border: 135 8% 90%;               /* #E3E7E4 (hairline) */
  --input: 135 8% 90%;
  --ring: 219 86% 34%;                /* #0C3FA0 (usar ring-2 ring-brand/40) */
  --radius: 0.5rem;                   /* 8px = rounded-md desta escala */
  --chart-1: 217 81% 39%;             /* #1351B4 */
  --chart-2: 207 70% 41%;             /* #1F6FB2 */
  --chart-3: 319 39% 48%;             /* #A94B8C */
  --chart-4: 32 95% 44%;              /* #D97706 */
  --chart-5: 199 48% 45%;             /* #3B86A8 */
  --sidebar-background: 215 87% 18%;  /* #062654 (brand-deep) */
  --sidebar-foreground: 219 52% 86%;  /* #C9D6EE */
  --sidebar-primary: 215 76% 35%;     /* #164E9F (item ativo) */
  --sidebar-accent: 214 79% 27%;      /* #0E3C7A (hover) */
  --sidebar-border: 0 0% 100% / 0.10; /* border-white/10 */
}
```

**2. Dark mode.** O original é **light-only** (não existe um único valor escuro no código; `darkMode:['class']` é vestigial). Para o destino com next-themes, os valores dark precisam ser **criados** — não há fonte de verdade. Sementes coerentes com a identidade: manter a sidebar `#062654` idêntica nos dois temas; fundo dark ≈ `#0B1526`–`#0E1420` (família do navy da marca); cards ~5% mais claros que o fundo (heurística documentada nos guias internos do projeto); manter os hex de status (`#C8391F/#D97706/#0F8A5F/#1F6FB2`) trocando apenas os "soft" por versões alpha (`danger/15` etc.); textos: inverter escala ink (foreground ≈ `#E7ECF2`, muted ≈ `#8B98A8`). Marque tudo isso como derivação nova, não como réplica. Atenção: os componentes colados usam `bg-white`/`border-white` literais em vários pontos (inputs, dropdown, kbd chip, dot de notificação) — ao portar, troque `bg-white` → `bg-card`/token equivalente para não quebrar no dark.

**3. Componentes shadcn vs kit próprio.** O kit deste projeto não usa cva. Duas rotas válidas no destino: (a) portar os componentes da seção 3 como estão (recomendado — mantém fidelidade 1:1); ou (b) recriar em cva mantendo **as strings de classe exatas** como valores das variantes (os defaults do shadcn — h-10, rounded-md 6px default, text-sm 14px, ring offset — **não** batem com este design: botões aqui são `rounded-sm` 6px da escala custom, texto 13px, py-1.5). Para Dialog/Select/Toast do shadcn: aplique as classes do §3.15 no `DialogContent`/`DialogOverlay` (overlay `bg-black/45`, painel `rounded-md border border-hairline shadow-xl`, header com borda inferior) e **remova as animações default do shadcn** ou aceite-as como melhoria consciente (o original abre seco). Se adotar Toast/sonner no destino, estilize-o como a caixa inline do §3.18 (borda `danger/20`/`success/20`, fundo soft, texto 12px) — mas saiba que é extensão.

**4. Ícones Phosphor/Lucide.** O original é 100% Lucide com stroke fino (1.6–1.7; ativo 2). Se usar Phosphor no destino, use peso **regular/light** para aproximar; o mais fiel é manter Lucide e o wrapper `<Icon>` do §3.1.

**5. Tamanhos em px arbitrários.** Grande parte da tipografia usa valores arbitrários (`text-[13px]`, `text-[11.5px]`, `tracking-[-0.5px]`, `p-[18px]`). Isso é intencional (densidade ~1px menor que a escala default) e o Tailwind 3.4 do destino suporta igual — **não arredonde** para a escala padrão.

**6. Inconsistências do original que NÃO devem ser replicadas:**
   - Classes de token inexistentes que silenciosamente não geram CSS: `shadow-card`, `shadow-card-sm`, `primary`, `bg-primary/10`, `surface-2`, `brand-primary`, `hover:bg-primary-soft` (aparecem em `unidades`/`profissionais`) — use `brand`, `surface-alt`, `shadow-sm`/`hover:shadow-md`.
   - Dialeto de cores cru (`rose-600`, `emerald-50`, `amber-50`, `sky-700`, `#16A34A`, `#DC2626`) usado na seção de integrações e nos `.btn-*` legados — padronize nos tokens `danger/success/warning/info`.
   - Mensagens de **sucesso** renderizadas com classe vermelha (`text-danger`) em vários forms — use a caixa verde.
   - Dois padrões de modal (Radix vs `useState` sem portal/ESC) e overlays diferentes (`bg-black/45` vs `/40`) — padronize no Radix/shadcn com `bg-black/45`.
   - Quatro famílias de estilo de input — unifique na utility `.input` (é a única com focus ring) e derive o `<Input>` do shadcn dela.
   - Checkbox custom do login: o ícone de check usa `peer-checked:` mas está aninhado dentro de um irmão do input, então nunca aparece — corrija a estrutura ao portar (o toggle de fundo/borda funciona).
   - Labels ora `font-medium` ora `font-semibold` — padronize em `font-medium`.
   - Duplicações no config (`warn`≡`warning`, `ok`≡`success`, `border`≡`hairline`, `brand-500`≡`brand-600`) — pode manter por compatibilidade das classes coladas, mas trate `warning`/`success`/`hairline`/`brand-600` como canônicos.

**7. O que existe nos mockups mas não no app** (não documentar como comportamento real): command palette ⌘K funcional (o chip é decorativo), toasts, dark mode, PWA, drag-drop de widgets. Os botões de notificação/config da topbar, o toggle grid/lista e o "Ordenar" das listagens, e o link "Esqueci minha senha" do login são decorativos (sem handlers e sem tela correspondente) — no destino, implemente-os ou omita-os. Se implementar a recuperação de senha, reutilize o layout do painel direito do login (form `max-w-[380px]`, H2 display 28px, um Field + botão submit `h-[46px]`).

### 5.3 Ordem sugerida de aplicação do redesign

1. **Fontes + tokens**: `fonts.ts` (Inter/Fraunces/JetBrains Mono), bloco `extend` do tailwind.config (§2.1), variáveis shadcn (§5.2, item 1), `globals.css` (§2.2). Critério de pronto: um `<h1 className="font-display text-[26px] font-medium tracking-[-0.5px]">` e um `<div className="panel">` renderizam idênticos ao original.
2. **Kit UI**: `cn()`, `icons.tsx`, `Button`, `Badge`, `Avatar`, `Breadcrumb`, `Panel`, `PageWrap`, `KpiCard`+`Sparkline`, `DataTable`, `EmptyState` (§3.0–3.10) + `Input`/`Select` derivados de `.input` + `Dialog` com as classes do §3.15.
3. **Shell**: layout do grupo autenticado, `Sidebar` (com nav de educação no formato de `nav.ts`), `Topbar` + busca + `UserMenu`, `BrandMark` adaptado (§3.11). Adicionar o drawer mobile que o original não tem.
4. **Login** (§3.12) com copy/marca de educação.
5. **Dashboard** (§3.13) com KPIs e widgets do domínio educação, mantendo grids, cores de série e tipos de gráfico.
6. **Listagens + detalhe** (§3.14, §4.1): uma listagem em cards e uma em tabela, paginação por URL, tabs de detalhe (§3.20).
7. **Forms + dialogs + feedback** (§3.15–3.19): padrão de campo, callouts, estados busy, mapas status→tone adaptados (§3.17).
8. **Dark mode** por último (§5.2, item 2), como derivação nova — validar cada superfície colada que usa `bg-white` literal.

---

*Documento gerado a partir do código-fonte real do dashboard (Next.js 15 + Tailwind 3.4). Todo código nas seções 2–3 é verbatim do repositório, salvo trechos marcados como "estrutura/adaptar" onde a lógica de dados foi resumida para remover integrações específicas do backend. Nenhum dado pessoal ou credencial está presente.*



