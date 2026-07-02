import express, { Router, Request, Response } from 'express'
import Stripe from 'stripe'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10' as any
})

// Create Payment Intent
router.post('/intent', authMiddleware, async (req: Request, res: Response) => {
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
      currency: 'usd', // OXXO is supported in USD
      payment_method_types: ['oxxo'],
      description: description || 'Quingo Order Payment - OXXO',
      receipt_email: email,
      metadata: {
        customerId: (req as any).user?.id,
        orderId: req.body.orderId || 'pending',
        paymentMethod: 'oxxo'
      }
    })

    // Charge the payment intent (for OXXO/boleto methods, this generates the voucher)
    const charge = await stripe.charges.create({
      amount: Math.round(amount),
      currency: 'usd',
      source: 'tok_oxxo', // Special token for OXXO
      receipt_email: email,
      description: description || 'Quingo Order Payment - OXXO',
      metadata: {
        customerId: (req as any).user?.id,
        orderId: req.body.orderId || 'pending'
      }
    })

    // The receipt_url contains the OXXO voucher/barcode
    res.json({
      paymentIntentId: paymentIntent.id,
      chargeId: charge.id,
      receiptUrl: charge.receipt_url || null,
      status: charge.status,
      amount: charge.amount,
      message: 'OXXO voucher generated. Customer can pay at any OXXO store within 72 hours.'
    })
  } catch (error: any) {
    console.error('OXXO payment creation error:', error)
    res.status(500).json({ error: error.message || 'Failed to create OXXO payment' })
  }
})

export default router
