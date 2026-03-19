import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

interface User {
  id: string
  email: string
  username: string
  balance: number
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  updateBalance: (balance: number) => void
  refreshBalance: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          set({ user: data.user, token: data.token, isLoading: false })
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      register: async (email, username, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/register', { email, username, password })
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          set({ user: data.user, token: data.token, isLoading: false })
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      logout: () => {
        delete api.defaults.headers.common['Authorization']
        set({ user: null, token: null })
      },

      updateBalance: (balance) => {
        const user = get().user
        if (user) set({ user: { ...user, balance } })
      },

      refreshBalance: async () => {
        try {
          const { data } = await api.get('/wallet')
          const user = get().user
          if (user) set({ user: { ...user, balance: data.balance } })
        } catch {}
      },
    }),
    {
      name: 'casino-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)
