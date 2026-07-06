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
  const cartLoaded = useCartStore((state) => state.cartLoaded)
  const loadCart = useCartStore((state) => state.loadCart)

  useEffect(() => {
    if (token && !cartLoaded) {
      loadCart(token)
    }
  }, [token, cartLoaded, loadCart])

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
