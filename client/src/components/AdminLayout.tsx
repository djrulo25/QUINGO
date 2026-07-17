import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  TruckIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface AdminLayoutProps {
  children: React.ReactNode
}

interface AdminMenuItem {
  label: string
  path: string
  icon: typeof HomeIcon
  children?: { label: string; path: string }[]
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedMenu, setExpandedMenu] = useState<string | null>(() =>
    location.pathname.startsWith('/admin/categories') || location.pathname.startsWith('/admin/attributes')
      ? '/admin/categories'
      : null
  )

  const menuItems: AdminMenuItem[] = [
    {
      label: 'Dashboard',
      path: '/admin/dashboard',
      icon: HomeIcon,
    },
    {
      label: 'Productos',
      path: '/admin/products',
      icon: ShoppingBagIcon,
    },
    {
      label: 'Categorías',
      path: '/admin/categories',
      icon: ChartBarIcon,
      children: [
        { label: 'Gestionar categorías', path: '/admin/categories' },
        { label: 'Plantillas de atributos', path: '/admin/attributes' },
      ],
    },
    {
      label: 'Pedidos',
      path: '/admin/orders',
      icon: ShoppingCartIcon,
    },
    {
      label: 'Entregas',
      path: '/admin/orders?filter=shipped',
      icon: TruckIcon,
    },
    {
      label: 'Devoluciones',
      path: '/admin/orders?filter=returned',
      icon: ArrowPathIcon,
    },
    {
      label: 'Reportes',
      path: '/admin/reports',
      icon: ChartBarIcon,
    },
  ]

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('admin')
    toast.success('Sesión cerrada')
    navigate('/admin/login')
  }

  const handleMenuItemClick = (path: string) => {
    setExpandedMenu(null)
    if (path === '/admin/orders') {
      navigate(path, { state: { resetOrdersFiltersAt: Date.now() } })
      return
    }

    navigate(path)
  }

  const isActive = (path: string) => {
    if (path.includes('?')) {
      return location.pathname === path.split('?')[0] && location.search === '?' + path.split('?')[1]
    }
    return location.pathname === path && !location.search
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-gray-100 lg:flex-row">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen
            ? 'w-full max-h-[520px] lg:max-h-screen lg:w-64'
            : 'w-auto max-h-20 lg:max-h-screen lg:w-20'
        } self-start bg-blue-900 text-white transition-all duration-300 flex flex-col shadow-lg overflow-hidden lg:h-screen lg:sticky lg:top-0`}
      >
        {/* Logo/Header */}
        <div className="p-4 sm:p-6 border-b border-blue-800 flex items-center justify-between">
          <h1 className={`font-bold text-xl ${!sidebarOpen && 'hidden'}`}>QUINGO</h1>
          <h2 className={`font-bold text-sm ${sidebarOpen && 'hidden'}`}>Q</h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-blue-800 rounded transition"
          >
            {sidebarOpen ? (
              <XMarkIcon className="w-5 h-5" />
            ) : (
              <Bars3Icon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Menu Items */}
        <nav className={`flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const hasChildren = Boolean(item.children?.length)
            const active = hasChildren
              ? item.children!.some((child) => location.pathname.startsWith(child.path))
              : isActive(item.path)
            const expanded = expandedMenu === item.path

            return (
              <div key={item.path}>
                <button
                  onClick={() => {
                    if (hasChildren) {
                      setExpandedMenu(expanded ? null : item.path)
                      if (!active) navigate(item.path)
                    } else {
                      handleMenuItemClick(item.path)
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    active ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-800'
                  }`}
                  title={!sidebarOpen ? item.label : ''}
                  aria-expanded={hasChildren ? expanded : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className={`flex-1 text-left ${!sidebarOpen && 'hidden'}`}>{item.label}</span>
                  {hasChildren && sidebarOpen && (
                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {hasChildren && expanded && sidebarOpen && (
                  <div className="ml-6 mt-1 space-y-1 border-l border-blue-700 pl-3">
                    {item.children!.map((child) => {
                      const childActive = location.pathname.startsWith(child.path)
                      return (
                        <button
                          key={child.path}
                          type="button"
                          onClick={() => navigate(child.path)}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                            childActive
                              ? 'bg-blue-800 font-semibold text-white'
                              : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                          }`}
                        >
                          {child.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className={`p-3 sm:p-4 border-t border-blue-800 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-800 transition"
            title={!sidebarOpen ? 'Cerrar sesión' : ''}
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            <span className={`${!sidebarOpen && 'hidden'}`}>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-full p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
