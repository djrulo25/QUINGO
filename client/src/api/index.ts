import axios from 'axios'
import { Product, Order, Customer, Address } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if it exists
apiClient.interceptors.request.use((config) => {
  // Try to get token from customer store first, then fall back to authToken
  let token = null
  
  const customerStore = localStorage.getItem('customer-store')
  if (customerStore) {
    try {
      const parsed = JSON.parse(customerStore)
      token = parsed.state?.token
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  // Fall back to authToken if not found in customer store
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
  getById: (id: string) => apiClient.get<Product>(`/products/${id}`),
  search: (query: string) =>
    apiClient.get<Product[]>('/products/search', { params: { q: query } }),
}

// Orders
export const orderAPI = {
  create: (orderData: Partial<Order>) =>
    apiClient.post<Order>('/orders', orderData),
  getById: (orderId: string) => apiClient.get<Order>(`/orders/${orderId}`),
  getMyOrders: () => apiClient.get<Order[]>('/orders/me'),
}

// Cart
export const cartAPI = {
  sync: (items: any[]) => apiClient.post('/cart/sync', { items }),
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

// Addresses
export const addressAPI = {
  getAll: () => apiClient.get<Address[]>('/addresses'),
  create: (data: Address) => apiClient.post<Address>('/addresses', data),
  update: (id: string, data: Partial<Address>) =>
    apiClient.put<Address>(`/addresses/${id}`, data),
  delete: (id: string) => apiClient.delete(`/addresses/${id}`),
}

// Categories
export const categoryAPI = {
  getAll: () => apiClient.get('/categories'),
}

export default apiClient
