import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomerStore } from '@/store/customerStore'
import { customerAPI } from '@/api/customerApi'
import { IOrder } from '@/types/customer'
import toast from 'react-hot-toast'

export default function OrderHistoryPage() {
  const navigate = useNavigate()
  const { token } = useCustomerStore()
  const [orders, setOrders] = useState<IOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null)
  const [requestType, setRequestType] = useState<'cancellation' | 'return' | null>(null)
  const [requestReason, setRequestReason] = useState('')
  const [requestComments, setRequestComments] = useState('')
  const [submittingRequest, setSubmittingRequest] = useState(false)

  useEffect(() => {
    if (!token) {
      navigate('/customer/login')
      return
    }

    fetchOrders()
  }, [token, navigate])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await customerAPI.getOrders()
      setOrders(response.data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'returned':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
      returned: 'Devuelto',
    }
    return labels[status] || status
  }

  const submitServiceRequest = async () => {
    if (!selectedOrder || !requestType || !requestReason) return
    try {
      setSubmittingRequest(true)
      const response = await customerAPI.requestOrderService(selectedOrder._id, {
        type: requestType,
        reason: requestReason,
        comments: requestComments,
      })
      setSelectedOrder(response.data)
      setOrders((current) => current.map((order) => order._id === response.data._id ? response.data : order))
      setRequestType(null)
      setRequestReason('')
      setRequestComments('')
      toast.success('Solicitud enviada. Puedes consultar su estado aquí.')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'No se pudo enviar la solicitud')
    } finally {
      setSubmittingRequest(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Historial de Pedidos</h1>
            <button
              onClick={() => navigate('/customer/profile')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
            >
              ← Volver
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-gray-500">Cargando pedidos...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <p className="text-gray-600 mb-4">No tienes pedidos aún</p>
              <button
                onClick={() => navigate('/products')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Ir a Productos
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Pedido #{order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('es-MX')}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                      <p className="text-lg font-bold text-gray-800">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>{order.items.length}</strong> {order.items.length === 1 ? 'producto' : 'productos'}
                    </p>
                    <div className="text-sm text-gray-600">
                      <p>{order.shippingAddress.street} {order.shippingAddress.number}</p>
                      <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

          {/* Order Detail Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
                <div className="p-6 border-b flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Pedido #{selectedOrder.orderNumber}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Estado</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusLabel(selectedOrder.status)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Artículos ({selectedOrder.items.length})</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      {selectedOrder.items.map((item, idx) => (
                        <p key={idx}>
                          Producto {item.productId} - Cantidad: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Envío</h3>
                    <div className="text-sm text-gray-600">
                      <p>{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</p>
                      <p>{selectedOrder.shippingAddress.street} {selectedOrder.shippingAddress.number}</p>
                      {selectedOrder.shippingAddress.complement && (
                        <p>{selectedOrder.shippingAddress.complement}</p>
                      )}
                      <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</p>
                      <p>{selectedOrder.shippingAddress.zipCode} - {selectedOrder.shippingAddress.country}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="text-gray-800">${selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {selectedOrder.serviceRequest && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
                      <h3 className="font-semibold text-blue-950">{selectedOrder.serviceRequest.type === 'cancellation' ? 'Solicitud de cancelación' : 'Solicitud de devolución'}</h3>
                      <p className="mt-1 text-sm text-blue-900">Estado: <strong>{selectedOrder.serviceRequest.status === 'pending' ? 'En revisión' : selectedOrder.serviceRequest.status === 'approved' ? 'Aprobada' : 'Rechazada'}</strong></p>
                      <p className="mt-1 text-sm text-blue-900">Motivo: {selectedOrder.serviceRequest.reason}</p>
                      {selectedOrder.serviceRequest.resolutionNotes && <p className="mt-2 text-sm text-blue-900">Respuesta: {selectedOrder.serviceRequest.resolutionNotes}</p>}
                    </div>
                  )}

                  {selectedOrder.serviceRequest?.status !== 'pending' && (
                    <div className="border-t pt-4">
                      {!requestType ? (
                        <div className="grid gap-2">
                          {['pending', 'confirmed'].includes(selectedOrder.status) && <button onClick={() => setRequestType('cancellation')} className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700">Solicitar cancelación</button>}
                          {selectedOrder.status === 'delivered' && <button onClick={() => setRequestType('return')} className="rounded-lg border border-orange-300 px-3 py-2 text-sm font-semibold text-orange-700">Solicitar devolución</button>}
                        </div>
                      ) : (
                        <div className="space-y-3 text-left">
                          <h3 className="font-semibold">{requestType === 'cancellation' ? 'Solicitar cancelación' : 'Solicitar devolución'}</h3>
                          <select value={requestReason} onChange={(e) => setRequestReason(e.target.value)} className="w-full rounded-lg border px-3 py-2">
                            <option value="">Selecciona el motivo</option>
                            <option value="Compra por error">Compra por error</option>
                            <option value="Necesito cambiar el pedido">Necesito cambiar el pedido</option>
                            <option value="Producto dañado">Producto dañado</option>
                            <option value="Producto incorrecto">Producto incorrecto</option>
                            <option value="No cumple con lo esperado">No cumple con lo esperado</option>
                            <option value="Otro">Otro</option>
                          </select>
                          <textarea value={requestComments} onChange={(e) => setRequestComments(e.target.value)} placeholder="Describe los detalles de tu solicitud" rows={3} className="w-full rounded-lg border px-3 py-2" />
                          <div className="flex gap-2">
                            <button disabled={!requestReason || submittingRequest} onClick={submitServiceRequest} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-400">{submittingRequest ? 'Enviando...' : 'Enviar solicitud'}</button>
                            <button onClick={() => setRequestType(null)} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-6 border-t bg-gray-50 sticky bottom-0">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  )
}
