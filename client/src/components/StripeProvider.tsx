import React, { useEffect, useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { Stripe } from '@stripe/stripe-js'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || ''

if (!stripePublishableKey) {
  console.warn('Stripe publishable key is not configured')
}

interface StripeProviderProps {
  children: React.ReactNode
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  const [stripe, setStripe] = useState<Stripe | null>(null)

  useEffect(() => {
    // Load Stripe from CDN
    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'
    script.async = true
    script.onload = () => {
      if (window.Stripe) {
        const stripeInstance = (window.Stripe as any)(stripePublishableKey)
        setStripe(stripeInstance)
      }
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  if (!stripe) {
    return <div className="text-center py-8">Cargando procesador de pagos...</div>
  }

  return (
    <Elements stripe={stripe}>
      {children}
    </Elements>
  )
}
