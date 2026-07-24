import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import Customer from '../models/Customer.js'
import { customerAuthMiddleware } from '../middleware/customerAuth.js'
import { IAddress } from '../models/Customer.js'
import { sendServiceRequestNotification } from '../utils/email.js'
import jwt from 'jsonwebtoken'

const router = Router()
const JWT_SECRET = (() => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required')
  return process.env.JWT_SECRET
})()

// Get customer profile (protected)
router.get('/profile', customerAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findById(req.customer?.id).select('-password')
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    res.json(customer)
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Error fetching profile' })
  }
})

// Update customer profile (protected)
router.put(
  '/profile',
  customerAuthMiddleware,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('phone').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
    body('dateOfBirth').optional().isISO8601(),
    body('cpf').optional().trim(),
    body('company').optional().trim(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { firstName, lastName, phone, dateOfBirth, cpf, company } = req.body
      const requestedEmail = String(req.body.email || '').trim().toLowerCase()
      const customer = await Customer.findById(req.customer?.id)

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' })
      }
      if (requestedEmail && requestedEmail !== customer.email) {
        if (!req.body.currentPassword || !(await customer.comparePassword(req.body.currentPassword))) {
          return res.status(400).json({ error: 'La contraseña actual no es correcta' })
        }
        if (await Customer.exists({ email: requestedEmail, _id: { $ne: customer._id } })) {
          return res.status(409).json({ error: 'Ese correo ya está registrado' })
        }
        customer.previousEmails = Array.from(new Set([...(customer.previousEmails || []), customer.email]))
        customer.email = requestedEmail
      }
      if (firstName !== undefined) customer.firstName = firstName
      if (lastName !== undefined) customer.lastName = lastName
      if (phone !== undefined) customer.phone = phone
      if (dateOfBirth !== undefined) customer.dateOfBirth = dateOfBirth || undefined
      if (cpf !== undefined) customer.cpf = cpf
      if (company !== undefined) customer.company = company
      await customer.save()
      const token = jwt.sign({ id: customer._id, email: customer.email }, JWT_SECRET, { expiresIn: '30d' })
      const safeCustomer = customer.toObject() as any
      delete safeCustomer.password

      res.json({
        message: 'Profile updated successfully',
        customer: safeCustomer,
        token,
      })
    } catch (error: any) {
      console.error('Update profile error:', error)
      if (error.code === 11000) {
        return res.status(400).json({ error: 'CPF already registered' })
      }
      res.status(500).json({ error: 'Error updating profile' })
    }
  }
)

router.put(
  '/profile/password',
  customerAuthMiddleware,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' })
      if (req.body.currentPassword === req.body.newPassword) {
        return res.status(400).json({ error: 'La contraseña nueva debe ser diferente' })
      }
      const customer = await Customer.findById(req.customer?.id)
      if (!customer) return res.status(404).json({ error: 'Cliente no encontrado' })
      if (!(await customer.comparePassword(req.body.currentPassword))) {
        return res.status(400).json({ error: 'La contraseña actual no es correcta' })
      }
      customer.password = req.body.newPassword
      await customer.save()
      res.json({ message: 'Contraseña actualizada correctamente' })
    } catch (error) {
      res.status(500).json({ error: 'No se pudo cambiar la contraseña' })
    }
  },
)

// Add new address (protected)
router.post(
  '/addresses',
  customerAuthMiddleware,
  [
    body('label').isIn(['home', 'work', 'other']),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('phone').trim().notEmpty(),
    body('street').trim().notEmpty(),
    body('number').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('state').trim().notEmpty(),
    body('zipCode').trim().notEmpty(),
    body('country').trim().notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const customer = await Customer.findById(req.customer?.id)
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' })
      }

      const newAddress: IAddress = {
        label: req.body.label,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        street: req.body.street,
        number: req.body.number,
        complement: req.body.complement,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zipCode,
        country: req.body.country || 'Mexico',
        isDefault: customer.addresses.length === 0, // First address is default
      }

      customer.addresses.push(newAddress)
      await customer.save()

      res.status(201).json({
        message: 'Address added successfully',
        address: customer.addresses[customer.addresses.length - 1],
      })
    } catch (error) {
      console.error('Add address error:', error)
      res.status(500).json({ error: 'Error adding address' })
    }
  }
)

// Get all addresses (protected)
router.get('/addresses', customerAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findById(req.customer?.id)
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    res.json(customer.addresses)
  } catch (error) {
    console.error('Get addresses error:', error)
    res.status(500).json({ error: 'Error fetching addresses' })
  }
})

// Update address (protected)
router.put(
  '/addresses/:addressId',
  customerAuthMiddleware,
  [
    body('label').optional().isIn(['home', 'work', 'other']),
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('phone').optional().trim().notEmpty(),
    body('street').optional().trim().notEmpty(),
    body('number').optional().trim().notEmpty(),
    body('city').optional().trim().notEmpty(),
    body('state').optional().trim().notEmpty(),
    body('zipCode').optional().trim().notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const customer = await Customer.findById(req.customer?.id)
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' })
      }

      const address = customer.addresses.find(a => a._id?.toString() === req.params.addressId)
      if (!address) {
        return res.status(404).json({ error: 'Address not found' })
      }

      Object.assign(address, req.body)
      await customer.save()

      res.json({
        message: 'Address updated successfully',
        address,
      })
    } catch (error) {
      console.error('Update address error:', error)
      res.status(500).json({ error: 'Error updating address' })
    }
  }
)

// Set default address (protected)
router.put(
  '/addresses/:addressId/set-default',
  customerAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const customer = await Customer.findById(req.customer?.id)
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' })
      }

      // Remove default from all addresses
      customer.addresses.forEach((addr) => {
        addr.isDefault = false
      })

      // Set new default
      const address = customer.addresses.find(a => a._id?.toString() === req.params.addressId)
      if (!address) {
        return res.status(404).json({ error: 'Address not found' })
      }

      address.isDefault = true
      await customer.save()

      res.json({
        message: 'Default address set successfully',
        address,
      })
    } catch (error) {
      console.error('Set default address error:', error)
      res.status(500).json({ error: 'Error setting default address' })
    }
  }
)

// Delete address (protected)
router.delete(
  '/addresses/:addressId',
  customerAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const customer = await Customer.findById(req.customer?.id)
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' })
      }

      const address = customer.addresses.find(a => a._id?.toString() === req.params.addressId)
      if (!address) {
        return res.status(404).json({ error: 'Address not found' })
      }

      // If deleting default address, set another as default
      if (address.isDefault && customer.addresses.length > 1) {
        const otherAddress = customer.addresses.find((a) => a._id?.toString() !== req.params.addressId)
        if (otherAddress) {
          otherAddress.isDefault = true
        }
      }

      customer.addresses = customer.addresses.filter(a => a._id?.toString() !== req.params.addressId)
      await customer.save()

      res.json({ message: 'Address deleted successfully' })
    } catch (error) {
      console.error('Delete address error:', error)
      res.status(500).json({ error: 'Error deleting address' })
    }
  }
)

// Get customer cart (protected)
router.get('/cart', customerAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findById(req.customer?.id).select('cart')
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    res.json(customer.cart || { items: [], totalPrice: 0, totalItems: 0 })
  } catch (error) {
    console.error('Get cart error:', error)
    res.status(500).json({ error: 'Error fetching cart' })
  }
})

// Update customer cart (protected)
router.post('/cart', customerAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { items } = req.body

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Cart items must be an array' })
    }

    const sanitizedItems = items.map((item: any) => ({
      productId: item.product?.id || item.productId,
      name: item.product?.name || item.name,
      price: Number(item.product?.price ?? item.price ?? 0),
      basePrice: Number(item.product?.basePrice ?? item.basePrice ?? item.product?.price ?? item.price ?? 0),
      volumePricing: item.product?.volumePricing || item.volumePricing || [],
      image: item.product?.image || item.image,
      category: item.product?.category || item.category,
      subcategory: item.product?.subcategory || item.subcategory,
      sku: item.product?.sku || item.sku,
      quantity: Number(item.quantity ?? 0),
      addedAt: item.addedAt ? new Date(item.addedAt) : new Date(),
    })).filter((item: any) => item.productId && item.name && item.quantity > 0)

    const totalPrice = sanitizedItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    )
    const totalItems = sanitizedItems.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0
    )

    const customer = await Customer.findByIdAndUpdate(
      req.customer?.id,
      {
        cart: {
          items: sanitizedItems,
          totalPrice,
          totalItems,
        },
      },
      { new: true, select: 'cart' }
    )

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    res.json(customer.cart)
  } catch (error) {
    console.error('Update cart error:', error)
    res.status(500).json({ error: 'Error updating cart' })
  }
})

// Clear customer cart (protected)
router.delete('/cart', customerAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.customer?.id,
      { cart: { items: [], totalPrice: 0, totalItems: 0 } },
      { new: true, select: 'cart' }
    )

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    res.json(customer.cart)
  } catch (error) {
    console.error('Clear cart error:', error)
    res.status(500).json({ error: 'Error clearing cart' })
  }
})

// Get order history (protected)
router.get('/orders', customerAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const Order = (await import('../models/Order.js')).default

    const customer = await Customer.findById(req.customer?.id).select('email previousEmails')
    const emails = customer ? [customer.email, ...(customer.previousEmails || [])] : [req.customer?.email]
    const orders = await Order.find({ 'customer.email': { $in: emails } })
      .sort({ createdAt: -1 })
      .limit(50)

    res.json(orders)
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({ error: 'Error fetching order history' })
  }
})

// Get single order (protected)
router.get('/orders/:orderId', customerAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const Order = (await import('../models/Order.js')).default

    const order = await Order.findById(req.params.orderId)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Verify order belongs to customer
    const customer = await Customer.findById(req.customer?.id).select('email previousEmails')
    const allowedEmails = customer ? [customer.email, ...(customer.previousEmails || [])] : [req.customer?.email]
    if (!allowedEmails.includes(order.customer.email)) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    res.json(order)
  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json({ error: 'Error fetching order' })
  }
})

// Request a cancellation or return (protected)
router.post('/orders/:orderId/request', customerAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const Order = (await import('../models/Order.js')).default
    const order: any = await Order.findById(req.params.orderId)
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' })
    const customer = await Customer.findById(req.customer?.id).select('email previousEmails')
    const allowedEmails = customer ? [customer.email, ...(customer.previousEmails || [])] : [req.customer?.email]
    if (!allowedEmails.includes(order.customer.email)) return res.status(403).json({ error: 'No autorizado' })

    const type = String(req.body.type || '')
    const reason = String(req.body.reason || '').trim()
    const comments = String(req.body.comments || '').trim()
    if (!['cancellation', 'return'].includes(type) || !reason) {
      return res.status(400).json({ error: 'Selecciona el tipo y el motivo de la solicitud' })
    }
    if (order.serviceRequest?.status === 'pending') {
      return res.status(409).json({ error: 'Este pedido ya tiene una solicitud pendiente' })
    }
    if (type === 'cancellation' && !['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ error: 'Solo se puede cancelar antes de que el pedido sea enviado' })
    }
    if (type === 'return') {
      if (order.status !== 'delivered') {
        return res.status(400).json({ error: 'La devolución se solicita después de que el pedido fue entregado' })
      }
      const deliveredReference = order.deliveredAt || order.updatedAt || order.createdAt
      const days = (Date.now() - new Date(deliveredReference).getTime()) / 86400000
      if (days > 30) return res.status(400).json({ error: 'El periodo de devolución de 30 días terminó' })
    }

    order.serviceRequest = {
      type,
      status: 'pending',
      reason,
      customerComments: comments,
      requestedAt: new Date(),
    }
    await order.save()
    sendServiceRequestNotification(order).catch((error) => console.error('Service request email failed:', error))
    res.json(order)
  } catch (error) {
    console.error('Order request error:', error)
    res.status(500).json({ error: 'No se pudo registrar la solicitud' })
  }
})

export default router
