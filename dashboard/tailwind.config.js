/** @type {import('tailwindcss').Config} */
// Tokens do DESIGN_BASE.md (docs/) mesclados com as variáveis shadcn.
// Regras de merge (§5.2 do documento):
// - borderRadius: escala em px SUBSTITUI as entradas calc(var(--radius)) do shadcn
// - accent: a paleta âmbar VENCE (o hover interno dos componentes shadcn foi
//   reestilizado para hover:bg-surface-alt nos próprios componentes)
// - border: hex da paleta (#E3E7E4) — mesma cor que hsl(var(--border))
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // ==== Paleta do design (DESIGN_BASE §2.1) ====
        brand: {
          DEFAULT: "#0C3FA0",
          50: "#EEF4FF",
          100: "#D4E5FF",
          200: "#A9CBFF",
          300: "#7EB0FF",
          400: "#4285F4",
          500: "#0C3FA0",
          600: "#0C3FA0",
          700: "#072B73",
          800: "#081F4A",
          900: "#071D41",
          soft: "var(--brand-soft)",
          "soft-fg": "var(--brand-soft-fg)",
          "soft-hover": "var(--brand-soft-hover)",
          faint: "var(--brand-faint)",
          deep: "#062654",
          hover: "#0E3C7A",
          sel: "#164E9F",
          light: "#2670E8",
          gold: "#D4A24C",
          sidebarText: "#C9D6EE",
          sidebarMuted: "#7E8FB0",
        },
        accent: {
          DEFAULT: "#F4B942",
          soft: "var(--accent-soft)",
          fg: "var(--accent-soft-fg)",
          foreground: "#1A2421",
        },
        surface: {
          DEFAULT: "var(--surface)",
          muted: "var(--surface-muted)",
          alt: "var(--surface-alt)",
          card: "var(--surface-card)",
          elev: "var(--surface-elev)",
          soft: "var(--surface-soft)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          2: "var(--ink-2)",
          3: "var(--ink-3)",
          muted: "var(--ink-muted)",
          soft: "var(--ink-soft)",
          mutedLight: "var(--ink-muted-light)",
        },
        border: {
          DEFAULT: "var(--hairline)",
          strong: "var(--hairline-strong)",
          dark: "var(--hairline-strong)",
        },
        hairline: {
          DEFAULT: "var(--hairline)",
          strong: "var(--hairline-strong)",
        },
        danger: { DEFAULT: "#C8391F", soft: "var(--danger-soft)", fg: "var(--danger-soft-fg)" },
        warn: { DEFAULT: "#D97706", soft: "var(--warning-soft)" },
        warning: { DEFAULT: "#D97706", soft: "var(--warning-soft)", fg: "var(--warning-soft-fg)" },
        success: { DEFAULT: "#0F8A5F", soft: "var(--success-soft)", fg: "var(--success-soft-fg)" },
        ok: { DEFAULT: "#0F8A5F", soft: "var(--success-soft)" },
        info: { DEFAULT: "#1F6FB2", soft: "var(--info-soft)", fg: "var(--info-soft-fg)" },
        chart: {
          1: "#1351B4",
          2: "#1F6FB2",
          3: "#A94B8C",
          4: "#D97706",
          5: "#3B86A8",
          6: "#5C7A4F",
          7: "#C8391F",
          8: "#6B7872",
        },
        // ==== Variáveis shadcn (componentes existentes) ====
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      // Escala px do design (substitui as entradas calc(var(--radius)) do shadcn)
      borderRadius: { xs: "4px", sm: "6px", md: "8px", lg: "10px", xl: "14px" },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Fraunces", "Georgia", "serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": ["10.5px", { lineHeight: "1.3" }],
      },
      letterSpacing: {
        label: "0.7px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(15,23,40,0.05)",
        md: "0 1px 3px rgba(15,23,40,0.06), 0 4px 16px rgba(15,23,40,0.06)",
        lg: "0 8px 32px rgba(15,23,40,0.10)",
      },
      transitionDuration: { 180: "180ms" },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
