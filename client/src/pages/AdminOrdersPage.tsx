import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  EyeIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import { API_BASE_URL } from '@/api/config'

interface OrderItem {
  productId: string
  quantity: number
  price: number
}

interface Order {
  _id: string
  orderNumber: string
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  items: OrderItem[]
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  paymentStatus: 'pending' | 'completed' | 'failed'
  shippingMethod: string
  createdAt: string
}

type OrderStatus = 'all' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  returned: 'bg-orange-100 text-orange-800',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  returned: 'Devuelto',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<OrderStatus>('all')
  const [showFilters, setShowFilters] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
    fetchOrders()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [orders, searchTerm, filterStatus])

  const checkAuth = () => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      navigate('/admin/login')
    }
  }

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.get(`${API_BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setOrders(response.data)
      setFilteredOrders(response.data)
    } catch (error) {
      toast.error('Error cargando pedidos')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...orders]

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter((order) => order.status === filterStatus)
    }

    // Ordenar por fecha (más recientes primero)
    filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    setFilteredOrders(filtered)
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.put(
        `${API_BASE_URL}/orders/${orderId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setOrders(orders.map((o) => (o._id === orderId ? response.data : o)))
      toast.success('Estado del pedido actualizado')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error actualizando el pedido')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('admin')
    navigate('/admin/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h1>
          <button onClick={handleLogout} className="px-4 py-2 text-red-600 text-sm hover:bg-red-50 rounded">
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              placeholder="Buscar por orden, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <FunnelIcon className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Filtros</span>
            </button>
          </div>

          {showFilters && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Estado del Pedido</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status as OrderStatus)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      filterStatus === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'all' ? 'Todos' : statusLabels[status]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">No hay pedidos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">{order.customer.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  <p>{order.customer.firstName} {order.customer.lastName}</p>
                  <p>Total: ${order.total.toFixed(2)}</p>
                  <p>Pago: {order.paymentStatus === 'completed' ? 'Pagado' : 'Pendiente'}</p>
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <button
                    onClick={() => navigate(`/admin/orders/${order._id}`)}
                    className="flex-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium"
                  >
                    <EyeIcon className="w-4 h-4 inline mr-1" />
                    Ver
                  </button>

                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="flex-1 px-2 py-2 text-xs border border-gray-300 rounded"
                    >
                      {order.status === 'pending' && (
                        <>
                          <option value="pending">Pendiente</option>
                          <option value="confirmed">Confirmar</option>
                          <option value="cancelled">Cancelar</option>
                        </>
                      )}
                      {order.status === 'confirmed' && (
                        <>
                          <option value="confirmed">Confirmado</option>
                          <option value="shipped">Enviar</option>
                          <option value="cancelled">Cancelar</option>
                        </>
                      )}
                      {order.status === 'shipped' && (
                        <>
                          <option value="shipped">Enviado</option>
                          <option value="delivered">Entregar</option>
                        </>
                      )}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600">Total de Pedidos</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{orders.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600">Ingresos Totales</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ${orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600">Entregados</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {orders.filter((o) => o.status === 'delivered').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}