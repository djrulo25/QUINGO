import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Cart, CartItem, Product } from '@/types'

interface CartStore {
  cart: Cart
  addToCart: (product: Product, quantity: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
}

const initialCart: Cart = {
  items: [],
  totalPrice: 0,
  totalItems: 0,
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
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

          const totalPrice = newItems.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          )
          const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)

          return {
            cart: {
              items: newItems,
              totalPrice,
              totalItems,
            },
          }
        })
      },
      removeFromCart: (productId: string) => {
        set((state) => {
          const newItems = state.cart.items.filter(
            (item) => item.product.id !== productId
          )
          const totalPrice = newItems.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          )
          const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)

          return {
            cart: {
              items: newItems,
              totalPrice,
              totalItems,
            },
          }
        })
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
          const totalPrice = newItems.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          )
          const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)

          return {
            cart: {
              items: newItems,
              totalPrice,
              totalItems,
            },
          }
        })
      },
      clearCart: () => {
        set({ cart: initialCart })
      },
      getTotal: () => get().cart.totalPrice,
    }),
    {
      name: 'quingo-cart',
    }
  )
)
