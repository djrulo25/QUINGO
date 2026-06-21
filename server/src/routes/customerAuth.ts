import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import Customer from '../models/Customer.js'
import nodemailer from 'nodemailer'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production'

// Email transporter for password recovery
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// Register new customer
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('phone').trim().notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email, password, firstName, lastName, phone } = req.body

      // Check if customer already exists
      const existingCustomer = await Customer.findOne({ email })
      if (existingCustomer) {
        return res.status(400).json({ error: 'Email already registered' })
      }

      // Create new customer
      const customer = new Customer({
        email,
        password,
        firstName,
        lastName,
        phone,
      })

      await customer.save()

      // Generate token
      const token = jwt.sign(
        { id: customer._id, email: customer.email },
        JWT_SECRET,
        { expiresIn: '30d' }
      )

      res.status(201).json({
        message: 'Customer registered successfully',
        token,
        customer: {
          id: customer._id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
        },
      })
    } catch (error) {
      console.error('Register error:', error)
      res.status(500).json({ error: 'Error registering customer' })
    }
  }
)

// Login customer
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email, password } = req.body

      const customer = await Customer.findOne({ email })
      if (!customer) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const isPasswordValid = await customer.comparePassword(password)
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const token = jwt.sign(
        { id: customer._id, email: customer.email },
        JWT_SECRET,
        { expiresIn: '30d' }
      )

      res.json({
        message: 'Login successful',
        token,
        customer: {
          id: customer._id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          profileImage: customer.profileImage,
          addresses: customer.addresses,
        },
      })
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({ error: 'Error logging in' })
    }
  }
)

// Verify token
router.get('/verify', (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    res.json({ valid: true, customer: decoded })
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
})

// Request password recovery
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email } = req.body

      const customer = await Customer.findOne({ email })
      if (!customer) {
        // Don't reveal if email exists
        return res.json({ message: 'If email exists, recovery link has been sent' })
      }

      // Generate temporary token (valid for 1 hour)
      const resetToken = jwt.sign(
        { id: customer._id, email: customer.email },
        JWT_SECRET,
        { expiresIn: '1h' }
      )

      // In production, send email with reset link
      if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'QUINGO - Recuperar Contraseña',
          html: `
            <h2>Recuperar Contraseña</h2>
            <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
            <a href="${resetLink}">${resetLink}</a>
            <p>Este enlace es válido por 1 hora.</p>
            <p>Si no solicitaste este cambio, ignora este correo.</p>
          `,
        })
      }

      res.json({ message: 'If email exists, recovery link has been sent' })
    } catch (error) {
      console.error('Forgot password error:', error)
      res.status(500).json({ error: 'Error processing request' })
    }
  }
)

// Reset password
router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { token, newPassword } = req.body

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as any

      // Update customer password
      const customer = await Customer.findById(decoded.id)
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' })
      }

      customer.password = newPassword
      await customer.save()

      res.json({ message: 'Password reset successfully' })
    } catch (error) {
      console.error('Reset password error:', error)
      res.status(400).json({ error: 'Invalid or expired token' })
    }
  }
)

export default router
