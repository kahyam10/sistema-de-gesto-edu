import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi, definirCsrf, User } from './api'

// A sessão vive em cookies httpOnly definidos pela API — este contexto nunca
// vê nem guarda token. Só o csrfToken circula, em memória (lib/api.ts).
interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  // Reidrata a sessão após reload: se o cookie ainda vale (ou renova), /me responde
  useEffect(() => {
    authApi.me()
      .then(({ user, csrfToken }) => {
        definirCsrf(csrfToken)
        setUser(user)
      })
      .catch(() => {
        definirCsrf(null)
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    definirCsrf(response.csrfToken)
    setUser(response.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout() // revoga a sessão no servidor e apaga os cookies
    } catch {
      /* sem rede: os cookies expiram sozinhos; o estado local é limpo abaixo */
    } finally {
      definirCsrf(null)
      setUser(null)
      // Computador compartilhado (secretaria): não deixa dados do usuário anterior em cache
      queryClient.clear()
    }
  }, [queryClient])

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
