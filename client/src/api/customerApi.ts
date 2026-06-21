import axios from 'axios'
import { ICustomer, IAddress, IOrder } from '../types/customer'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('customer-store')
    ? JSON.parse(localStorage.getItem('customer-store')!).state?.token
    : null

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const customerAPI = {
  // Profile
  getProfile: () => api.get<ICustomer>('/customers/profile'),
  updateProfile: (data: Partial<ICustomer>) => api.put('/customers/profile', data),

  // Addresses
  getAddresses: () => api.get<IAddress[]>('/customers/addresses'),
  addAddress: (address: Omit<IAddress, '_id'>) => api.post('/customers/addresses', address),
  updateAddress: (addressId: string, data: Partial<IAddress>) =>
    api.put(`/customers/addresses/${addressId}`, data),
  setDefaultAddress: (addressId: string) => api.put(`/customers/addresses/${addressId}/set-default`),
  deleteAddress: (addressId: string) => api.delete(`/customers/addresses/${addressId}`),

  // Orders
  getOrders: () => api.get<IOrder[]>('/customers/orders'),
  getOrder: (orderId: string) => api.get<IOrder>(`/customers/orders/${orderId}`),
}

export default api
