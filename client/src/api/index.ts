import axios from 'axios'
import { Product, Order, Customer, Address, CategoryAttribute, StoreSettings } from '@/types'

const rawApiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://quingo-api.onrender.com/api'
const normalizedApiUrl = rawApiUrl.trim().replace(/\/+$/, '')
const configuredApiUrl = normalizedApiUrl.endsWith('/api') ? normalizedApiUrl : `${normalizedApiUrl}/api`
const API_BASE_URL = window.location.hostname.endsWith('vercel.app') ? '/api' : configuredApiUrl

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const getAdminAuthConfig = () => {
  const token = localStorage.getItem('adminToken')

  return token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : undefined
}

// Add token to requests if it exists
apiClient.interceptors.request.use((config) => {
  if (config.headers.Authorization) {
    return config
  }

  let token: string | null = null
  const customerStore = localStorage.getItem('customer-store')
  if (customerStore) {
    try {
      const parsed = JSON.parse(customerStore)
      token = parsed.state?.token
    } catch (e) {
      // Ignore parse errors
    }
  }

  if (!token) {
    token = localStorage.getItem('authToken')
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Products
export const productAPI = {
  getAll: (filters?: Record<string, any>) =>
    apiClient.get<Product[]>('/products', { params: filters }),
  getPage: (filters?: Record<string, any>) =>
    apiClient.get<{ items: Product[]; total: number; page: number; pageSize: number; totalPages: number }>('/products', {
      params: { ...filters, paginated: true },
    }),
  getById: (id: string) => apiClient.get<Product>(`/products/${id}`),
  search: (query: string) =>
    apiClient.get<Product[]>('/products/search', { params: { q: query } }),
  getTopSelling: () => apiClient.get<Product[]>('/products/top-selling'),
}

// Orders
export const orderAPI = {
  create: (orderData: Partial<Order>) =>
    apiClient.post<Order>('/orders', orderData),
  getById: (orderId: string) => apiClient.get<Order>(`/orders/${orderId}`),
  getConfirmation: (orderId: string, token: string) =>
    apiClient.get<Order>(`/orders/confirmation/${orderId}`, { params: { token } }),
  getMyOrders: () => apiClient.get<Order[]>('/orders/me'),
}

// Cart
export const cartAPI = {
  get: (token?: string) =>
    apiClient.get('/customers/cart', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),
  sync: (items: any[], token?: string) =>
    apiClient.post('/customers/cart', { items }, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),
  clear: (token?: string) =>
    apiClient.delete('/customers/cart', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),
}

// Customers
export const customerAPI = {
  register: (data: Partial<Customer>) =>
    apiClient.post<Customer>('/customer/auth/register', data),
  getProfile: () => apiClient.get<Customer>('/customers/profile'),
  updateProfile: (data: Partial<Customer>) =>
    apiClient.put<Customer>('/customers/profile', data),
  getAddresses: () => apiClient.get('/customers/addresses'),
  addAddress: (address: any) => apiClient.post('/customers/addresses', address),
  updateAddress: (addressId: string, data: Partial<Address>) =>
    apiClient.put(`/customers/addresses/${addressId}`, data),
  setDefaultAddress: (addressId: string) =>
    apiClient.put(`/customers/addresses/${addressId}/set-default`),
  deleteAddress: (addressId: string) =>
    apiClient.delete(`/customers/addresses/${addressId}`),
  getOrders: () => apiClient.get('/customers/orders'),
}

// Categories
export const categoryAPI = {
  getAll: () => apiClient.get('/categories'),
  getAllAdmin: () => apiClient.get('/categories/admin', getAdminAuthConfig()),
  getAttributes: (id: string) => apiClient.get<CategoryAttribute[]>(`/categories/${id}/attributes`),
  create: (data: Record<string, any>) => apiClient.post('/categories', data, getAdminAuthConfig()),
  update: (id: string, data: Record<string, any>) => apiClient.put(`/categories/${id}`, data, getAdminAuthConfig()),
  delete: (id: string) => apiClient.delete(`/categories/${id}`, getAdminAuthConfig()),
}

export const storeSettingsAPI = {
  getPublic: () => apiClient.get<StoreSettings>('/store-settings'),
  getAdmin: () => apiClient.get<StoreSettings>('/store-settings/admin', getAdminAuthConfig()),
  update: (data: StoreSettings) => apiClient.put<StoreSettings>('/store-settings', data, getAdminAuthConfig()),
  uploadLogo: async (formData: FormData) => {
    const token = localStorage.getItem('adminToken')
    const response = await fetch(`${API_BASE_URL}/uploads/branding`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const error = new Error(data.error || 'No se pudo subir la imagen') as Error & { response?: { data: any } }
      error.response = { data }
      throw error
    }
    return { data }
  },
}

export const catalogImportAPI = {
  validate: (data: object) => apiClient.post('/import/catalog', { ...data, dryRun: true }, getAdminAuthConfig()),
  commit: (data: object) => apiClient.post('/import/catalog', { ...data, dryRun: false }, getAdminAuthConfig()),
}

export const adminAccessAPI = {
  getProfiles: () => apiClient.get('/admin-access/profiles', getAdminAuthConfig()),
  createProfile: (data: object) => apiClient.post('/admin-access/profiles', data, getAdminAuthConfig()),
  updateProfile: (id: string, data: object) => apiClient.put(`/admin-access/profiles/${id}`, data, getAdminAuthConfig()),
  deleteProfile: (id: string) => apiClient.delete(`/admin-access/profiles/${id}`, getAdminAuthConfig()),
  getUsers: () => apiClient.get('/admin-access/users', getAdminAuthConfig()),
  createUser: (data: object) => apiClient.post('/admin-access/users', data, getAdminAuthConfig()),
  updateUser: (id: string, data: object) => apiClient.put(`/admin-access/users/${id}`, data, getAdminAuthConfig()),
}

export default apiClient
