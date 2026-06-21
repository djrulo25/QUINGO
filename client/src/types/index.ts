export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  image: string
  images?: string[]
  category: 'welding' | 'safety' | 'gases'
  subcategory: string
  stock: number
  rating: number
  reviews: number
  sku: string
  specifications?: Record<string, string>
  createdAt: string
  updatedAt: string
}

export interface CartItem {
  id: string
  product: Product
  quantity: number
  addedAt: string
}

export interface Cart {
  items: CartItem[]
  totalPrice: number
  totalItems: number
}

export interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company?: string
  taxId?: string
}

export interface Address {
  id: string
  street: string
  number: string
  complement?: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault: boolean
}

export interface Order {
  id: string
  orderNumber: string
  customer: Customer
  items: CartItem[]
  shippingAddress: Address
  billingAddress: Address
  shippingMethod: string
  shippingCost: number
  subtotal: number
  tax: number
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: string
  paymentStatus: 'pending' | 'completed' | 'failed'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  image: string
  subcategories: Subcategory[]
}

export interface Subcategory {
  id: string
  name: string
  slug: string
  categoryId: string
}

export interface Review {
  id: string
  productId: string
  customerId: string
  rating: number
  title: string
  comment: string
  createdAt: string
}

export interface FilterOptions {
  category?: string
  subcategory?: string
  priceMin?: number
  priceMax?: number
  inStock?: boolean
  rating?: number
  search?: string
}
