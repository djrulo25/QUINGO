import { Router, Request, Response } from 'express'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import Order from '../models/Order.js'
import { authMiddleware, requirePermission } from '../middleware/auth.js'
import { deleteCloudinaryAsset } from '../utils/cloudinaryAssets.js'

const router = Router()
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Helper function to transform MongoDB document to API response
function transformProduct(doc: any) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    price: doc.price,
    originalPrice: doc.originalPrice,
    image: doc.image,
    images: doc.images || [],
    category: doc.category,
    categorySlug: doc.categorySlug,
    categoryId: doc.categoryId?.toString?.() || null,
    subcategory: doc.subcategory,
    subcategorySlug: doc.subcategorySlug,
    stock: doc.stock,
    rating: doc.rating,
    reviews: doc.reviews,
    sku: doc.sku,
    satProductCode: doc.satProductCode || '',
    satUnitCode: doc.satUnitCode || '',
    taxObject: doc.taxObject || '02',
    ivaRate: doc.ivaRate ?? 16,
    specifications: doc.specifications,
    attributes: doc.attributes ? Object.fromEntries(doc.attributes) : {},
    volumePricing: doc.volumePricing || [],
    documents: doc.documents || [],
    faqs: doc.faqs || [],
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
  }
}

// Get all products with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, subcategory, priceMin, priceMax, search, inStock, attributeFilters } = req.query

    let query: any = {}
    const conditions: any[] = []

    if (category) {
      conditions.push({
        $or: [
          { categorySlug: category },
          { category: category }
        ]
      })
    }

    if (subcategory) {
      conditions.push({
        $or: [
          { subcategorySlug: subcategory },
          { subcategory: subcategory }
        ]
      })
    }

    if (conditions.length > 0) {
      query.$and = conditions
    }

    if (search) {
      const safeSearch = escapeRegex(String(search).slice(0, 100))
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
        { sku: { $regex: safeSearch, $options: 'i' } },
        { category: { $regex: safeSearch, $options: 'i' } },
        { categorySlug: { $regex: safeSearch, $options: 'i' } },
        { subcategory: { $regex: safeSearch, $options: 'i' } },
        { subcategorySlug: { $regex: safeSearch, $options: 'i' } }
      ]
    }
    if (priceMin || priceMax) {
      query.price = {}
      if (priceMin) query.price.$gte = Number(priceMin)
      if (priceMax) query.price.$lte = Number(priceMax)
    }
    if (inStock === 'true') query.stock = { $gt: 0 }

    if (typeof attributeFilters === 'string' && attributeFilters) {
      const parsedFilters = JSON.parse(attributeFilters)
      if (!parsedFilters || typeof parsedFilters !== 'object' || Array.isArray(parsedFilters)) {
        return res.status(400).json({ error: 'Invalid attribute filters' })
      }

      for (const [key, value] of Object.entries(parsedFilters)) {
        if (!/^[a-z0-9_]+$/.test(key)) continue
        const field = `attributes.${key}`
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const range = value as { min?: unknown; max?: unknown }
          const numericRange: Record<string, number> = {}
          if (range.min !== undefined && range.min !== '') numericRange.$gte = Number(range.min)
          if (range.max !== undefined && range.max !== '') numericRange.$lte = Number(range.max)
          if (Object.values(numericRange).every(Number.isFinite)) query[field] = numericRange
        } else if (typeof value === 'boolean') {
          query[field] = value
        } else if (typeof value === 'string' && value.trim()) {
          query[field] = value.trim()
        }
      }
    }

    const products = await Product.find(query).limit(100)
    res.json(products.map(transformProduct))
  } catch (error) {
    res.status(500).json({ error: 'Error fetching products' })
  }
})

async function validateAttributes(payload: any) {
  if (!payload.categoryId) return null

  const category: any = await Category.findById(payload.categoryId).lean()
  if (!category) return 'La categoría seleccionada no existe'

  const values = payload.attributes || {}
  for (const attribute of category.attributes || []) {
    const value = values[attribute.key]
    const isEmpty = value === undefined || value === null || value === ''
    if (attribute.required && isEmpty) return `${attribute.name} es obligatorio`
    if (isEmpty) continue
    if (attribute.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) {
      return `${attribute.name} debe ser numérico`
    }
    if (attribute.type === 'checkbox' && typeof value !== 'boolean') {
      return `${attribute.name} debe ser verdadero o falso`
    }
    if (attribute.type === 'select' && !attribute.options.includes(String(value))) {
      return `${attribute.name} contiene una opción no válida`
    }
  }

  const allowedKeys = new Set<string>((category.attributes || []).map((attribute: any) => attribute.key))
  payload.attributes = Object.fromEntries(Object.entries(values).filter(([key]) => allowedKeys.has(key)))
  return null
}

router.get('/top-selling', async (_req: Request, res: Response) => {
  try {
    const sales = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.productId', quantity: { $sum: '$items.quantity' } } },
      { $sort: { quantity: -1 } },
      { $limit: 8 },
    ])
    const products = await Product.find({ _id: { $in: sales.map((sale) => sale._id) } })
    const byId = new Map(products.map((product: any) => [product._id.toString(), product]))
    res.json(sales.map((sale) => byId.get(String(sale._id))).filter(Boolean).map(transformProduct))
  } catch {
    res.status(500).json({ error: 'Error fetching top-selling products' })
  }
})

router.get('/search', async (req: Request, res: Response) => {
  try {
    const term = String(req.query.q || '').trim()
    if (!term) return res.json([])
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const products = await Product.find({
      $or: [
        { name: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
        { sku: { $regex: escaped, $options: 'i' } },
        { category: { $regex: escaped, $options: 'i' } },
        { subcategory: { $regex: escaped, $options: 'i' } },
      ],
    }).limit(20)
    res.json(products.map(transformProduct))
  } catch {
    res.status(500).json({ error: 'Error searching products' })
  }
})

// Get product by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    res.json(transformProduct(product))
  } catch (error) {
    res.status(500).json({ error: 'Error fetching product' })
  }
})

// Create product (Admin)
router.post('/', authMiddleware, requirePermission('products'), async (req: Request, res: Response) => {
  try {
    const payload = req.body
    if (payload.category && !payload.categorySlug) {
      payload.categorySlug = payload.category
    }
    if (payload.subcategory && !payload.subcategorySlug) {
      payload.subcategorySlug = payload.subcategory
    }
    const attributeError = await validateAttributes(payload)
    if (attributeError) return res.status(400).json({ error: attributeError })

    const product = new Product(payload)
    await product.save()
    res.status(201).json(transformProduct(product))
  } catch (error) {
    res.status(400).json({ error: 'Error creating product' })
  }
})

// Update product (Admin)
router.put('/:id', authMiddleware, requirePermission('products'), async (req: Request, res: Response) => {
  try {
    const previous = await Product.findById(req.params.id).lean()
    if (!previous) return res.status(404).json({ error: 'Product not found' })
    const attributeError = await validateAttributes(req.body)
    if (attributeError) return res.status(400).json({ error: attributeError })
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    const keptAssets = new Set([req.body.image, ...(req.body.images || []), ...(req.body.documents || []).map((item: any) => item.url)].filter(Boolean))
    const previousAssets = [previous.image, ...(previous.images || []), ...(previous.documents || []).map((item: any) => item.url)].filter(Boolean)
    await Promise.all(previousAssets.filter((url) => !keptAssets.has(url)).map((url) => deleteCloudinaryAsset(url)))
    res.json(transformProduct(product))
  } catch (error) {
    res.status(400).json({ error: 'Error updating product' })
  }
})

// Delete product (Admin)
router.delete('/:id', authMiddleware, requirePermission('products'), async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    await Promise.all([product.image, ...(product.images || []), ...(product.documents || []).map((item: any) => item.url)].filter(Boolean).map((url) => deleteCloudinaryAsset(url)))
    res.json({ message: 'Product deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Error deleting product' })
  }
})

export default router
