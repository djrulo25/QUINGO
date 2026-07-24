import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const JWT_SECRET = (() => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required')
  return process.env.JWT_SECRET
})()

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const admin: any = await Admin.findOne({ email }).populate('profile')
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    if (!admin.active) {
      return res.status(403).json({ error: 'Esta cuenta está desactivada' })
    }
    if (admin.role !== 'super_admin' && (!admin.profile || !admin.profile.active)) {
      return res.status(403).json({ error: 'El perfil de esta cuenta está desactivado' })
    }

    const isPasswordValid = await admin.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        profileId: admin.profile?._id,
        profileName: admin.role === 'super_admin' ? 'Administrador principal' : admin.profile?.name,
        permissions: admin.role === 'super_admin' ? ['*'] : admin.profile?.permissions || [],
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Error logging in' })
  }
})

// Verify token
router.get('/verify', authMiddleware, (req: Request, res: Response) => {
  res.json({ valid: true, admin: req.admin })
})

// Create first admin (only for initial setup)
router.post('/setup', async (req: Request, res: Response) => {
  try {
    const adminCount = await Admin.countDocuments()
    if (adminCount > 0) {
      return res.status(403).json({ error: 'Admin already exists' })
    }

    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password and name are required' })
    }

    const admin = new Admin({
      email,
      password,
      name,
      role: 'super_admin',
    })

    await admin.save()

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    })
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' })
    }
    console.error('Setup error:', error)
    res.status(500).json({ error: 'Error creating admin' })
  }
})

export default router
