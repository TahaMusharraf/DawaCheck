'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, ApiError } from './api'
import type { Me } from './types'

type AuthState = {
  me: Me | null
  /** True until the saved token has been checked against /auth/me. */
  loading: boolean
  signIn: (token: string) => Promise<Me>
  signOut: () => void
  /** Re-reads /auth/me, e.g. after the user changes their email. */
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  const signOut = useCallback(() => {
    localStorage.removeItem('token')
    setMe(null)
  }, [])

  const signIn = useCallback(async (token: string) => {
    localStorage.setItem('token', token)
    const user = await api<Me>('/auth/me')
    setMe(user)
    return user
  }, [])

  const refresh = useCallback(async () => {
    setMe(await api<Me>('/auth/me'))
  }, [])

  // Restore the session once on load. A 401 means the token is stale, so drop it.
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      queueMicrotask(() => setLoading(false))
      return
    }
    api<Me>('/auth/me')
      .then(setMe)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) localStorage.removeItem('token')
      })
      .finally(() => setLoading(false))
  }, [])

  return <AuthContext.Provider value={{ me, loading, signIn, signOut, refresh }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
