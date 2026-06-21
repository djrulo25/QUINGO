import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  ShoppingCartIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'

interface OrderStats {
  total: number
  pending: number
  confirmed: number
  shipped: number
  delivered: number
  cancelled: number
  returned: number
  totalRevenue: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        navigate('/admin/login')
        return
      }

      const response = await axios.get('http://localhost:3000/api/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const orders = response.data
      const stats: OrderStats = {
        total: orders.length,
        pending: orders.filter((o: any) => o.status === 'pending').length,
        confirmed: orders.filter((o: any) => o.status === 'confirmed').length,
        shipped: orders.filter((o: any) => o.status === 'shipped').length,
        delivered: orders.filter((o: any) => o.status === 'delivered').length,
        cancelled: orders.filter((o: any) => o.status === 'cancelled').length,
        returned: orders.filter((o: any) => o.status === 'returned').length,
        totalRevenue: orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0),
      }

      setStats(stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Cargando...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center text-red-600">
        Error cargando estadísticas
      </div>
    )
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    onClick,
  }: {
    title: string
    value: string | number
    icon: any
    color: string
    onClick?: () => void
  }) => (
    <div
      onClick={onClick}
      className={`p-6 rounded-lg shadow cursor-pointer transition transform hover:scale-105 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <Icon className="w-12 h-12 text-gray-400" />
      </div>
    </div>
  )

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Pedidos Totales"
          value={stats.total}
          icon={ShoppingCartIcon}
          color="bg-blue-50"
          onClick={() => navigate('/admin/orders')}
        />

        <StatCard
          title="Pendientes"
          value={stats.pending}
          icon={ClockIcon}
          color="bg-yellow-50"
          onClick={() => navigate('/admin/orders?filter=pending')}
        />

        <StatCard
          title="Confirmados"
          value={stats.confirmed}
          icon={CheckCircleIcon}
          color="bg-purple-50"
        />

        <StatCard
          title="En Tránsito"
          value={stats.shipped}
          icon={TruckIcon}
          color="bg-indigo-50"
          onClick={() => navigate('/admin/orders?filter=shipped')}
        />

        <StatCard
          title="Entregados"
          value={stats.delivered}
          icon={CheckCircleIcon}
          color="bg-green-50"
        />

        <StatCard
          title="Devoluciones"
          value={stats.returned}
          icon={ClockIcon}
          color="bg-orange-50"
          onClick={() => navigate('/admin/orders?filter=returned')}
        />
      </div>

      {/* Revenue and Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Ingresos Totales</p>
              <p className="text-3xl font-bold text-gray-900">
                ${stats.totalRevenue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Estados</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cancelados</span>
              <span className="font-semibold text-red-600">{stats.cancelled}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1"></div>
            <div className="flex justify-between items-center text-sm mt-4">
              <span className="text-gray-600">Tasa de Entrega</span>
              <span className="font-semibold text-green-600">
                {stats.total > 0
                  ? ((stats.delivered / stats.total) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/admin/products')}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-center"
          >
            <p className="font-semibold text-gray-900">Gestionar Productos</p>
            <p className="text-sm text-gray-600 mt-1">Añadir, editar o eliminar</p>
          </button>

          <button
            onClick={() => navigate('/admin/orders')}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-center"
          >
            <p className="font-semibold text-gray-900">Ver Pedidos</p>
            <p className="text-sm text-gray-600 mt-1">Gestionar todos los pedidos</p>
          </button>

          <button
            onClick={() => navigate('/admin/orders?filter=shipped')}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-center"
          >
            <p className="font-semibold text-gray-900">Entregas Activas</p>
            <p className="text-sm text-gray-600 mt-1">Pedidos en tránsito</p>
          </button>
        </div>
      </div>
    </div>
  )
}
