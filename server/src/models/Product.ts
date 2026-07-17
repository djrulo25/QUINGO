import mongoose, { Schema, Document } from 'mongoose'

export interface IProduct extends Document {
  name: string
  description: string
  price: number
  originalPrice?: number
  image: string
  images?: string[]
  category: string
  categorySlug?: string
  categoryId?: mongoose.Types.ObjectId
  subcategory: string
  subcategorySlug?: string
  stock: number
  rating: number
  reviews: number
  sku: string
  specifications?: Record<string, string>
  attributes?: Record<string, unknown>
  volumePricing?: { minQuantity: number; discountPercent: number }[]
  documents?: { name: string; url: string }[]
  faqs?: { question: string; answer: string }[]
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
      required: true,
      trim: true
    },
    categorySlug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true
    },
    subcategory: {
      type: String,
      required: true,
      trim: true
    },
    subcategorySlug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true
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
    },
    attributes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {}
    },
    volumePricing: [{
      minQuantity: { type: Number, required: true, min: 2 },
      discountPercent: { type: Number, required: true, min: 0, max: 100 },
      _id: false
    }],
    documents: [{
      name: { type: String, required: true, trim: true },
      url: { type: String, required: true, trim: true },
      _id: false
    }],
    faqs: [{
      question: { type: String, required: true, trim: true },
      answer: { type: String, required: true, trim: true },
      _id: false
    }]
  },
  { timestamps: true }
)

export default mongoose.model<IProduct>('Product', productSchema)
