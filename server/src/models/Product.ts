import mongoose, { Schema, Document } from 'mongoose'

export interface IProduct extends Document {
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
  createdAt: Date
  updatedAt: Date
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    originalPrice: {
      type: Number,
      min: 0
    },
    image: {
      type: String,
      required: true
    },
    images: [String],
    category: {
      type: String,
      enum: ['welding', 'safety', 'gases'],
      required: true
    },
    subcategory: {
      type: String,
      required: true
    },
    stock: {
      type: Number,
      required: true,
      default: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviews: {
      type: Number,
      default: 0
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    specifications: {
      type: Map,
      of: String
    }
  },
  { timestamps: true }
)

export default mongoose.model<IProduct>('Product', productSchema)
