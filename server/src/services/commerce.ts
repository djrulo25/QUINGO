import Product from '../models/Product.js'

export const SHIPPING_RATES: Record<string, number> = {
  standard: 20,
  express: 50,
}

const money = (value: number) => Math.round(value * 100) / 100

export async function calculateOrder(items: any[], shippingMethod: string) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('El pedido no contiene productos')
  if (!(shippingMethod in SHIPPING_RATES)) throw new Error('Método de envío no válido')

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
  const shippingCost = SHIPPING_RATES[shippingMethod]
  return { items: pricedItems, subtotal, shippingCost, total: money(subtotal + shippingCost) }
}
