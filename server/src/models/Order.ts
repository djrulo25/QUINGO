import mongoose, { Schema, Document } from 'mongoose'

export interface IOrder extends Document {
  orderNumber: string
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
    company?: string
  }
  items: Array<{
    productId: string
    quantity: number
    price: number
  }>
  shippingAddress: {
    street: string
    number: string
    complement?: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  shippingMethod: string
  shippingCost: number
  subtotal: number
  tax?: number
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  paymentMethod: string
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentIntentId?: string
  oxxoVoucherUrl?: string
  notes?: string
  trackingNumber?: string
  returnReason?: string
  serviceRequest?: {
    type: 'cancellation' | 'return'
    status: 'pending' | 'approved' | 'rejected'
    reason: string
    customerComments?: string
    resolutionNotes?: string
    requestedAt: Date
    resolvedAt?: Date
  }
  confirmationToken: string
  createdAt: Date
  updatedAt: Date
  deliveredAt?: Date
}

const serviceRequestSchema = new Schema({
  type: { type: String, enum: ['cancellation', 'return'], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], required: true },
  reason: { type: String, required: true },
  customerComments: String,
  resolutionNotes: String,
  requestedAt: { type: Date, required: true },
  resolvedAt: Date,
}, { _id: false })

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },
    customer: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      company: String
    },
    items: [{
      productId: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }
    }],
    shippingAddress: {
      street: { type: String, required: true },
      number: { type: String, required: true },
      complement: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true }
    },
    shippingMethod: {
      type: String,
      required: true
    },
    shippingCost: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    },
    tax: {
      type: Number,
    },
    total: {
      type: Number,
      required: true
    },
    paymentIntentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    oxxoVoucherUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    notes: String,
    trackingNumber: String,
    returnReason: String,
    deliveredAt: Date,
    serviceRequest: { type: serviceRequestSchema, default: undefined },
    confirmationToken: { type: String, required: true, unique: true, index: true, select: false }
  },
  { timestamps: true }
)

export default mongoose.model<IOrder>('Order', orderSchema)
