import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '../types'
import { authApi } from '../api/auth'

const isAdminRole = (role?: string): boolean => {
  return role === 'admin' || role === 'super_admin'
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  
  setUser: (user: User | null) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
      isSuperAdmin: false,

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          isAdmin: isAdminRole(user?.role),
          isSuperAdmin: user?.role === 'super_admin'
        })
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken })
      },

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const tokens = await authApi.login({ email, password })
          set({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token
          })
          
          const user = await authApi.getMe()
          set({
            user,
            isAuthenticated: true,
            isAdmin: isAdminRole(user.role),
            isSuperAdmin: user.role === 'super_admin',
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isAdmin: false,
          isSuperAdmin: false
        })
      },

      fetchUser: async () => {
        const { accessToken } = get()
        if (!accessToken) return

        try {
          const user = await authApi.getMe()
          set({
            user,
            isAuthenticated: true,
            isAdmin: isAdminRole(user.role),
            isSuperAdmin: user.role === 'super_admin'
          })
        } catch {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isAdmin: false,
            isSuperAdmin: false
          })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken
      })
    }
  )
)



