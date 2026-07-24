import { Router, Request, Response } from 'express'
import StoreSettings, { DEFAULT_STORE_SETTINGS } from '../models/StoreSettings.js'
import { authMiddleware, requirePermission } from '../middleware/auth.js'
import { deleteCloudinaryAsset } from '../utils/cloudinaryAssets.js'

const router = Router()
const hexColor = /^#[0-9a-f]{6}$/i

const getSettings = async () => {
  const stored: any = await StoreSettings.findOne({ storeKey: 'default' }).lean()
  if (!stored) return DEFAULT_STORE_SETTINGS
  return {
    ...DEFAULT_STORE_SETTINGS,
    ...stored,
    colors: { ...DEFAULT_STORE_SETTINGS.colors, ...(stored.colors || {}) },
    contact: { ...DEFAULT_STORE_SETTINGS.contact, ...(stored.contact || {}) },
    social: { ...DEFAULT_STORE_SETTINGS.social, ...(stored.social || {}) },
    home: { ...DEFAULT_STORE_SETTINGS.home, ...(stored.home || {}) },
    homeBrands: stored.homeBrands?.length ? stored.homeBrands : DEFAULT_STORE_SETTINGS.homeBrands,
    fiscal: { ...DEFAULT_STORE_SETTINGS.fiscal, ...(stored.fiscal || {}) },
    shippingMethods: stored.shippingMethods?.length ? stored.shippingMethods : DEFAULT_STORE_SETTINGS.shippingMethods,
  }
}

router.get('/', async (_req: Request, res: Response) => {
  try { res.json(await getSettings()) }
  catch { res.status(500).json({ error: 'No se pudo cargar la configuración de la tienda' }) }
})

router.get('/admin', authMiddleware, requirePermission('settings'), async (_req: Request, res: Response) => {
  try { res.json(await getSettings()) }
  catch { res.status(500).json({ error: 'No se pudo cargar la configuración de la tienda' }) }
})

router.put('/', authMiddleware, requirePermission('settings'), async (req: Request, res: Response) => {
  try {
    const current: any = await getSettings()
    const colors = { ...current.colors, ...(req.body.colors || {}) }
    if (Object.values(colors).some((color) => !hexColor.test(String(color)))) {
      return res.status(400).json({ error: 'Los colores deben tener formato hexadecimal, por ejemplo #1e3a8a' })
    }
    const shippingMethods = Array.isArray(req.body.shippingMethods) ? req.body.shippingMethods : current.shippingMethods
    if (!shippingMethods.length || shippingMethods.some((method: any) => !method.id || !method.name || !Number.isFinite(Number(method.price)) || Number(method.price) < 0)) {
      return res.status(400).json({ error: 'Configura al menos un método de envío válido' })
    }
    const homeBrands = Array.isArray(req.body.homeBrands)
      ? req.body.homeBrands
      : (current.homeBrands?.length ? current.homeBrands : DEFAULT_STORE_SETTINGS.homeBrands)
    const normalizedBrandNames = homeBrands.map((brand: any) => String(brand.name || '').trim().toUpperCase()).filter(Boolean)
    if (new Set(normalizedBrandNames).size !== normalizedBrandNames.length) {
      return res.status(400).json({ error: 'No puede haber marcas repetidas en la configuración del inicio' })
    }
    const payload = {
      name: String(req.body.name || current.name).trim(),
      logoUrl: String(req.body.logoUrl ?? current.logoUrl).trim(),
      description: String(req.body.description ?? current.description).trim(),
      currency: String(req.body.currency || current.currency).trim().toUpperCase(),
      colors,
      contact: { ...current.contact, ...(req.body.contact || {}) },
      social: { ...current.social, ...(req.body.social || {}) },
      home: { ...current.home, ...(req.body.home || {}) },
      homeBrands: homeBrands.map((brand: any) => ({
        name: String(brand.name || '').trim().toUpperCase(),
        imageUrl: String(brand.imageUrl || '').trim(),
        enabled: brand.enabled !== false,
        darkBackground: brand.darkBackground === true,
      })).filter((brand: any) => brand.name),
      fiscal: { ...current.fiscal, ...(req.body.fiscal || {}) },
      shippingMethods: shippingMethods.map((method: any) => ({
        id: String(method.id).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
        name: String(method.name).trim(), description: String(method.description || '').trim(),
        price: Number(method.price), estimatedDays: String(method.estimatedDays || '').trim(), enabled: method.enabled !== false,
      })),
    }
    if (!payload.name) return res.status(400).json({ error: 'El nombre de la tienda es obligatorio' })
    const settings = await StoreSettings.findOneAndUpdate(
      { storeKey: 'default' },
      { $set: payload, $setOnInsert: { storeKey: 'default' } },
      { new: true, upsert: true, runValidators: true }
    )
    if (current.logoUrl && current.logoUrl !== settings.logoUrl) await deleteCloudinaryAsset(current.logoUrl)
    res.json(settings)
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'No se pudo guardar la configuración' })
  }
})

export default router
