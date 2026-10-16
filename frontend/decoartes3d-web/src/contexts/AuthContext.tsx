import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { configureApiAuth } from '../api/client'
import { authApi } from '../api/endpoints'
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/api'
import { readStorage, removeStorage, writeStorage } from '../utils/storage'

const STORAGE_KEY = 'decoartes3d.auth'

export type AuthUser = Omit<AuthResponse, 'token' | 'expiresAt'>

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (request: LoginRequest) => Promise<AuthUser>
  register: (request: RegisterRequest) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadSession(): AuthResponse | null {
  const session = readStorage<AuthResponse>(STORAGE_KEY)
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
    removeStorage(STORAGE_KEY)
    return null
  }
  return session
}

const toUser = ({ userId, email, firstName, lastName, role }: AuthResponse): AuthUser => ({
  userId,
  email,
  firstName,
  lastName,
  role,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<AuthResponse | null>(loadSession)
  // El cliente HTTP lee el token de este ref; se actualiza a la vez que la sesión (login/logout).
  const tokenRef = useRef(session?.token ?? null)

  const logout = useCallback(() => {
    removeStorage(STORAGE_KEY)
    tokenRef.current = null
    setSession(null)
    // Los datos cacheados del usuario anterior (sus pedidos, panel admin) no deben sobrevivir.
    queryClient.removeQueries({ queryKey: ['orders'] })
    queryClient.removeQueries({ queryKey: ['admin'] })
  }, [queryClient])

  useEffect(() => {
    configureApiAuth(() => tokenRef.current, logout)
  }, [logout])

  // Cierra la sesión justo cuando caduca el token.
  useEffect(() => {
    if (!session) return
    const remaining = new Date(session.expiresAt).getTime() - Date.now()
    const timer = window.setTimeout(logout, Math.max(0, Math.min(remaining, 2_147_000_000)))
    return () => window.clearTimeout(timer)
  }, [session, logout])

  const startSession = useCallback((response: AuthResponse): AuthUser => {
    writeStorage(STORAGE_KEY, response)
    tokenRef.current = response.token
    setSession(response)
    return toUser(response)
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const user = session ? toUser(session) : null
    return {
      user,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'Admin',
      login: async (request) => startSession(await authApi.login(request)),
      register: async (request) => startSession(await authApi.register(request)),
      logout,
    }
  }, [session, startSession, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  return context
}
