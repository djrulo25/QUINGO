import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

interface OrderItem {
  productId: string
  quantity: number
  price: number
  name?: string
}

interface Order {
  _id: string
  orderNumber: string
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
    company?: string
  }
  items: OrderItem[]
  shippingAddress: {
    street: string
    number: string
    complement?: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  shippingMethod: string
  shippingCost: number
  subtotal: number
  tax: number
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  paymentMethod: string
  paymentStatus: 'pending' | 'completed' | 'failed'
  notes?: string
  trackingNumber?: string
  returnReason?: string
  createdAt: string
  updatedAt: string
}

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

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [returnReason, setReturnReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    checkAuth()
    fetchOrder()
  }, [id])

  const checkAuth = () => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      navigate('/admin/login')
    }
  }

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.get(`http://localhost:3000/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setOrder(response.data)
      setAdminNotes(response.data.notes || '')
      setTrackingNumber(response.data.trackingNumber || '')
    } catch (error) {
      toast.error('Error cargando el pedido')
      navigate('/admin/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return

    try {
      setUpdatingStatus(true)
      const token = localStorage.getItem('adminToken')
      const updateData: any = { status: newStatus }

      // Validaciones según el estado
      if (newStatus === 'shipped' && !trackingNumber.trim()) {
        toast.error('Ingrese el número de seguimiento para enviar el pedido')
        setUpdatingStatus(false)
        return
      }

      if (newStatus === 'returned' && !returnReason.trim()) {
        toast.error('Ingrese la razón de la devolución')
        setUpdatingStatus(false)
        return
      }

      if (newStatus === 'shipped') {
        updateData.trackingNumber = trackingNumber
      }
      if (newStatus === 'returned') {
        updateData.returnReason = returnReason
      }

      const response = await axios.put(
        `http://localhost:3000/api/orders/${id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setOrder(response.data)
      toast.success('Estado del pedido actualizado')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error actualizando el pedido')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleUpdateNotes = async () => {
    if (!order) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.put(
        `http://localhost:3000/api/orders/${id}`,
        { notes: adminNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setOrder(response.data)
      toast.success('Notas actualizadas')
    } catch (error: any) {
      toast.error('Error actualizando notas')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pedido...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Pedido no encontrado</p>
          <button
            onClick={() => navigate('/admin/orders')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver a Pedidos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{order.orderNumber}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(order.createdAt).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/orders')}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition w-full sm:w-auto"
            >
              Volver
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Estado y Acciones */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado del Pedido</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <span className="text-sm font-medium text-gray-700">Estado Actual:</span>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          statusColors[order.status]
                        }`}
                      >
                        {statusLabels[order.status]}
                      </span>
                    </div>
                  </div>

                  {/* Estado de Pago */}
                  <div>
                    <span className="text-sm font-medium text-gray-700">Pago:</span>
                    <div
                      className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        order.paymentStatus === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : order.paymentStatus === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {order.paymentStatus === 'completed'
                        ? 'Pagado'
                        : order.paymentStatus === 'failed'
                        ? 'Pago Fallido'
                        : 'Pago Pendiente'}
                    </div>
                  </div>

                  {/* Cambiar Estado */}
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <div className="border-t pt-4">
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Cambiar Estado
                      </label>
                      <select
                        value={order.status}
                        onChange={(e) => {
                          const newStatus = e.target.value
                          if (
                            newStatus === 'shipped' ||
                            newStatus === 'returned'
                          ) {
                            // Estos requieren datos adicionales
                            if (newStatus === 'shipped') {
                              // Se requiere número de seguimiento
                            }
                          } else {
                            handleStatusChange(newStatus)
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        {order.status === 'pending' && (
                          <>
                            <option value="pending">Pendiente</option>
                            <option value="confirmed">Confirmar Pedido</option>
                            <option value="cancelled">Cancelar Pedido</option>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <>
                            <option value="confirmed">Confirmado</option>
                            <option value="shipped">Marcar como Enviado</option>
                            <option value="cancelled">Cancelar Pedido</option>
                          </>
                        )}
                        {order.status === 'shipped' && (
                          <>
                            <option value="shipped">Enviado</option>
                            <option value="delivered">Marcar como Entregado</option>
                            <option value="returned">Reportar Devolución</option>
                          </>
                        )}
                        {order.status === 'returned' && (
                          <>
                            <option value="returned">Devuelto</option>
                            <option value="confirmed">Reabrir Pedido</option>
                          </>
                        )}
                      </select>
                    </div>
                  )}

                  {/* Campo de Número de Seguimiento */}
                  {order.status !== 'pending' && (
                    <div className="border-t pt-4">
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Número de Seguimiento
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Ingrese el número de seguimiento..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 text-sm"
                      />
                      <button
                        onClick={() => handleStatusChange('shipped')}
                        disabled={updatingStatus || !trackingNumber.trim() || order.status !== 'confirmed'}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium"
                      >
                        {updatingStatus ? 'Actualizando...' : 'Actualizar Número de Seguimiento'}
                      </button>
                    </div>
                  )}

                  {/* Campo de Razón de Devolución */}
                  {order.status === 'shipped' && (
                    <div className="border-t pt-4">
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Razón de Devolución
                      </label>
                      <textarea
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        placeholder="Descripción del motivo de devolución..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 resize-none text-sm"
                      />
                      <button
                        onClick={() => handleStatusChange('returned')}
                        disabled={updatingStatus || !returnReason.trim()}
                        className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm font-medium"
                      >
                        {updatingStatus ? 'Procesando...' : 'Reportar Devolución'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Información del Cliente */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Nombre</p>
                    <p className="font-medium text-gray-900">
                      {order.customer.firstName} {order.customer.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-medium text-gray-900 break-all">{order.customer.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Teléfono</p>
                    <p className="font-medium text-gray-900">{order.customer.phone}</p>
                  </div>
                  {order.customer.company && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Empresa</p>
                      <p className="font-medium text-gray-900">{order.customer.company}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dirección de Envío */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Dirección de Envío</h2>
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">
                    {order.shippingAddress.street} {order.shippingAddress.number}
                  </p>
                  {order.shippingAddress.complement && (
                    <p className="text-gray-600">{order.shippingAddress.complement}</p>
                  )}
                  <p className="text-gray-600">
                    {order.shippingAddress.city}, {order.shippingAddress.state}
                  </p>
                  <p className="text-gray-600">
                    {order.shippingAddress.zipCode} - {order.shippingAddress.country}
                  </p>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-600">Método de Envío</p>
                    <p className="font-medium text-gray-900">{order.shippingMethod}</p>
                  </div>
                </div>
              </div>

              {/* Notas del Administrador */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notas Internas</h2>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Agregue notas internas sobre este pedido..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3 text-sm"
                />
                <button
                  onClick={handleUpdateNotes}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium"
                >
                  Guardar Notas
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Resumen de Pedido */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h2>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">Subtotal</p>
                  <p className="text-xl font-semibold text-gray-900">${order.subtotal.toFixed(2)}</p>
                </div>

                <div className="space-y-2 border-t border-gray-200 pt-4 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío ({order.shippingMethod})</span>
                    <span className="font-medium text-gray-900">${order.shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Impuestos (10%)</span>
                    <span className="font-medium text-gray-900">${order.tax.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-semibold text-green-600">${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Productos */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos ({order.items.length})</h2>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start pb-3 border-b last:border-0 last:pb-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">Producto #{index + 1}</p>
                        <p className="text-sm text-gray-600 break-all">ID: {item.productId}</p>
                        <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                      </div>
                      <div className="text-right ml-2 shrink-0">
                        <p className="font-medium text-gray-900">${item.price.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">x{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Información de Envío */}
              {order.status !== 'pending' && (
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Información de Envío</h3>
                  {order.trackingNumber ? (
                    <div>
                      <p className="text-sm text-blue-700 mb-1">Número de Seguimiento:</p>
                      <p className="font-mono font-semibold text-blue-900 break-all text-sm">{order.trackingNumber}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-blue-700">Número de seguimiento no disponible</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  )
}
