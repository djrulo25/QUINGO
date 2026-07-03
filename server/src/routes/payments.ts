import express, { Router, Request, Response } from 'express'
import Stripe from 'stripe'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10' as any
})

// Create Payment Intent
router.post('/intent', async (req: Request, res: Response) => {
  try {
    const { amount, description, customerId } = req.body

    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Amount must be at least $1 USD (100 cents)' })
    }

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency: 'usd',
      description: description || 'Quingo Order Payment',
      metadata: {
        customerId: customerId || (req as any).user?.id,
        orderId: (req.body.orderId) || 'pending'
      }
    })

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })
  } catch (error: any) {
    console.error('Payment intent creation error:', error)
    res.status(500).json({ error: error.message || 'Failed to create payment intent' })
  }
})

// Confirm Payment
router.post('/confirm', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.body

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment Intent ID is required' })
    }

    // Retrieve the payment intent to check its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status === 'succeeded') {
      return res.json({
        success: true,
        status: 'succeeded',
        paymentIntentId: paymentIntent.id
      })
    } else if (paymentIntent.status === 'processing') {
      return res.json({
        success: false,
        status: 'processing',
        message: 'Payment is still processing'
      })
    } else {
      return res.json({
        success: false,
        status: paymentIntent.status,
        message: 'Payment failed or was cancelled'
      })
    }
  } catch (error: any) {
    console.error('Payment confirmation error:', error)
    res.status(500).json({ error: error.message || 'Failed to confirm payment' })
  }
})

// Refund Payment
router.post('/refund', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.body

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment Intent ID is required' })
    }

    // Create a refund for the payment intent
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId
    })

    res.json({
      success: true,
      refundId: refund.id,
      amount: refund.amount
    })
  } catch (error: any) {
    console.error('Refund error:', error)
    res.status(500).json({ error: error.message || 'Failed to process refund' })
  }
})

// Create OXXO Payment Intent
router.post('/oxxo', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { amount, description, email } = req.body

    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Amount must be at least $1 USD (100 cents)' })
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required for OXXO payments' })
    }

    // Create a payment intent with OXXO payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: 'mxn', // OXXO works with MXN
      payment_method_types: ['oxxo'],
      description: description || 'Quingo Order Payment - OXXO',
      receipt_email: email,
      metadata: {
        customerId: (req as any).user?.id,
        orderId: req.body.orderId || 'pending',
        paymentMethod: 'oxxo'
      }
    })

    // For testing/development, provide the client secret
    // In production, you would redirect to hosted payment page or confirm with your frontend
    res.json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      message: 'OXXO payment intent created. Use client secret to confirm payment.'
    })
  } catch (error: any) {
    console.error('OXXO payment creation error:', error)
    res.status(500).json({ error: error.message || 'Failed to create OXXO payment' })
  }
})

// Confirm OXXO Payment
router.post('/oxxo/confirm', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { clientSecret, returnUrl } = req.body

    if (!clientSecret) {
      return res.status(400).json({ error: 'Client secret is required' })
    }

    // Extract payment intent ID from client secret
    const paymentIntentId = clientSecret.split('_secret_')[0]

    // Retrieve the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    // For OXXO, we need to confirm with a redirect URL
    const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      return_url: returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-confirmation`,
      payment_method: { type: 'oxxo' }
    } as any)

    res.json({
      paymentIntentId: confirmedIntent.id,
      status: confirmedIntent.status,
      nextAction: confirmedIntent.next_action,
      redirectUrl: confirmedIntent.next_action?.redirect_to_url?.url || null,
      message: 'OXXO payment confirmed. Redirect to payment page.'
    })
  } catch (error: any) {
    console.error('OXXO payment confirmation error:', error)
    res.status(500).json({ error: error.message || 'Failed to confirm OXXO payment' })
  }
})

// Webhook for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe signature' })
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('Payment Intent Succeeded:', event.data.object)
        // Payment successful - you can update order status here
        break
      case 'charge.succeeded':
        console.log('Charge Succeeded:', event.data.object)
        // Charge successful
        break
      case 'payment_intent.payment_failed':
        console.log('Payment Intent Failed:', event.data.object)
        // Payment failed
        break
      default:
        console.log('Unhandled event type:', event.type)
    }

    res.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error.message)
    res.status(400).json({ error: error.message })
  }
})

export default router
