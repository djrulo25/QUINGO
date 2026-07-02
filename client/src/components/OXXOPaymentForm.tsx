import React, { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface OXXOPaymentFormProps {
  totalAmount: number
  orderId?: string
  email: string
  onPaymentSuccess: (paymentIntentId: string) => void
  onPaymentError: (error: string) => void
}

export const OXXOPaymentForm: React.FC<OXXOPaymentFormProps> = ({
  totalAmount,
  orderId,
  email,
  onPaymentSuccess,
  onPaymentError
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [voucherUrl, setVoucherUrl] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    setIsLoading(true)

    try {
      // Create OXXO payment intent on backend
      const token = localStorage.getItem('token') || localStorage.getItem('customerToken')
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/payments/oxxo`,
        {
          amount: Math.round(totalAmount * 100), // Convert to cents
          description: `Order Payment - ${orderId || 'pending'}`,
          orderId: orderId,
          email: email
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const { paymentIntentId, receiptUrl } = response.data

      // Show voucher URL for customer to pay
      if (receiptUrl) {
        setVoucherUrl(receiptUrl)
        toast.success('Voucher de OXXO generado. Por favor descargar e imprimir.')
      }

      onPaymentSuccess(paymentIntentId)
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Payment failed'
      setErrorMessage(errorMsg)
      onPaymentError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-semibold">Error: {errorMessage}</p>
        </div>
      )}

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-700 font-semibold mb-2">Pago en OXXO</p>
        <p className="text-sm text-blue-600">
          Se generará un código de barras que puedes pagar en cualquier OXXO. 
          Tienes hasta 72 horas para realizar el pago.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generando código...' : 'Generar Código de Pago OXXO'}
        </button>

        {voucherUrl && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-semibold mb-2">✓ Código generado</p>
            <p className="text-sm text-green-600 mb-3">
              Descarga tu voucher para pagar en OXXO
            </p>
            <a
              href={voucherUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Descargar Voucher
            </a>
          </div>
        )}
      </form>
    </div>
  )
}
