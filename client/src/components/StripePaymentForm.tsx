import React, { useState } from 'react'
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js'
import apiClient from '@/api'
import toast from 'react-hot-toast'

interface StripePaymentFormProps {
  totalAmount: number
  orderId?: string
  onPaymentSuccess: (paymentIntentId: string) => void
  onPaymentError: (error: string) => void
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  totalAmount,
  orderId,
  onPaymentSuccess,
  onPaymentError
}) => {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async () => {
    setErrorMessage(null)

    if (!stripe || !elements) {
      setErrorMessage('Stripe has not loaded yet. Please try again.')
      return
    }

    setIsLoading(true)

    try {
      // Step 1: Create Payment Intent on backend
      const response = await apiClient.post('/payments/intent', {
        amount: Math.round(totalAmount * 100), // Convert to cents
        description: `Order Payment - ${orderId || 'pending'}`,
        orderId: orderId
      })

      const { clientSecret, paymentIntentId } = response.data

      // Step 2: Confirm payment with Stripe
      const cardNumberElement = elements.getElement(CardNumberElement)
      if (!cardNumberElement) {
        throw new Error('Card number element not found')
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            // Add billing details if needed
          }
        }
      })

      if (error) {
        setErrorMessage(error.message || 'Payment failed')
        onPaymentError(error.message || 'Payment failed')
        toast.error(error.message || 'Payment failed')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!')
        onPaymentSuccess(paymentIntentId)
      } else {
        const errorMsg = 'Payment processing failed'
        setErrorMessage(errorMsg)
        onPaymentError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'An error occurred'
      setErrorMessage(errorMsg)
      onPaymentError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Información de Pago</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Tarjeta
          </label>
          <div className="p-3 border border-gray-300 rounded-lg">
            <CardNumberElement
              className="w-full"
              options={{
                style: {
                  base: {
                    fontSize: '15px',
                    color: '#424770',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    letterSpacing: '0.03em',
                    lineHeight: '22px',
                    '::placeholder': {
                      color: '#aab7c4'
                    }
                  },
                  invalid: {
                    color: '#9e2146'
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiración
            </label>
            <div className="p-3 border border-gray-300 rounded-lg">
              <CardExpiryElement
                className="w-full"
                options={{
                  style: {
                    base: {
                      fontSize: '15px',
                      color: '#424770',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      letterSpacing: '0.03em',
                      lineHeight: '22px',
                      '::placeholder': {
                        color: '#aab7c4'
                      }
                    },
                    invalid: {
                      color: '#9e2146'
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CVC
            </label>
            <div className="p-3 border border-gray-300 rounded-lg">
              <CardCvcElement
                className="w-full"
                options={{
                  style: {
                    base: {
                      fontSize: '15px',
                      color: '#424770',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      letterSpacing: '0.03em',
                      lineHeight: '22px',
                      '::placeholder': {
                        color: '#aab7c4'
                      }
                    },
                    invalid: {
                      color: '#9e2146'
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm sm:text-base text-blue-700 flex flex-wrap items-center gap-1">
            <span>Total a pagar:</span>
            <strong className="break-all">${(totalAmount).toFixed(2)}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleSubmit()
          }}
          disabled={isLoading || !stripe || !elements}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            isLoading || !stripe || !elements
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Procesando...
            </span>
          ) : (
            'Procesar Pago'
          )}
        </button>
      </div>
    </div>
  )
}

