import { Router, Request, Response } from 'express'
import Order from '../models/Order.js'

const router = Router()

// Get all orders (Admin)
router.get('/', async (req: Request, res: Response) => {
  try {
    // Verificar que sea admin
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const orders = await Order.find().sort({ createdAt: -1 })
    res.json(orders)
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders' })
  }
})

// Create order
router.post('/', async (req: Request, res: Response) => {
  try {
    const orderNumber = `ORD-${Date.now()}`
    const order = new Order({
      ...req.body,
      orderNumber,
      status: 'pending',
      paymentStatus: 'pending'
    })
    await order.save()
    res.status(201).json(order)
  } catch (error) {
    res.status(400).json({ error: 'Error creating order' })
  }
})

// Get all orders for customer (by email)
router.get('/customer/:email', async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ 'customer.email': req.params.email })
    res.json(orders)
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders' })
  }
})

// Get order by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    res.json(order)
  } catch (error) {
    res.status(500).json({ error: 'Error fetching order' })
  }
})

// Update order status (Admin)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    res.json(order)
  } catch (error) {
    res.status(400).json({ error: 'Error updating order' })
  }
})

export default router
