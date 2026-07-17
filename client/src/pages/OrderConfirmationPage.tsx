import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { orderAPI } from '@/api'
import { Order } from '@/types'
import { useStoreSettings } from '@/store/StoreSettingsContext'

export default function OrderConfirmationPage() {
  const { settings } = useStoreSettings()
  const { orderId } = useParams<{ orderId: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return

    const fetchOrder = async () => {
      setLoading(true)
      try {
        const response = await orderAPI.getConfirmation(orderId, token)
        setOrder(response.data)
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'No se pudo cargar el pedido')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, token])

  if (loading) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg font-semibold">Cargando detalles de la orden...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg font-semibold text-red-600">{error}</p>
          <Link
            to="/products"
            className="mt-6 inline-block border border-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition"
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg font-semibold">No se encontró la información del pedido.</p>
          <Link
            to="/products"
            className="mt-6 inline-block border border-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition"
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  const orderStatusLabel = order.status === 'confirmed'
    ? 'Confirmado'
    : order.status === 'shipped'
      ? 'Enviado'
      : order.status === 'delivered'
        ? 'Entregado'
        : order.status === 'cancelled'
          ? 'Cancelado'
          : 'Pendiente de envío'

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 text-center max-w-3xl">
        <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4">¡Pedido Confirmado!</h1>
        <p className="text-gray-600 mb-6">
          Gracias por tu compra. Tu pedido ha sido recibido y pronto comenzará el proceso de envío.
        </p>

        <div className="bg-gray-50 rounded-lg p-8 mb-8">
          <p className="text-gray-600 mb-2">Número de Orden</p>
          <p className="text-3xl font-mono font-bold text-gray-900">#{order.orderNumber || orderId}</p>
          <p className="text-sm text-gray-500 mt-2">ID de pedido: {orderId}</p>
          <div className="mt-4 flex justify-center">
            <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-4 py-2 text-sm font-semibold">
              Estado de pedido: {orderStatusLabel}
            </span>
          </div>
        </div>

        {order.paymentMethod === 'oxxo' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-yellow-900 mb-3">Pago en OXXO</h3>
            {order.oxxoVoucherUrl ? (
              <>
                <p className="text-yellow-900 mb-3">
                  Tu código/voucher está listo. Abre el enlace y muestra el código en la tienda OXXO.
                </p>
                <a
                  href={order.oxxoVoucherUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block bg-yellow-900 text-white font-semibold py-3 px-6 rounded-lg hover:bg-yellow-800 transition"
                >
                  Ver Voucher OXXO
                </a>
                <p className="text-sm text-gray-600 mt-3">
                  Si el enlace no carga, copia la URL y abrela en una nueva pestaña.
                </p>
              </>
            ) : (
              <p className="text-yellow-900">
                El voucher OXXO no se generó completamente. Revisa tu email o contacta soporte si no recibes el código.
              </p>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
          <h3 className="font-semibold text-blue-900 mb-3">Próximos Pasos:</h3>
          <ol className="space-y-2 text-blue-900">
            <li>✓ Recibirás un email de confirmación en los próximos minutos</li>
            <li>✓ Tu pedido será preparado en 24 horas</li>
            <li>✓ Recibirás un número de seguimiento cuando se envíe</li>
            <li>✓ Puedes rastrear tu pedido en cualquier momento</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/products"
            className="border border-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition"
          >
            Continuar Comprando
          </Link>
          <a
            href={`mailto:${settings.contact.supportEmail}`}
            className="bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-800 transition"
          >
            Contactar Soporte
          </a>
        </div>
      </div>
    </div>
  )
}
