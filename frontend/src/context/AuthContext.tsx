import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import * as authApi from '../lib/auth'
import { updateProfile as updateProfileApi } from '../lib/profile'
import type { User, ProfileUpdate } from '../types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  forgotPassword: (email: string) => Promise<string>
  updateProfile: (data: ProfileUpdate) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authApi.getSession()?.user ?? null)
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const session = await authApi.login(email, password)
      setUser(session.user)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      const session = await authApi.signup(name, email, password)
      setUser(session.user)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const forgotPassword = useCallback(async (email: string) => {
    setIsLoading(true)
    try {
      const result = await authApi.forgotPassword(email)
      return result.message
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (data: ProfileUpdate) => {
    if (!user) return
    setIsLoading(true)
    try {
      const profile = await updateProfileApi(user.id, data)
      const updated: User = {
        ...user,
        profileImage: profile.profileImage,
        phoneCode: profile.phoneCode,
        phoneNumber: profile.phoneNumber,
      }
      authApi.refreshSessionUser(updated)
      setUser(updated)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const logout = useCallback(() => {
    authApi.logout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        forgotPassword,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
