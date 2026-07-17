import { Router, Request, Response } from 'express'
import Category, { AttributeType } from '../models/Category.js'
import Product from '../models/Product.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const slugify = (value: unknown) => String(value || '').trim().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const bool = (value: unknown, fallback = false) => value === undefined || value === ''
  ? fallback
  : ['true', '1', 'si', 'sí', 'yes', 'x'].includes(String(value).trim().toLowerCase())
const number = (value: unknown, fallback = 0) => value === undefined || value === '' ? fallback : Number(value)
const list = (value: unknown) => Array.isArray(value) ? value.map(String).filter(Boolean) : String(value || '').split(/[|;,]/).map((item) => item.trim()).filter(Boolean)

interface ImportPayload {
  categories?: any[]
  subcategories?: any[]
  attributes?: any[]
  products?: any[]
  dryRun?: boolean
}

const validatePayload = async (body: ImportPayload) => {
  const categories = Array.isArray(body.categories) ? body.categories : []
  const subcategories = Array.isArray(body.subcategories) ? body.subcategories : []
  const attributes = Array.isArray(body.attributes) ? body.attributes : []
  const products = Array.isArray(body.products) ? body.products : []
  const total = categories.length + subcategories.length + attributes.length + products.length
  const errors: Array<{ section: string; row: number; message: string }> = []
  if (!total) errors.push({ section: 'archivo', row: 0, message: 'El archivo no contiene registros reconocidos' })
  if (total > 5000) errors.push({ section: 'archivo', row: 0, message: 'El máximo permitido es de 5,000 registros por importación' })

  const existingCategories = await Category.find().select('slug parent').lean()
  const rootSlugs = new Set(existingCategories.filter((item: any) => !item.parent).map((item) => item.slug))
  categories.forEach((row, index) => {
    const name = String(row.name || '').trim()
    const slug = slugify(row.slug || name)
    if (!name) errors.push({ section: 'categorías', row: index + 2, message: 'Falta el nombre' })
    if (!slug) errors.push({ section: 'categorías', row: index + 2, message: 'No se pudo generar el slug' })
    rootSlugs.add(slug)
  })

  const subKeys = new Set<string>()
  subcategories.forEach((row, index) => {
    const category = slugify(row.category)
    const name = String(row.name || '').trim()
    const slug = slugify(row.slug || name)
    if (!rootSlugs.has(category)) errors.push({ section: 'subcategorías', row: index + 2, message: `No existe la categoría padre: ${row.category || ''}` })
    if (!name || !slug) errors.push({ section: 'subcategorías', row: index + 2, message: 'Nombre y slug son obligatorios' })
    subKeys.add(`${category}/${slug}`)
  })
  for (const item of existingCategories as any[]) {
    if (item.parent) {
      const parent: any = existingCategories.find((candidate: any) => candidate._id.toString() === item.parent.toString())
      if (parent) subKeys.add(`${parent.slug}/${item.slug}`)
    }
  }

  attributes.forEach((row, index) => {
    const category = slugify(row.category)
    const subcategory = slugify(row.subcategory)
    const type = String(row.type || 'text')
    if (!rootSlugs.has(category)) errors.push({ section: 'atributos', row: index + 2, message: `Categoría desconocida: ${row.category || ''}` })
    if (subcategory && !subKeys.has(`${category}/${subcategory}`)) errors.push({ section: 'atributos', row: index + 2, message: `Subcategoría desconocida: ${row.subcategory}` })
    if (!row.name) errors.push({ section: 'atributos', row: index + 2, message: 'Falta el nombre del atributo' })
    if (!['text', 'number', 'select', 'checkbox', 'date', 'textarea'].includes(type)) errors.push({ section: 'atributos', row: index + 2, message: `Tipo no válido: ${type}` })
  })

  const skuSet = new Set<string>()
  products.forEach((row, index) => {
    const sku = String(row.sku || '').trim()
    const category = slugify(row.category)
    const subcategory = slugify(row.subcategory)
    if (!sku || !row.name) errors.push({ section: 'productos', row: index + 2, message: 'SKU y nombre son obligatorios' })
    if (skuSet.has(sku)) errors.push({ section: 'productos', row: index + 2, message: `SKU duplicado en el archivo: ${sku}` })
    skuSet.add(sku)
    if (!Number.isFinite(number(row.price, NaN)) || number(row.price) < 0) errors.push({ section: 'productos', row: index + 2, message: 'El precio no es válido' })
    if (!rootSlugs.has(category)) errors.push({ section: 'productos', row: index + 2, message: `Categoría desconocida: ${row.category || ''}` })
    if (subcategory && !subKeys.has(`${category}/${subcategory}`)) errors.push({ section: 'productos', row: index + 2, message: `Subcategoría desconocida: ${row.subcategory}` })
    if (!row.image && !list(row.images).length) errors.push({ section: 'productos', row: index + 2, message: 'Se requiere al menos una URL de imagen' })
    if (typeof row.attributes === 'string' && row.attributes.trim()) {
      try {
        const parsed = JSON.parse(row.attributes)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
      } catch {
        errors.push({ section: 'productos', row: index + 2, message: 'La columna atributos debe contener un objeto JSON válido' })
      }
    }
  })
  return { categories, subcategories, attributes, products, errors, total }
}

router.post('/catalog', authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = await validatePayload(req.body || {})
    if (req.body.dryRun || data.errors.length) {
      return res.status(data.errors.length ? 422 : 200).json({
        valid: data.errors.length === 0,
        counts: { categories: data.categories.length, subcategories: data.subcategories.length, attributes: data.attributes.length, products: data.products.length },
        errors: data.errors,
      })
    }

    let created = 0
    let updated = 0
    const roots = new Map<string, any>()
    for (const row of data.categories) {
      const slug = slugify(row.slug || row.name)
      let category: any = await Category.findOne({ slug })
      const isNew = !category
      category ||= new Category()
      category.set({ name: String(row.name).trim(), slug, parent: null, description: String(row.description || ''), image: String(row.image || ''), order: number(row.order), active: row.active === undefined ? true : bool(row.active, true) })
      await category.save()
      roots.set(slug, category)
      isNew ? created++ : updated++
    }
    const existingRoots = await Category.find({ parent: null })
    existingRoots.forEach((category: any) => roots.set(category.slug, category))

    const children = new Map<string, any>()
    for (const row of data.subcategories) {
      const parentSlug = slugify(row.category)
      const parent = roots.get(parentSlug)
      const slug = slugify(row.slug || row.name)
      let category: any = await Category.findOne({ slug })
      const isNew = !category
      category ||= new Category()
      category.set({ name: String(row.name).trim(), slug, parent: parent._id, description: String(row.description || ''), image: String(row.image || ''), order: number(row.order), active: row.active === undefined ? true : bool(row.active, true) })
      await category.save()
      children.set(`${parentSlug}/${slug}`, category)
      isNew ? created++ : updated++
    }
    const allCategories = await Category.find()
    for (const category of allCategories as any[]) {
      if (!category.parent) continue
      const parent: any = allCategories.find((candidate: any) => candidate._id.toString() === category.parent.toString())
      if (parent) children.set(`${parent.slug}/${category.slug}`, category)
    }

    for (const row of data.attributes) {
      const categorySlug = slugify(row.category)
      const subcategorySlug = slugify(row.subcategory)
      const target: any = subcategorySlug ? children.get(`${categorySlug}/${subcategorySlug}`) : roots.get(categorySlug)
      const key = slugify(row.key || row.name).replace(/-/g, '_')
      const definition = {
        key, name: String(row.name).trim(), type: String(row.type || 'text') as AttributeType,
        options: list(row.options), required: bool(row.required), filterable: bool(row.filterable, true),
        unit: String(row.unit || ''), placeholder: String(row.placeholder || ''), order: number(row.order),
      }
      const index = target.attributes.findIndex((attribute: any) => attribute.key === key)
      if (index >= 0) target.attributes[index] = definition
      else target.attributes.push(definition)
      await target.save()
    }

    for (const row of data.products) {
      const categorySlug = slugify(row.category)
      const subcategorySlug = slugify(row.subcategory)
      const categoryDoc: any = subcategorySlug ? children.get(`${categorySlug}/${subcategorySlug}`) : roots.get(categorySlug)
      const images = list(row.images)
      const primaryImage = String(row.image || images[0] || '').trim()
      const gallery = Array.from(new Set([primaryImage, ...images].filter(Boolean)))
      let attributes = row.attributes || {}
      if (typeof attributes === 'string') {
        try { attributes = JSON.parse(attributes) } catch { attributes = {} }
      }
      let product: any = await Product.findOne({ sku: String(row.sku).trim() })
      const isNew = !product
      product ||= new Product()
      product.set({
        sku: String(row.sku).trim(), name: String(row.name).trim(), description: String(row.description || row.name),
        price: number(row.price), originalPrice: row.originalPrice === '' || row.originalPrice === undefined ? undefined : number(row.originalPrice),
        stock: number(row.stock), image: primaryImage, images: gallery,
        category: categorySlug, categorySlug, subcategory: subcategorySlug, subcategorySlug, categoryId: categoryDoc._id,
        attributes, satProductCode: String(row.satProductCode || ''), satUnitCode: String(row.satUnitCode || ''),
        taxObject: String(row.taxObject || '02'), ivaRate: number(row.ivaRate, 16),
      })
      await product.save()
      isNew ? created++ : updated++
    }

    res.status(201).json({ success: true, created, updated, counts: { categories: data.categories.length, subcategories: data.subcategories.length, attributes: data.attributes.length, products: data.products.length } })
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'No se pudo importar el catálogo' })
  }
})

export default router
