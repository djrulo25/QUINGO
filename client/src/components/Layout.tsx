import { ReactNode, useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import { useCustomerStore } from '@/store/customerStore'
import { useCartStore } from '@/store/cartStore'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const token = useCustomerStore((state) => state.token)
  const cartItemsLength = useCartStore((state) => state.cart.items.length)
  const loadCart = useCartStore((state) => state.loadCart)

  useEffect(() => {
    if (token && cartItemsLength === 0) {
      loadCart()
    }
  }, [token, cartItemsLength, loadCart])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
