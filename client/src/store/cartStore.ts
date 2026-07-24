import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Cart, CartItem, Product } from '@/types'
import { cartAPI } from '@/api/index'

interface CartStore {
  cart: Cart
  cartLoaded: boolean
  setCartLoaded: (loaded: boolean) => void
  addToCart: (product: Product, quantity: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: (sync?: boolean, token?: string) => Promise<void>
  loadCart: (token?: string) => Promise<void>
  mergeCartAfterAuth: (token: string) => Promise<void>
  getTotal: () => number
}

const initialCart: Cart = {
  items: [],
  totalPrice: 0,
  totalItems: 0,
}

const calculateTotals = (items: CartItem[]) => {
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return { totalPrice, totalItems }
}

const applyVolumePrice = (product: Product, quantity: number): Product => {
  const basePrice = product.basePrice ?? product.price
  const tier = [...(product.volumePricing || [])]
    .filter((item) => quantity >= item.minQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity)[0]
  return {
    ...product,
    basePrice,
    price: tier ? basePrice * (1 - tier.discountPercent / 100) : basePrice,
  }
}

const mapServerItemToCartItem = (item: any): CartItem => {
  const createdAt = item.addedAt ? new Date(item.addedAt).toISOString() : new Date().toISOString()
  return {
    id: `${item.productId}-${new Date(createdAt).getTime()}`,
    product: {
      id: item.productId,
      name: item.name || 'Producto',
      description: item.description || '',
      price: item.price || 0,
      basePrice: item.basePrice,
      volumePricing: item.volumePricing || [],
      originalPrice: item.originalPrice,
      image: item.image || '',
      images: item.images || [],
      category: item.category || 'welding',
      subcategory: item.subcategory || '',
      stock: item.stock ?? 0,
      rating: item.rating ?? 0,
      reviews: item.reviews ?? 0,
      sku: item.sku || '',
      createdAt,
      updatedAt: createdAt,
    },
    quantity: item.quantity,
    addedAt: createdAt,
  }
}

const mapCartItemToServerItem = (item: CartItem) => ({
  productId: item.product.id,
  name: item.product.name,
  price: item.product.price,
  basePrice: item.product.basePrice,
  volumePricing: item.product.volumePricing || [],
  image: item.product.image,
  category: item.product.category,
  subcategory: item.product.subcategory,
  sku: item.product.sku,
  quantity: item.quantity,
  addedAt: item.addedAt,
})

const getStoredToken = (): string | null => {
  const customerStore = localStorage.getItem('customer-store')
  if (!customerStore) return null

  try {
    const parsed = JSON.parse(customerStore)
    return parsed.state?.token || null
  } catch {
    return null
  }
}

const syncCartToServer = async (cart: Cart, token?: string) => {
  try {
    const authToken = token ?? getStoredToken() ?? undefined
    if (!authToken) return
    await cartAPI.sync(cart.items.map(mapCartItemToServerItem), authToken)
  } catch (error) {
    console.error('Failed to sync cart to server:', error)
  }
}

export const useCartStore = create<CartStore>()(persist((set, get) => ({
  cart: initialCart,
  cartLoaded: false,
  setCartLoaded: (loaded: boolean) => set({ cartLoaded: loaded }),

  addToCart: (product: Product, quantity: number) => {
    set((state) => {
      const existingItem = state.cart.items.find(
        (item) => item.product.id === product.id
      )
      let newItems: CartItem[]
      if (existingItem) {
        newItems = state.cart.items.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                product: applyVolumePrice({ ...item.product, volumePricing: product.volumePricing || item.product.volumePricing }, item.quantity + quantity),
              }
            : item
        )
      } else {
        const newItem: CartItem = {
          id: `${product.id}-${Date.now()}`,
          product: applyVolumePrice(product, quantity),
          quantity,
          addedAt: new Date().toISOString(),
        }
        newItems = [...state.cart.items, newItem]
      }

      const totals = calculateTotals(newItems)
      return {
        cart: {
          items: newItems,
          totalPrice: totals.totalPrice,
          totalItems: totals.totalItems,
        },
      }
    })

    syncCartToServer(get().cart)
  },

  removeFromCart: (productId: string) => {
    set((state) => {
      const newItems = state.cart.items.filter(
        (item) => item.product.id !== productId
      )
      const totals = calculateTotals(newItems)

      return {
        cart: {
          items: newItems,
          totalPrice: totals.totalPrice,
          totalItems: totals.totalItems,
        },
      }
    })

    syncCartToServer(get().cart)
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeFromCart(productId)
      return
    }

    set((state) => {
      const newItems = state.cart.items.map((item) =>
        item.product.id === productId ? { ...item, quantity, product: applyVolumePrice(item.product, quantity) } : item
      )
      const totals = calculateTotals(newItems)

      return {
        cart: {
          items: newItems,
          totalPrice: totals.totalPrice,
          totalItems: totals.totalItems,
        },
      }
    })

    syncCartToServer(get().cart)
  },

  clearCart: async (sync = false, token?: string) => {
    set({ cart: initialCart, cartLoaded: false })
    if (sync) {
      try {
        const authToken = token ?? getStoredToken() ?? undefined
        await cartAPI.clear(authToken)
      } catch (error) {
        console.error('Failed to clear cart on server:', error)
      }
    }
  },

  loadCart: async (token?: string) => {
    try {
      const authToken = token ?? getStoredToken() ?? undefined
      const response = await cartAPI.get(authToken)
      const serverCart = response.data || { items: [], totalPrice: 0, totalItems: 0 }
      const serverItems = Array.isArray(serverCart.items)
        ? serverCart.items.map(mapServerItemToCartItem)
        : []

      const totals = calculateTotals(serverItems)
      const newCart: Cart = {
        items: serverItems,
        totalPrice: totals.totalPrice,
        totalItems: totals.totalItems,
      }

      set({ cart: newCart, cartLoaded: true })
    } catch (error) {
      console.error('Failed to load cart from server:', error)
    }
  },

  mergeCartAfterAuth: async (token: string) => {
    const localItems = get().cart.items

    try {
      const response = await cartAPI.get(token)
      const serverItems = Array.isArray(response.data?.items)
        ? response.data.items.map(mapServerItemToCartItem)
        : []
      const mergedByProduct = new Map<string, CartItem>()

      for (const item of serverItems) {
        mergedByProduct.set(item.product.id, item)
      }

      for (const localItem of localItems) {
        const serverItem = mergedByProduct.get(localItem.product.id)
        if (!serverItem) {
          mergedByProduct.set(localItem.product.id, localItem)
          continue
        }

        const combinedQuantity = serverItem.quantity + localItem.quantity
        const availableStock = localItem.product.stock || serverItem.product.stock
        const quantity = availableStock > 0
          ? Math.min(combinedQuantity, availableStock)
          : combinedQuantity
        const product = applyVolumePrice({
          ...serverItem.product,
          ...localItem.product,
          volumePricing: localItem.product.volumePricing || serverItem.product.volumePricing || [],
        }, quantity)

        mergedByProduct.set(localItem.product.id, {
          ...serverItem,
          product,
          quantity,
          addedAt: localItem.addedAt || serverItem.addedAt,
        })
      }

      const items = [...mergedByProduct.values()]
      const totals = calculateTotals(items)
      const mergedCart = { items, ...totals }

      set({ cart: mergedCart, cartLoaded: true })
      await syncCartToServer(mergedCart, token)
    } catch (error) {
      console.error('Failed to merge cart after authentication:', error)
      set({ cartLoaded: true })
    }
  },

  getTotal: () => get().cart.totalPrice,
}), {
  name: 'quingo-cart',
  partialize: (state) => ({ cart: state.cart }),
}))
