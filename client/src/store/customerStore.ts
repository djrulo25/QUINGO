import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ICustomer, AuthResponse } from '@/types/customer'
import { API_BASE_URL } from '@/api/config'

interface CustomerStore {
  customer: ICustomer | null
  token: string | null
  isLoggedIn: boolean
  isLoading: boolean
  error: string | null

  // Auth actions
  setCustomer: (customer: ICustomer) => void
  setToken: (token: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void

  // API calls
  register: (email: string, password: string, firstName: string, lastName: string, phone: string) => Promise<AuthResponse>
  login: (email: string, password: string) => Promise<AuthResponse>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, newPassword: string) => Promise<void>

  // Profile actions
  updateProfile: (data: Partial<ICustomer>) => Promise<void>
  fetchProfile: () => Promise<void>
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customer: null,
      token: null,
      isLoggedIn: false,
      isLoading: false,
      error: null,

      setCustomer: (customer: ICustomer) => set({ customer, isLoggedIn: true }),
      setToken: (token: string) => set({ token }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),

      logout: () => {
        set({ customer: null, token: null, isLoggedIn: false })
        localStorage.removeItem('customer-store')
      },

      register: async (email: string, password: string, firstName: string, lastName: string, phone: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`${API_BASE_URL}/customer/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, firstName, lastName, phone }),
          })

          if (!response.ok) {
            throw new Error('Registration failed')
          }

          const data: AuthResponse = await response.json()
          set({ token: data.token, customer: data.customer as ICustomer, isLoggedIn: true, isLoading: false })
          return data
        } catch (error: any) {
          const errorMsg = error.message || 'Error registering'
          set({ error: errorMsg, isLoading: false })
          throw error
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`${API_BASE_URL}/customer/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })

          if (!response.ok) {
            throw new Error('Login failed')
          }

          const data: AuthResponse = await response.json()
          set({ token: data.token, customer: data.customer as ICustomer, isLoggedIn: true, isLoading: false })
          return data
        } catch (error: any) {
          const errorMsg = error.message || 'Error logging in'
          set({ error: errorMsg, isLoading: false })
          throw error
        }
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`${API_BASE_URL}/customer/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          })

          if (!response.ok) {
            throw new Error('Error sending recovery email')
          }

          set({ isLoading: false })
        } catch (error: any) {
          const errorMsg = error.message || 'Error sending recovery email'
          set({ error: errorMsg, isLoading: false })
          throw error
        }
      },

      resetPassword: async (token: string, newPassword: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`${API_BASE_URL}/customer/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword }),
          })

          if (!response.ok) {
            throw new Error('Error resetting password')
          }

          set({ isLoading: false })
        } catch (error: any) {
          const errorMsg = error.message || 'Error resetting password'
          set({ error: errorMsg, isLoading: false })
          throw error
        }
      },

      updateProfile: async (data: Partial<ICustomer>) => {
        const state = get()
        if (!state.token) throw new Error('Not authenticated')

        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`${API_BASE_URL}/customers/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${state.token}`,
            },
            body: JSON.stringify(data),
          })

          if (!response.ok) {
            throw new Error('Error updating profile')
          }

          const result = await response.json()
          set({ customer: result.customer, isLoading: false })
        } catch (error: any) {
          const errorMsg = error.message || 'Error updating profile'
          set({ error: errorMsg, isLoading: false })
          throw error
        }
      },

      fetchProfile: async () => {
        const state = get()
        if (!state.token) throw new Error('Not authenticated')

        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`${API_BASE_URL}/customers/profile`, {
            headers: { Authorization: `Bearer ${state.token}` },
          })

          if (!response.ok) {
            throw new Error('Error fetching profile')
          }

          const customer: ICustomer = await response.json()
          set({ customer, isLoading: false })
        } catch (error: any) {
          const errorMsg = error.message || 'Error fetching profile'
          set({ error: errorMsg, isLoading: false })
          throw error
        }
      },
    }),
    {
      name: 'customer-store',
      partialize: (state) => ({ token: state.token, customer: state.customer, isLoggedIn: state.isLoggedIn }),
    }
  )
)
