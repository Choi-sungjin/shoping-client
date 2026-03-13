"use client"

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

type AuthUser = {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  address?: string
}

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = "accessToken"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

function setAccessTokenCookie(token: string) {
  document.cookie = `accessToken=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
}

function clearAccessTokenCookie() {
  document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax"
}

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  const data = await response.json()

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || "Request failed")
  }

  return data as T
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const applyAuth = useCallback((nextToken: string, nextUser: AuthUser) => {
    window.localStorage.setItem(STORAGE_KEY, nextToken)
    setAccessTokenCookie(nextToken)
    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const clearAuth = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY)
    clearAccessTokenCookie()
    setToken(null)
    setUser(null)
  }, [])

  const refreshMe = useCallback(async () => {
    const currentToken = window.localStorage.getItem(STORAGE_KEY)

    if (!currentToken) {
      clearAuth()
      return
    }

    const data = await requestJson<{ data: { user: AuthUser } }>(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    })

    setToken(currentToken)
    setUser(data.data.user)
  }, [clearAuth])

  useEffect(() => {
    let mounted = true

    const restoreSession = async () => {
      try {
        const savedToken = window.localStorage.getItem(STORAGE_KEY)
        if (!savedToken) {
          clearAccessTokenCookie()
          if (mounted) setLoading(false)
          return
        }

        const data = await requestJson<{ data: { user: AuthUser } }>(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        })

        if (!mounted) return
        setAccessTokenCookie(savedToken)
        setToken(savedToken)
        setUser(data.data.user)
      } catch {
        if (mounted) clearAuth()
      } finally {
        if (mounted) setLoading(false)
      }
    }

    restoreSession()

    return () => {
      mounted = false
    }
  }, [clearAuth])

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await requestJson<{ data: { token: string; user: AuthUser } }>(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      )

      applyAuth(data.data.token, data.data.user)
    },
    [applyAuth]
  )

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await requestJson<{ data: { token: string; user: AuthUser } }>(
        `${API_BASE_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        }
      )

      applyAuth(data.data.token, data.data.user)
    },
    [applyAuth]
  )

  const logout = useCallback(() => {
    clearAuth()
  }, [clearAuth])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      signup,
      logout,
      refreshMe,
    }),
    [user, token, loading, login, signup, logout, refreshMe]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
