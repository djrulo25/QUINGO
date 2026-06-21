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
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
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

  const isActive = (path: string) => {
    if (path.includes('?')) {
      return location.pathname === path.split('?')[0] && location.search === '?' + path.split('?')[1]
    }
    return location.pathname === path
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-blue-900 text-white transition-all duration-300 flex flex-col shadow-lg`}
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-blue-800 flex items-center justify-between">
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
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  active
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-800'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={`${!sidebarOpen && 'hidden'}`}>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-blue-800">
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
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
