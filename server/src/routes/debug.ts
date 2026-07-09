import { Router, Request, Response } from 'express'
import { sendOrderEmail } from '../utils/email.js'

const router = Router()

// Returns runtime email configuration status (do NOT expose secrets)
router.get('/email-config', (req: Request, res: Response) => {
  try {
    const sendgridKey = process.env.SENDGRID_API_KEY || ''
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || ''
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || ''
    const from = process.env.EMAIL_FROM || ''

    res.json({
      sendGridConfigured: !!sendgridKey,
      sendGridKeyLength: sendgridKey ? sendgridKey.length : 0,
      smtpConfigured: !!(smtpUser && smtpPass),
      fromConfigured: !!from,
      cwd: process.cwd()
    })
  } catch (err: any) {
    console.error('Debug email-config error:', err)
    res.status(500).json({ error: err.message || 'Failed to read env' })
  }
})

// Send a test order email. Body: { email: string, name?: string }
router.post('/send-test', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body
    if (!email) return res.status(400).json({ error: 'email is required' })

    const sampleOrder = {
      orderNumber: `TEST-${Date.now()}`,
      customer: {
        firstName: name || 'Cliente',
        lastName: '',
        email,
        phone: '0000000000'
      },
      items: [
        { productId: 'prod-test-1', quantity: 1, price: 19.99 },
        { productId: 'prod-test-2', quantity: 2, price: 9.5 }
      ],
      shippingAddress: {
        street: 'Calle de prueba',
        number: '123',
        complement: '',
        city: 'Ciudad',
        state: 'Estado',
        zipCode: '00000',
        country: 'México'
      },
      shippingCost: 20,
      subtotal: 39.99,
      total: 59.99,
      oxxoVoucherUrl: null
    }

    await sendOrderEmail(sampleOrder, { subject: `Prueba de correo - ${sampleOrder.orderNumber}` })
    res.json({ success: true, message: 'Test email triggered (check inbox)' })
  } catch (error: any) {
    console.error('Debug send-test error:', error)
    res.status(500).json({ error: error.message || 'Failed to send test email' })
  }
})

export default router
