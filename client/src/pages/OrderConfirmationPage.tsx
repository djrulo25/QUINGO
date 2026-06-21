import { useParams, Link } from 'react-router-dom'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>()

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4">¡Pedido Confirmado!</h1>
        <p className="text-gray-600 mb-6">
          Gracias por tu compra. Tu pedido ha sido recibido y pronto comenzará el proceso de envío.
        </p>

        <div className="bg-gray-50 rounded-lg p-8 mb-8">
          <p className="text-gray-600 mb-2">Número de Orden</p>
          <p className="text-3xl font-mono font-bold text-gray-900">#{orderId}</p>
        </div>

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
            href="mailto:info@quingo.com"
            className="bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-800 transition"
          >
            Contactar Soporte
          </a>
        </div>
      </div>
    </div>
  )
}
