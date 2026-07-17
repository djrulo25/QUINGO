import { Router, Request, Response } from 'express'
import { randomBytes } from 'crypto'
import Stripe from 'stripe'
import Order from '../models/Order.js'
import { sendOrderEmail } from '../utils/email.js'
import { authMiddleware } from '../middleware/auth.js'
import { calculateOrder } from '../services/commerce.js'

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-04-10' as any })

router.get('/', authMiddleware, async (_req: Request, res: Response) => {
  try { res.json(await Order.find().sort({ createdAt: -1 })) }
  catch { res.status(500).json({ error: 'Error fetching orders' }) }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const pricing = await calculateOrder(req.body.items, req.body.shippingMethod)
    const paymentMethod = String(req.body.paymentMethod || '')
    let paymentStatus: 'pending' | 'completed' = 'pending'
    let status: 'pending' | 'confirmed' = 'pending'

    if (paymentMethod === 'credit-card') {
      if (!req.body.paymentIntentId) return res.status(400).json({ error: 'Falta la confirmación del pago' })
      if (await Order.exists({ paymentIntentId: req.body.paymentIntentId })) {
        return res.status(409).json({ error: 'Este pago ya fue utilizado en otro pedido' })
      }
      const intent = await stripe.paymentIntents.retrieve(req.body.paymentIntentId)
      if (intent.status !== 'succeeded' || intent.currency !== 'mxn' || intent.amount !== Math.round(pricing.total * 100)) {
        return res.status(400).json({ error: 'El pago no coincide con el total del pedido' })
      }
      paymentStatus = 'completed'
      status = 'confirmed'
    }

    const confirmationToken = randomBytes(32).toString('hex')
    const order = new Order({
      customer: req.body.customer,
      shippingAddress: req.body.shippingAddress,
      shippingMethod: req.body.shippingMethod,
      paymentMethod,
      paymentIntentId: req.body.paymentIntentId,
      orderNumber: `ORD-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`,
      confirmationToken,
      paymentStatus,
      status,
      ...pricing,
    })
    await order.save()

    if (paymentMethod !== 'oxxo') {
      sendOrderEmail(order).catch((error) => console.error('Failed to send order email:', error))
    }
    const response = order.toObject()
    res.status(201).json({ ...response, confirmationToken })
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error creating order' })
  }
})

router.get('/confirmation/:id', async (req: Request, res: Response) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, confirmationToken: req.query.token }).select('+confirmationToken')
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado o enlace inválido' })
    const response = order.toObject() as any
    delete response.confirmationToken
    res.json(response)
  } catch { res.status(404).json({ error: 'Pedido no encontrado o enlace inválido' }) }
})

router.get('/customer/:email', authMiddleware, async (req: Request, res: Response) => {
  try { res.json(await Order.find({ 'customer.email': req.params.email })) }
  catch { res.status(500).json({ error: 'Error fetching orders' }) }
})

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
  } catch { res.status(404).json({ error: 'Order not found' }) }
})

router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const allowed = ['status', 'paymentStatus', 'paymentIntentId', 'oxxoVoucherUrl', 'notes']
    const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)))
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
  } catch { res.status(400).json({ error: 'Error updating order' }) }
})

export default router
