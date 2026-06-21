import { Router, Request, Response } from 'express'
import Product from '../models/Product.js'
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
    subcategory: doc.subcategory,
    stock: doc.stock,
    rating: doc.rating,
    reviews: doc.reviews,
    sku: doc.sku,
    specifications: doc.specifications,
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
  }
}

// Get all products with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, subcategory, priceMin, priceMax, search, inStock } = req.query

    let query: any = {}

    if (category) query.category = category
    if (subcategory) query.subcategory = subcategory
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
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
    const product = new Product(req.body)
    await product.save()
    res.status(201).json(transformProduct(product))
  } catch (error) {
    res.status(400).json({ error: 'Error creating product' })
  }
})

// Update product (Admin)
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
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
