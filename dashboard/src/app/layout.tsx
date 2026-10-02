import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { connection } from 'next/server'
import { fontSans, fontDisplay, fontMono } from './fonts'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Sistema de Gestão Educacional',
  description: 'Sistema de Gestão Educacional - Prefeitura de Ibirapitanga-BA',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // CSP com nonce (src/proxy.ts): o Next só aplica o nonce aos <script> em
  // renderização por requisição. Página pré-gerada no build sairia sem nonce e
  // teria todos os scripts bloqueados — por isso tudo é dinâmico.
  await connection()
  // Nonce gerado pelo proxy (cabeçalho x-nonce): o script inline do
  // next-themes (aplica o tema antes da hidratação) precisa dele, senão a
  // CSP o bloqueia e o tema escuro pisca.
  const nonce = (await headers()).get('x-nonce') ?? undefined
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`}
    >
      <body className="font-sans">
        <Providers nonce={nonce}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
