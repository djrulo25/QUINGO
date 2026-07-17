import { ReactNode, useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import FloatingContact from './FloatingContact'
import { useCustomerStore } from '@/store/customerStore'
import { useCartStore } from '@/store/cartStore'
import { useLocation } from 'react-router-dom'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const token = useCustomerStore((state) => state.token)
  const cartLoaded = useCartStore((state) => state.cartLoaded)
  const loadCart = useCartStore((state) => state.loadCart)
  const location = useLocation()

  useEffect(() => {
    if (token && !cartLoaded) {
      loadCart(token)
    }
  }, [token, cartLoaded, loadCart])

  useEffect(() => {
    if (!location.hash) return
    window.setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 0)
  }, [location.pathname, location.hash])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <FloatingContact />
      <Footer />
    </div>
  )
}
