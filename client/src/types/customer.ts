export interface IAddress {
  _id?: string
  label: 'home' | 'work' | 'other'
  firstName: string
  lastName: string
  phone: string
  street: string
  number: string
  complement?: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault: boolean
  createdAt?: Date
}

export interface ICustomer {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  profileImage?: string
  addresses: IAddress[]
  dateOfBirth?: string
  cpf?: string
  company?: string
  createdAt?: string
  updatedAt?: string
}

export interface IOrder {
  _id: string
  orderNumber: string
  items: Array<{
    productId: string
    quantity: number
    price: number
  }>
  shippingAddress: IAddress
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  message?: string
  token: string
  customer: {
    id: string
    email: string
    firstName: string
    lastName: string
    phone: string
    profileImage?: string
    addresses?: IAddress[]
  }
}
