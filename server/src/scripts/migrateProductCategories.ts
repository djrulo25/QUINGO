import '../config/env.js'
import { connectDB } from '../config/database.js'
import Product from '../models/Product.js'
import Category from '../models/Category.js'

const legacyCategoryMap: Record<string, string> = {
  welding: 'soldadura',
  safety: 'proteccion-industrial',
  gases: 'gases'
}

const legacySubcategoryMap: Record<string, string> = {
  electrodos: 'electrodos',
  maquinas: 'maquinas',
  accesorios: 'accesorios',
  guantes: 'guantes',
  cascos: 'cascos',
  reguladores: 'reguladores',
  mangueras: 'mangueras'
}

async function migrateProductCategories() {
  await connectDB()

  const rootCategory = await Category.findOne({ slug: 'todos-los-productos' })
  if (!rootCategory) {
    throw new Error('Root category not found. Run seed:categories first.')
  }

  const categories = await Category.find({ active: true }).lean()
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]))

  const products = await Product.find({})

  for (const product of products) {
    const oldCategorySlug = legacyCategoryMap[product.category?.toLowerCase()] || product.category?.toLowerCase()
    const normalizedCategorySlug = oldCategorySlug || 'soldadura'
    const mappedCategory = categoryBySlug.get(normalizedCategorySlug)

    const legacySubcategory = (product.subcategory || '').toString().trim().toLowerCase()
    const mappedSubcategorySlug = legacySubcategoryMap[legacySubcategory] || legacySubcategory || ''
    const mappedSubcategory = categoryBySlug.get(mappedSubcategorySlug)

    const updates: any = {
      categorySlug: normalizedCategorySlug,
      subcategorySlug: mappedSubcategorySlug,
    }

    if (mappedCategory) {
      updates.categoryId = mappedCategory._id
    }

    if (mappedSubcategory) {
      updates.subcategory = mappedSubcategory.name
    }

    await Product.findByIdAndUpdate(product._id, updates, { new: true })
  }

  console.log(`✅ Migrated ${products.length} products to category tree references`)
  process.exit(0)
}

migrateProductCategories().catch((error) => {
  console.error('Error migrating product categories:', error)
  process.exit(1)
})
