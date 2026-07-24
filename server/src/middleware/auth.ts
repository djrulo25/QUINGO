import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'

declare global {
  namespace Express {
    interface Request {
      admin?: { id: string; email: string; role: string; permissions: string[]; profileId?: string }
    }
  }
}

const JWT_SECRET = (() => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required')
  return process.env.JWT_SECRET
})()

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (!['admin', 'super_admin'].includes(decoded.role)) {
      return res.status(403).json({ error: 'Admin access required' })
    }
    const admin: any = await Admin.findById(decoded.id).populate('profile')
    if (!admin || !admin.active) {
      return res.status(403).json({ error: 'La cuenta administrativa está desactivada' })
    }
    const isSuperAdmin = admin.role === 'super_admin'
    if (!isSuperAdmin && (!admin.profile || !admin.profile.active)) {
      return res.status(403).json({ error: 'El perfil de acceso está desactivado' })
    }
    req.admin = {
      id: String(admin._id),
      email: admin.email,
      role: admin.role,
      permissions: isSuperAdmin ? ['*'] : admin.profile.permissions,
      profileId: admin.profile ? String(admin.profile._id) : undefined,
    }
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) return res.status(401).json({ error: 'Not authenticated' })
    if (req.admin.role === 'super_admin' || req.admin.permissions.includes('*') || req.admin.permissions.includes(permission)) {
      return next()
    }
    return res.status(403).json({ error: 'No tienes permiso para acceder a este módulo' })
  }
}

export function requireAnyPermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) return res.status(401).json({ error: 'Not authenticated' })
    if (
      req.admin.role === 'super_admin' ||
      req.admin.permissions.includes('*') ||
      permissions.some((permission) => req.admin!.permissions.includes(permission))
    ) return next()
    return res.status(403).json({ error: 'No tienes permiso para acceder a este módulo' })
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
