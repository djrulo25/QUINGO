import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCartIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '@/store/cartStore'
import { useCustomerStore } from '@/store/customerStore'
import { useEffect, useState } from 'react'
import { categoryAPI } from '@/api'
import { CategoryTreeNode } from '@/types'
import { getTopLevelCategories } from '@/utils/categories'
import CategoryTreePanel from '@/components/CategoryTreePanel'

export default function Header() {
  const { cart } = useCartStore()
  const { isLoggedIn, customer, logout } = useCustomerStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [categories, setCategories] = useState<CategoryTreeNode[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryAPI.getAll()
        const topLevelCategories = getTopLevelCategories(response.data)
        setCategories(topLevelCategories)
      } catch (error) {
        console.error('Error loading categories', error)
      }
    }

    loadCategories()
  }, [])

  return (
    <header className="bg-gray-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold">
            QUINGO
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="hover:text-gray-300 transition">
              Inicio
            </Link>
            <div className="group relative">
              <Link to="/products" className="hover:text-gray-300 transition">
                Productos
              </Link>
              <div className="absolute left-0 top-full mt-2 hidden group-hover:block bg-white text-gray-900 rounded-lg shadow-xl min-w-[520px] p-3 z-50">
                <CategoryTreePanel categories={categories} />
              </div>
            </div>
            <a href="#contact" className="hover:text-gray-300 transition">
              Contacto
            </a>
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="p-2 hover:bg-gray-800 rounded-lg transition"
              title="Buscar productos"
            >
              <MagnifyingGlassIcon className="w-6 h-6" />
            </button>
            <Link
              to="/cart"
              className="relative p-2 hover:bg-gray-800 rounded-lg transition"
            >
              <ShoppingCartIcon className="w-6 h-6" />
              {cart.totalItems > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.totalItems}
                </span>
              )}
            </Link>

            {/* User Menu */}
            <div className="relative">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition flex items-center space-x-2"
                  >
                    <UserIcon className="w-6 h-6" />
                    <span className="hidden sm:inline text-sm">{customer?.firstName}</span>
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-2 z-50">
                      <Link
                        to="/customer/profile"
                        className="block px-4 py-2 hover:bg-gray-700 transition"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Mi Perfil
                      </Link>
                      <Link
                        to="/customer/orders"
                        className="block px-4 py-2 hover:bg-gray-700 transition"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Mis Órdenes
                      </Link>
                      <button
                        onClick={() => {
                          logout()
                          setIsUserMenuOpen(false)
                          navigate('/')
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition text-red-400"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to="/customer/login"
                  className="p-2 hover:bg-gray-800 rounded-lg transition"
                  title="Inicia sesión"
                >
                  <UserIcon className="w-6 h-6" />
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-gray-800 rounded-lg"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-gray-800">
            <Link
              to="/"
              className="block py-2 hover:text-gray-300 transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Inicio
            </Link>
            <Link
              to="/products"
              className="block py-2 hover:text-gray-300 transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Productos
            </Link>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="rounded-lg border border-gray-800 px-3 py-2">
                  <Link
                    to={`/products?category=${category.slug}`}
                    className="block text-sm font-semibold text-gray-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                </div>
              ))}
            </div>
            <a href="#contact" className="block py-2 hover:text-gray-300 transition">
              Contacto
            </a>
            <div className="border-t border-gray-800 my-2 py-2">
              {isLoggedIn ? (
                <>
                  <Link
                    to="/customer/profile"
                    className="block py-2 hover:text-gray-300 transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Mi Perfil
                  </Link>
                  <Link
                    to="/customer/orders"
                    className="block py-2 hover:text-gray-300 transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Mis Órdenes
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      setIsMenuOpen(false)
                      navigate('/')
                    }}
                    className="block w-full text-left py-2 hover:text-red-400 transition text-red-400"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <Link
                  to="/customer/login"
                  className="block py-2 hover:text-gray-300 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
