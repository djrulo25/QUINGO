import mongoose, { Schema, Document } from 'mongoose'

export const ADMIN_MODULES = [
  'dashboard',
  'products',
  'categories',
  'orders',
  'deliveries',
  'returns',
  'reports',
  'settings',
  'profiles',
] as const

export type AdminModule = typeof ADMIN_MODULES[number]

export interface IAdminProfile extends Document {
  name: string
  description?: string
  permissions: AdminModule[]
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const adminProfileSchema = new Schema<IAdminProfile>({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true, default: '' },
  permissions: [{ type: String, enum: ADMIN_MODULES }],
  active: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model<IAdminProfile>('AdminProfile', adminProfileSchema)
