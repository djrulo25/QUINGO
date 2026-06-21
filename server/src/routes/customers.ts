import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import Customer from '../models/Customer.js'
import { customerAuthMiddleware } from '../middleware/customerAuth.js'
import { IAddress } from '../models/Customer.js'

const router = Router()

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

      const customer = await Customer.findByIdAndUpdate(
        req.customer?.id,
        {
          firstName,
          lastName,
          phone,
          dateOfBirth,
          cpf,
          company,
        },
        { new: true }
      ).select('-password')

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' })
      }

      res.json({
        message: 'Profile updated successfully',
        customer,
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

// Get order history (protected)
router.get('/orders', customerAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const Order = (await import('../models/Order.js')).default

    const orders = await Order.find({
      'customer.email': req.customer?.email,
    })
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
    if (order.customer.email !== req.customer?.email) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    res.json(order)
  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json({ error: 'Error fetching order' })
  }
})

export default router
