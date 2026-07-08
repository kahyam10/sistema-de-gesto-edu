import type { Metadata } from 'next'
import { fontSans, fontDisplay, fontMono } from './fonts'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Sistema de Gestão Educacional',
  description: 'Sistema de Gestão Educacional - Prefeitura de Ibirapitanga-BA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`}
    >
      <body className="font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
