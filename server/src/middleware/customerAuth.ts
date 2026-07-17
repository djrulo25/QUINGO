import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

declare global {
  namespace Express {
    interface Request {
      customer?: { id: string; email: string }
    }
  }
}

const JWT_SECRET = (() => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required')
  return process.env.JWT_SECRET
})()

export function customerAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    req.customer = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
