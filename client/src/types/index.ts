export interface Product {
  id: string
  name: string
  description: string
  price: number
  basePrice?: number
  originalPrice?: number
  image: string
  images?: string[]
  category: string
  categorySlug?: string
  categoryId?: string | null
  subcategory: string
  subcategorySlug?: string
  stock: number
  rating: number
  reviews: number
  sku: string
  satProductCode?: string
  satUnitCode?: string
  taxObject?: string
  ivaRate?: number
  specifications?: Record<string, string>
  attributes?: Record<string, string | number | boolean>
  volumePricing?: { minQuantity: number; discountPercent: number }[]
  documents?: { name: string; url: string }[]
  faqs?: { question: string; answer: string }[]
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
  id?: string
  _id?: string
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
  paymentIntentId?: string
  oxxoVoucherUrl?: string
  notes?: string
  confirmationToken?: string
  createdAt: string
  updatedAt: string
}

export interface CategoryTreeNode {
  id: string
  name: string
  slug: string
  description: string
  image: string
  parentId: string | null
  level: number
  path: string
  children: CategoryTreeNode[]
  attributes?: CategoryAttribute[]
}

export interface ShippingMethod {
  id: string
  name: string
  description: string
  price: number
  estimatedDays: string
  enabled: boolean
}

export interface StoreSettings {
  name: string
  logoUrl: string
  description: string
  currency: string
  colors: { primary: string; secondary: string; accent: string; header: string }
  contact: {
    phone: string
    whatsapp: string
    salesEmail: string
    supportEmail: string
    billingEmail: string
    businessHours: string
    address: string
    serviceArea: string
  }
  social: { facebook: string; instagram: string; linkedin: string; tiktok: string; youtube: string }
  home: {
    heroEyebrow: string
    heroTitle: string
    heroSubtitle: string
    heroImageUrl: string
    categoriesTitle: string
    categoriesSubtitle: string
    quoteTitle: string
    quoteDescription: string
    offersTitle: string
    offersSubtitle: string
    newTitle: string
    newSubtitle: string
    topTitle: string
    topSubtitle: string
    popularSearches: string[]
    footerTagline: string
  }
  fiscal: {
    legalName: string
    rfc: string
    taxRegime: string
    postalCode: string
    fiscalAddress: string
    invoiceEmail: string
  }
  shippingMethods: ShippingMethod[]
}

export type AttributeType = 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'textarea'

export interface CategoryAttribute {
  key: string
  name: string
  type: AttributeType
  options: string[]
  required: boolean
  filterable?: boolean
  unit?: string
  placeholder?: string
  order: number
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
  sortBy?: 'price-asc' | 'price-desc'
}
