import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

declare global {
  namespace Express {
    interface Request {
      admin?: { id: string; email: string; role: string }
    }
  }
}

const JWT_SECRET = (() => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required')
  return process.env.JWT_SECRET
})()

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (!['admin', 'super_admin'].includes(decoded.role)) {
      return res.status(403).json({ error: 'Admin access required' })
    }
    req.admin = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    if (req.admin.role !== role && req.admin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}
