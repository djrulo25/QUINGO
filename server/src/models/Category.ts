import mongoose, { Schema, Document } from 'mongoose'

export type AttributeType = 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'textarea'

export interface ICategoryAttribute {
  key: string
  name: string
  type: AttributeType
  options: string[]
  required: boolean
  filterable: boolean
  unit?: string
  placeholder?: string
  order: number
}

export interface ICategory extends Document {
  name: string
  slug: string
  parent?: mongoose.Types.ObjectId | null
  level: number
  order: number
  path: string
  image?: string
  description?: string
  active: boolean
  attributes: ICategoryAttribute[]
  createdAt: Date
  updatedAt: Date
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true
    },
    level: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    order: {
      type: Number,
      default: 0
    },
    path: {
      type: String,
      required: true,
      index: true
    },
    image: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean,
      default: true
    },
    attributes: [{
      key: { type: String, required: true, trim: true, lowercase: true },
      name: { type: String, required: true, trim: true },
      type: {
        type: String,
        enum: ['text', 'number', 'select', 'checkbox', 'date', 'textarea'],
        default: 'text'
      },
      options: { type: [String], default: [] },
      required: { type: Boolean, default: false },
      filterable: { type: Boolean, default: true },
      unit: { type: String, default: '', trim: true },
      placeholder: { type: String, default: '', trim: true },
      order: { type: Number, default: 0 },
      _id: false
    }]
  },
  { timestamps: true }
)

let CategoryModel: mongoose.Model<ICategory>

const syncCategoryTreeMeta = async (category: any) => {
  const parentId = category.parent || null
  const slug = category.slug?.trim().toLowerCase()

  if (!slug) {
    return
  }

  const parent = parentId ? await CategoryModel.findById(parentId).lean() : null
  if (parentId && !parent) {
    throw new Error('La categoría padre seleccionada no existe')
  }
  const parentDoc = parent as any
  const level = parentDoc ? parentDoc.level + 1 : 0
  const path = parentDoc ? `${parentDoc.path}/${slug}` : slug

  category.level = level
  category.path = path

  if (!category.order && category.order !== 0) {
    const siblings = await CategoryModel.find({ parent: parentId }).sort({ order: -1, createdAt: -1 }).limit(1)
    category.order = siblings[0]?.order ? siblings[0].order + 1 : 0
  }
}

categorySchema.pre('validate', async function (next) {
  await syncCategoryTreeMeta(this)
  next()
})

categorySchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any
  if (!update || typeof update !== 'object') {
    return next()
  }

  const query = this.getQuery()
  const current = await CategoryModel.findById(query._id).lean()
  const currentDoc = current as any
  const slug = update.slug?.trim?.().toLowerCase() || currentDoc?.slug
  const parentId = update.parent ?? currentDoc?.parent ?? null
  const parent = parentId ? await CategoryModel.findById(parentId).lean() : null
  if (parentId && !parent) {
    return next(new Error('La categoría padre seleccionada no existe'))
  }
  const parentDoc = parent as any

  update.level = parentDoc ? parentDoc.level + 1 : 0
  update.path = parentDoc ? `${parentDoc.path}/${slug}` : slug

  if (typeof update.order !== 'number') {
    update.order = currentDoc?.order ?? 0
  }

  next()
})

// Los middlewares deben registrarse antes de compilar el modelo.
CategoryModel = mongoose.models.Category as mongoose.Model<ICategory>
  || mongoose.model<ICategory>('Category', categorySchema)

export default CategoryModel
