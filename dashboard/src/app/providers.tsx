'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth'
import { AuthGate } from '@/components/AuthGate'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {/* Tema light-only por decisão de design (DESIGN_BASE §5.2) —
          a superfície escura do sistema é a sidebar azul-marinho */}
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        forcedTheme="light"
        disableTransitionOnChange
      >
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
