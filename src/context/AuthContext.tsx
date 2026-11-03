import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../services/api'
import { AuthContext } from './authContextStore'
import type { User } from '../types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem('mesa-token') || '')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('mesa-token')))

  const logout = useCallback(() => {
    localStorage.removeItem('mesa-token')
    setToken('')
    setUser(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!token) return
    let cancelled = false

    async function validateSession() {
      try {
        const currentUser = await api.me(token)
        if (!cancelled) setUser(currentUser)
      } catch {
        if (!cancelled) logout()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void validateSession()
    return () => { cancelled = true }
  }, [logout, token])

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true)
    try {
      const result = await api.login(username, password)
      const nextUser: User = {
        id: result.id,
        username: result.username,
        firstName: result.firstName,
        lastName: result.lastName,
        image: result.image,
      }
      localStorage.setItem('mesa-token', result.accessToken)
      setUser(nextUser)
      setToken(result.accessToken)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }, [])

  const value = useMemo(() => ({ token, user, loading, login, logout }), [token, user, loading, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

