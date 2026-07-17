import { Router, Request, Response } from 'express'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

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
    specifications: doc.specifications,
    attributes: doc.attributes ? Object.fromEntries(doc.attributes) : {},
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
  }
}

// Get all products with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, subcategory, priceMin, priceMax, search, inStock } = req.query

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
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { categorySlug: { $regex: search, $options: 'i' } },
        { subcategory: { $regex: search, $options: 'i' } },
        { subcategorySlug: { $regex: search, $options: 'i' } }
      ]
    }
    if (priceMin || priceMax) {
      query.price = {}
      if (priceMin) query.price.$gte = Number(priceMin)
      if (priceMax) query.price.$lte = Number(priceMax)
    }
    if (inStock === 'true') query.stock = { $gt: 0 }

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
router.post('/', authMiddleware, async (req: Request, res: Response) => {
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
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
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
    res.json(transformProduct(product))
  } catch (error) {
    res.status(400).json({ error: 'Error updating product' })
  }
})

// Delete product (Admin)
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    res.json({ message: 'Product deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Error deleting product' })
  }
})

export default router
