// Content Security Policy com nonce por requisição (Next 16: "proxy" é o
// antigo middleware). O Next lê o nonce do cabeçalho Content-Security-Policy
// da REQUISIÇÃO e o aplica aos próprios <script> durante a renderização —
// por isso as páginas precisam ser dinâmicas (ver app/layout.tsx).
//
// Diretivas e por quê:
// - script-src 'nonce-…' 'strict-dynamic': só scripts com o nonce (e os que
//   eles carregam) executam; injeção de <script> sem nonce é bloqueada.
//   'self' fica como fallback para navegadores sem 'strict-dynamic'.
//   'wasm-unsafe-eval': o @react-pdf/renderer (ficha/declaração de matrícula,
//   grade horária, relatório de frequência) monta o layout com o yoga-layout,
//   que compila WebAssembly. Isso NÃO libera eval de JavaScript.
//   'unsafe-eval' só em desenvolvimento (React usa eval para stacks de erro).
// - style-src 'unsafe-inline' (sem nonce — com nonce o navegador ignoraria o
//   'unsafe-inline'): Radix (popover/select/tooltip) e Recharts posicionam com
//   atributos style no HTML do servidor; next-themes (disableTransitionOnChange)
//   e o sonner injetam <style> em tempo de execução. Estilo inline não executa
//   código; o risco residual é injeção de CSS.
// - connect-src: a própria origem + a API (NEXT_PUBLIC_API_URL).
// - img-src data: blob: (ícones/SVG em data URI; prévias geradas no navegador).
import { NextResponse, type NextRequest } from "next/server";

function origemDaApi(): string | null {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3051";
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function montarCsp(nonce: string, dev: boolean): string {
  const api = origemDaApi();
  const diretivas: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      "'wasm-unsafe-eval'",
      ...(dev ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "connect-src": ["'self'", ...(api ? [api] : [])],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  return Object.entries(diretivas)
    .map(([k, v]) => `${k} ${v.join(" ")}`)
    .join("; ");
}

export function proxy(request: NextRequest) {
  // 128 bits aleatórios por requisição
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const nonce = btoa(String.fromCharCode(...bytes));
  const csp = montarCsp(nonce, process.env.NODE_ENV === "development");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Páginas: tudo menos arquivos estáticos do Next e prefetches do <Link>
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
