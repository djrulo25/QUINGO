import { create } from 'zustand'
import { Cart, CartItem, Product } from '@/types'
import { cartAPI } from '@/api/index'

interface CartStore {
  cart: Cart
  addToCart: (product: Product, quantity: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: (sync?: boolean) => Promise<void>
  loadCart: () => Promise<void>
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

const mapServerItemToCartItem = (item: any): CartItem => {
  const createdAt = item.addedAt ? new Date(item.addedAt).toISOString() : new Date().toISOString()
  return {
    id: `${item.productId}-${new Date(createdAt).getTime()}`,
    product: {
      id: item.productId,
      name: item.name || 'Producto',
      description: item.description || '',
      price: item.price || 0,
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
  image: item.product.image,
  category: item.product.category,
  subcategory: item.product.subcategory,
  sku: item.product.sku,
  quantity: item.quantity,
  addedAt: item.addedAt,
})

const mergeCartItems = (existing: CartItem[], incoming: CartItem[]) => {
  const merged = new Map<string, CartItem>()

  const addItem = (item: CartItem) => {
    const existingItem = merged.get(item.product.id)
    if (existingItem) {
      merged.set(item.product.id, {
        ...existingItem,
        quantity: existingItem.quantity + item.quantity,
      })
    } else {
      merged.set(item.product.id, item)
    }
  }

  existing.forEach(addItem)
  incoming.forEach(addItem)

  return Array.from(merged.values())
}

const syncCartToServer = async (cart: Cart) => {
  try {
    await cartAPI.sync(cart.items.map(mapCartItemToServerItem))
  } catch (error) {
    console.error('Failed to sync cart to server:', error)
  }
}

export const useCartStore = create<CartStore>()((set, get) => ({
  cart: initialCart,

  addToCart: (product: Product, quantity: number) => {
    set((state) => {
      const existingItem = state.cart.items.find(
        (item) => item.product.id === product.id
      )
      let newItems: CartItem[]
      if (existingItem) {
        newItems = state.cart.items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        const newItem: CartItem = {
          id: `${product.id}-${Date.now()}`,
          product,
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
        item.product.id === productId ? { ...item, quantity } : item
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

  clearCart: async (sync = false) => {
    set({ cart: initialCart })
    if (sync) {
      try {
        await cartAPI.clear()
      } catch (error) {
        console.error('Failed to clear cart on server:', error)
      }
    }
  },

  loadCart: async () => {
    try {
      const response = await cartAPI.get()
      const serverCart = response.data || { items: [], totalPrice: 0, totalItems: 0 }
      const serverItems = Array.isArray(serverCart.items)
        ? serverCart.items.map(mapServerItemToCartItem)
        : []
      const currentCart = get().cart

      const finalItems = currentCart.items.length
        ? mergeCartItems(currentCart.items, serverItems)
        : serverItems

      const totals = calculateTotals(finalItems)
      const mergedCart: Cart = {
        items: finalItems,
        totalPrice: totals.totalPrice,
        totalItems: totals.totalItems,
      }

      set({ cart: mergedCart })

      if (currentCart.items.length) {
        syncCartToServer(mergedCart)
      }
    } catch (error) {
      console.error('Failed to load cart from server:', error)
    }
  },

  getTotal: () => get().cart.totalPrice,
}))
