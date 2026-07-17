import Product from '../models/Product.js'
import StoreSettings, { DEFAULT_STORE_SETTINGS } from '../models/StoreSettings.js'

const money = (value: number) => Math.round(value * 100) / 100

export async function calculateOrder(items: any[], shippingMethod: string) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('El pedido no contiene productos')
  const settings: any = await StoreSettings.findOne({ storeKey: 'default' }).select('shippingMethods').lean()
  const methods = settings?.shippingMethods?.length ? settings.shippingMethods : DEFAULT_STORE_SETTINGS.shippingMethods
  const selectedShipping = methods.find((method: any) => method.id === shippingMethod && method.enabled !== false)
  if (!selectedShipping) throw new Error('Método de envío no válido')

  const normalized = items.map((item) => ({ productId: String(item.productId || ''), quantity: Number(item.quantity) }))
  if (normalized.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1)) {
    throw new Error('Los productos o cantidades no son válidos')
  }

  const products = await Product.find({ _id: { $in: normalized.map((item) => item.productId) } }).lean()
  const productMap = new Map(products.map((product: any) => [product._id.toString(), product]))
  const pricedItems = normalized.map((item) => {
    const product: any = productMap.get(item.productId)
    if (!product) throw new Error('Uno de los productos ya no está disponible')
    if (product.stock < item.quantity) throw new Error(`Stock insuficiente para ${product.name}`)
    const tier = [...(product.volumePricing || [])]
      .filter((entry: any) => item.quantity >= entry.minQuantity)
      .sort((a: any, b: any) => b.minQuantity - a.minQuantity)[0]
    const price = money(product.price * (1 - (tier?.discountPercent || 0) / 100))
    return { productId: item.productId, quantity: item.quantity, price }
  })

  const subtotal = money(pricedItems.reduce((sum, item) => sum + item.price * item.quantity, 0))
  const shippingCost = money(Number(selectedShipping.price))
  return { items: pricedItems, subtotal, shippingCost, total: money(subtotal + shippingCost) }
}
