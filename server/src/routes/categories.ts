import { Router, Request, Response } from 'express'
import Category from '../models/Category.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// Get all categories as hierarchical menu
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({ active: true }).sort({ level: 1, order: 1, name: 1 })

    const tree = categories.reduce((acc: any[], category: any) => {
      acc.push({
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        parentId: category.parent?.toString() || null,
        level: category.level,
        path: category.path,
        children: []
      })
      return acc
    }, [])

    const map = new Map(tree.map((item) => [item.id, item]))

    const rootNodes: any[] = []
    for (const item of tree) {
      if (!item.parentId) {
        rootNodes.push(item)
      } else {
        const parent = map.get(item.parentId)
        if (parent) {
          parent.children.push(item)
        }
      }
    }

    res.json(rootNodes)
  } catch (error) {
    res.status(500).json({ error: 'Error fetching categories' })
  }
})

// Get all categories for admin management
router.get('/admin', authMiddleware, async (req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ level: 1, order: 1, name: 1 })
    res.json(categories)
  } catch (error) {
    res.status(500).json({ error: 'Error fetching categories for admin' })
  }
})

// Create category
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const category = new Category(req.body)
    await category.save()
    res.status(201).json(category)
  } catch (error) {
    res.status(400).json({ error: 'Error creating category' })
  }
})

// Update category
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }

    res.json(category)
  } catch (error) {
    res.status(400).json({ error: 'Error updating category' })
  }
})

// Delete category
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)

    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }

    res.json({ message: 'Category deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Error deleting category' })
  }
})

export default router
