import { Router, Request, Response } from 'express'
import Admin from '../models/Admin.js'
import AdminProfile, { ADMIN_MODULES } from '../models/AdminProfile.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware, requireRole('super_admin'))

router.get('/modules', (_req, res) => res.json(ADMIN_MODULES))

router.get('/profiles', async (_req: Request, res: Response) => {
  res.json(await AdminProfile.find().sort({ name: 1 }))
})

router.post('/profiles', async (req: Request, res: Response) => {
  try {
    const profile = await AdminProfile.create({
      name: req.body.name,
      description: req.body.description,
      permissions: (req.body.permissions || []).filter((item: string) => ADMIN_MODULES.includes(item as any)),
      active: req.body.active !== false,
    })
    res.status(201).json(profile)
  } catch (error: any) {
    res.status(400).json({ error: error.code === 11000 ? 'Ya existe un perfil con ese nombre' : error.message })
  }
})

router.put('/profiles/:id', async (req: Request, res: Response) => {
  try {
    const profile = await AdminProfile.findByIdAndUpdate(req.params.id, {
      name: req.body.name,
      description: req.body.description,
      permissions: (req.body.permissions || []).filter((item: string) => ADMIN_MODULES.includes(item as any)),
      active: req.body.active !== false,
    }, { new: true, runValidators: true })
    if (!profile) return res.status(404).json({ error: 'Perfil no encontrado' })
    res.json(profile)
  } catch (error: any) {
    res.status(400).json({ error: error.code === 11000 ? 'Ya existe un perfil con ese nombre' : error.message })
  }
})

router.delete('/profiles/:id', async (req: Request, res: Response) => {
  if (await Admin.exists({ profile: req.params.id })) {
    return res.status(409).json({ error: 'No puedes eliminar un perfil que tiene usuarios asignados' })
  }
  const profile = await AdminProfile.findByIdAndDelete(req.params.id)
  if (!profile) return res.status(404).json({ error: 'Perfil no encontrado' })
  res.status(204).send()
})

router.get('/users', async (_req: Request, res: Response) => {
  res.json(await Admin.find().select('-password').populate('profile', 'name active').sort({ createdAt: 1 }))
})

router.post('/users', async (req: Request, res: Response) => {
  try {
    if (!req.body.profile) return res.status(400).json({ error: 'Selecciona un perfil' })
    const profile = await AdminProfile.findById(req.body.profile)
    if (!profile) return res.status(400).json({ error: 'Perfil no válido' })
    const admin = await Admin.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: 'admin',
      profile: profile._id,
      active: req.body.active !== false,
    })
    res.status(201).json(await Admin.findById(admin._id).select('-password').populate('profile', 'name active'))
  } catch (error: any) {
    res.status(400).json({ error: error.code === 11000 ? 'Ese correo ya está registrado' : error.message })
  }
})

router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const admin: any = await Admin.findById(req.params.id)
    if (!admin) return res.status(404).json({ error: 'Usuario no encontrado' })
    if (admin.role === 'super_admin') return res.status(400).json({ error: 'El administrador principal no se modifica desde aquí' })
    if (req.body.name !== undefined) admin.name = req.body.name
    if (req.body.email !== undefined) admin.email = req.body.email
    if (req.body.profile !== undefined) admin.profile = req.body.profile
    if (req.body.active !== undefined) admin.active = req.body.active
    if (req.body.password) admin.password = req.body.password
    await admin.save()
    res.json(await Admin.findById(admin._id).select('-password').populate('profile', 'name active'))
  } catch (error: any) {
    res.status(400).json({ error: error.code === 11000 ? 'Ese correo ya está registrado' : error.message })
  }
})

export default router
