import { Link, useNavigate } from 'react-router-dom'
import {
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useCartStore } from '@/store/cartStore'
import { useCustomerStore } from '@/store/customerStore'
import { useEffect, useMemo, useState } from 'react'
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
  const [mobilePath, setMobilePath] = useState<string[]>([])
  const [showProductsExplorer, setShowProductsExplorer] = useState(false)
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

  const mobileBreadcrumb = useMemo(() => {
    const trail: CategoryTreeNode[] = []
    let currentNodes = categories

    for (const id of mobilePath) {
      const nextNode = currentNodes.find((node) => node.id === id)

      if (!nextNode) {
        break
      }

      trail.push(nextNode)
      currentNodes = nextNode.children || []
    }

    return trail
  }, [categories, mobilePath])

  const mobileCurrentCategory = mobileBreadcrumb[mobileBreadcrumb.length - 1] || null
  const mobileRootCategory = mobileBreadcrumb[0] || null
  const mobileCurrentLevel = showProductsExplorer
    ? mobileCurrentCategory?.children || categories
    : []

  const resetMobileProductsExplorer = () => {
    setShowProductsExplorer(false)
    setMobilePath([])
  }

  const closeMobileMenu = () => {
    setIsMenuOpen(false)
    resetMobileProductsExplorer()
  }

  const handleMobileMenuToggle = () => {
    if (isMenuOpen) {
      resetMobileProductsExplorer()
    }

    setIsMenuOpen((currentValue) => !currentValue)
  }

  const buildProductsPath = (category?: CategoryTreeNode | null, includeSubcategory = true) => {
    if (!category) {
      return '/products'
    }

    const rootCategory = mobileRootCategory || category
    const params = new URLSearchParams({ category: rootCategory.slug })

    if (includeSubcategory && category.id !== rootCategory.id) {
      params.set('subcategory', category.slug)
    }

    return `/products?${params.toString()}`
  }

  const navigateFromMobileMenu = (path: string) => {
    closeMobileMenu()
    navigate(path)
  }

  const handleMobileBack = () => {
    if (mobilePath.length > 0) {
      setMobilePath((currentPath) => currentPath.slice(0, -1))
      return
    }

    setShowProductsExplorer(false)
  }

  const handleMobileCategorySelect = (category: CategoryTreeNode) => {
    if (category.children?.length > 0) {
      setMobilePath((currentPath) => [...currentPath, category.id])
      return
    }

    navigateFromMobileMenu(buildProductsPath(category))
  }

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
              onClick={handleMobileMenuToggle}
              aria-label={isMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
            >
              {isMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-gray-800">
            {!showProductsExplorer ? (
              <>
                <Link
                  to="/"
                  className="block py-2 hover:text-gray-300 transition"
                  onClick={closeMobileMenu}
                >
                  Inicio
                </Link>
                <button
                  type="button"
                  className="block w-full text-left py-2 hover:text-gray-300 transition"
                  onClick={() => {
                    setShowProductsExplorer(true)
                    setMobilePath([])
                  }}
                >
                  Productos
                </button>
                <a href="#contact" className="block py-2 hover:text-gray-300 transition" onClick={closeMobileMenu}>
                  Contacto
                </a>
                <div className="border-t border-gray-800 my-2 py-2">
                  {isLoggedIn ? (
                    <>
                      <Link
                        to="/customer/profile"
                        className="block py-2 hover:text-gray-300 transition"
                        onClick={closeMobileMenu}
                      >
                        Mi Perfil
                      </Link>
                      <Link
                        to="/customer/orders"
                        className="block py-2 hover:text-gray-300 transition"
                        onClick={closeMobileMenu}
                      >
                        Mis Órdenes
                      </Link>
                      <button
                        onClick={() => {
                          logout()
                          closeMobileMenu()
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
                      onClick={closeMobileMenu}
                    >
                      Iniciar Sesión
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3 pt-3">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleMobileBack}
                    className="inline-flex items-center gap-2 py-2 text-sm font-semibold text-blue-300"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Regresar
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateFromMobileMenu(buildProductsPath(mobileCurrentCategory, false))}
                    className="text-sm font-semibold text-gray-200 hover:text-white"
                  >
                    Ver todo
                  </button>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Productos</p>
                  <p className="text-base font-bold text-white">
                    {mobileCurrentCategory?.name || 'Todas las categorias'}
                  </p>
                </div>

                {mobileBreadcrumb.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                    <button
                      type="button"
                      onClick={() => setMobilePath([])}
                      className="font-semibold text-blue-300"
                    >
                      Productos
                    </button>
                    {mobileBreadcrumb.map((category, index) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setMobilePath((currentPath) => currentPath.slice(0, index + 1))}
                        className="font-semibold text-blue-300"
                      >
                        / {category.name}
                      </button>
                    ))}
                  </div>
                )}

                {mobileCurrentLevel.length > 0 ? (
                  mobileCurrentLevel.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleMobileCategorySelect(category)}
                      className="flex w-full items-center justify-between rounded-lg border border-gray-800 px-3 py-2 text-left text-sm font-semibold text-gray-200 hover:border-gray-700 hover:bg-gray-800"
                    >
                      <span>{category.name}</span>
                      {category.children?.length > 0 && <ChevronRightIcon className="h-4 w-4 text-gray-500" />}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No hay subcategorias disponibles.</p>
                )}
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
