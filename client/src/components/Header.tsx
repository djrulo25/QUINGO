import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  ShoppingCartIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useCartStore } from '@/store/cartStore'
import { useCustomerStore } from '@/store/customerStore'
import { useEffect, useMemo, useRef, useState } from 'react'
import { categoryAPI } from '@/api'
import ProductSearchBox from '@/components/ProductSearchBox'
import BrandLogo from '@/components/BrandLogo'
import { CategoryTreeNode } from '@/types'
import { flattenCategoryCatalog, getCategoryProductLink } from '@/utils/categoryCatalog'
import { getTopLevelCategories } from '@/utils/categories'

const SERVICES = [
  { label: 'Cotizacion rapida', href: '/#quote' },
  { label: 'Solicitar factura', href: '/facturacion' },
  { label: 'Asesoria tecnica', href: '/contacto' },
]

export default function Header() {
  const { cart } = useCartStore()
  const { isLoggedIn, customer, logout } = useCustomerStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [categories, setCategories] = useState<CategoryTreeNode[]>([])
  const [mobilePath, setMobilePath] = useState<string[]>([])
  const [showProductsExplorer, setShowProductsExplorer] = useState(false)
  const [showServicesExplorer, setShowServicesExplorer] = useState(false)
  const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(false)
  const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false)
  const productsMenuRef = useRef<HTMLDivElement>(null)
  const servicesMenuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

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

  useEffect(() => {
    setIsProductsMenuOpen(false)
    setIsServicesMenuOpen(false)
  }, [location.pathname, location.search, location.hash])

  useEffect(() => {
    const closeOnOutsideInteraction = (event: PointerEvent) => {
      if (productsMenuRef.current && !productsMenuRef.current.contains(event.target as Node)) {
        setIsProductsMenuOpen(false)
      }
      if (servicesMenuRef.current && !servicesMenuRef.current.contains(event.target as Node)) {
        setIsServicesMenuOpen(false)
      }
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProductsMenuOpen(false)
        setIsServicesMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideInteraction)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideInteraction)
      document.removeEventListener('keydown', closeOnEscape)
    }
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
  const catalogItems = useMemo(() => flattenCategoryCatalog(categories), [categories])

  const resetMobileProductsExplorer = () => {
    setShowProductsExplorer(false)
    setShowServicesExplorer(false)
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
      <div className="hidden border-b border-gray-800 bg-gray-950 text-xs text-gray-300 md:block">
        <div className="container mx-auto flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <a href="tel:+5215576881138" className="font-semibold text-white hover:text-blue-200">
              +52 1 55 7688 1138
            </a>
            <Link to="/contacto" className="hover:text-white">
              Contacto
            </Link>
            <a href="/#shipping" className="hover:text-white">
              Envio y entrega
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a href="/#quote" className="font-semibold text-blue-200 hover:text-white">
              Cotizacion rapida
            </a>
            <span>Español | MXN</span>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" aria-label="Ir al inicio" className="text-white">
            <BrandLogo />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="hover:text-gray-300 transition">
              Inicio
            </Link>
            <div
              ref={productsMenuRef}
              className="relative flex h-16 items-center"
              onMouseEnter={() => {
                setIsServicesMenuOpen(false)
                setIsProductsMenuOpen(true)
              }}
              onMouseLeave={() => setIsProductsMenuOpen(false)}
              onFocus={() => setIsProductsMenuOpen(true)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setIsProductsMenuOpen(false)
                }
              }}
            >
              <Link
                to="/products"
                className="hover:text-gray-300 transition"
                aria-haspopup="true"
                aria-expanded={isProductsMenuOpen}
                onClick={() => setIsProductsMenuOpen(false)}
              >
                Productos
              </Link>
              <div className={`absolute left-0 top-full z-50 min-w-[560px] pt-2 ${isProductsMenuOpen ? 'block' : 'hidden'}`}>
                <div className="rounded-lg bg-white p-4 text-gray-900 shadow-xl">
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-bold uppercase text-gray-500">Categorias</p>
                      <Link
                        to="/products"
                        className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                        onClick={() => setIsProductsMenuOpen(false)}
                      >
                        Ver todo
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {catalogItems.slice(0, 18).map((item) => (
                        <Link
                          key={item.category.id}
                          to={getCategoryProductLink(item)}
                          className="text-sm font-medium text-gray-800 hover:text-blue-700"
                          onClick={() => setIsProductsMenuOpen(false)}
                        >
                          {item.category.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
            <div
              ref={servicesMenuRef}
              className="relative flex h-16 items-center"
              onMouseEnter={() => {
                setIsProductsMenuOpen(false)
                setIsServicesMenuOpen(true)
              }}
              onMouseLeave={() => setIsServicesMenuOpen(false)}
              onFocus={() => setIsServicesMenuOpen(true)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setIsServicesMenuOpen(false)
                }
              }}
            >
              <button
                type="button"
                className="hover:text-gray-300 transition"
                aria-haspopup="true"
                aria-expanded={isServicesMenuOpen}
                onClick={() => setIsServicesMenuOpen(true)}
              >
                Servicios
              </button>
              <div className={`absolute left-0 top-full z-50 min-w-[250px] pt-2 ${isServicesMenuOpen ? 'block' : 'hidden'}`}>
                <div className="space-y-1 rounded-lg bg-white p-3 text-gray-900 shadow-xl">
                  {SERVICES.map((service) => (
                    <Link
                      key={service.label}
                      to={service.href}
                      onClick={() => setIsServicesMenuOpen(false)}
                      className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-100 hover:text-blue-700"
                    >
                      <span>{service.label}</span>
                      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link to="/contacto" className="hover:text-gray-300 transition">
              Contacto
            </Link>
          </nav>

          <ProductSearchBox
            categories={categories}
            className="mx-5 hidden max-w-md flex-1 md:block"
            inputClassName="py-2"
            buttonClassName="w-11 bg-blue-800 hover:bg-blue-700"
          />

          {/* Right Section */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="p-2 hover:bg-gray-800 rounded-lg transition md:hidden"
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

            <a
              href="tel:+5215576881138"
              className="md:hidden p-2 hover:bg-gray-800 rounded-lg transition"
              aria-label="Llamar a QUINGO"
              title="Llamar a QUINGO"
            >
              <PhoneIcon className="w-6 h-6" />
            </a>

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
            {!showProductsExplorer && !showServicesExplorer ? (
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
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-2 text-left hover:text-gray-300 transition"
                  onClick={() => setShowServicesExplorer(true)}
                >
                  <span>Servicios</span>
                  <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                </button>
                <Link to="/contacto" className="block py-2 hover:text-gray-300 transition" onClick={closeMobileMenu}>
                  Contacto
                </Link>
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
            ) : showProductsExplorer ? (
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
            ) : (
              <div className="space-y-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowServicesExplorer(false)}
                  className="inline-flex items-center gap-2 py-2 text-sm font-semibold text-blue-300"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Regresar
                </button>

                <div>
                  <p className="text-base font-bold text-white">Servicios</p>
                </div>

                <div className="space-y-2">
                  {SERVICES.map((service) => (
                    <Link
                      key={service.label}
                      to={service.href}
                      onClick={closeMobileMenu}
                      className="flex w-full items-center justify-between rounded-lg border border-gray-800 px-3 py-3 text-sm font-semibold text-gray-200 hover:border-gray-700 hover:bg-gray-800"
                    >
                      <span>{service.label}</span>
                      <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
