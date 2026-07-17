import mongoose, { Schema, Document } from 'mongoose'

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
    }
  },
  { timestamps: true }
)

const CategoryModel = mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema)

const syncCategoryTreeMeta = async (category: any) => {
  const parentId = category.parent || null
  const slug = category.slug?.trim().toLowerCase()

  if (!slug) {
    return
  }

  const parent = parentId ? await CategoryModel.findById(parentId).lean() : null
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
  const parentDoc = parent as any

  update.level = parentDoc ? parentDoc.level + 1 : 0
  update.path = parentDoc ? `${parentDoc.path}/${slug}` : slug

  if (typeof update.order !== 'number') {
    update.order = currentDoc?.order ?? 0
  }

  next()
})

export default CategoryModel
