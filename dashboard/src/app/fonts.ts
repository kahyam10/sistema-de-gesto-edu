import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google'

export const fontSans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const fontDisplay = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '500', '600'],
})

export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})
