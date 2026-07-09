import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'
import sgMail, { MailDataRequired } from '@sendgrid/mail'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const loadEnvFromPaths = () => {
  const envPaths = [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(process.cwd(), './server/.env'),
    path.resolve(process.cwd(), '../server/.env'),
    path.resolve(process.cwd(), '.env')
  ]

  for (const envPath of envPaths) {
    const result = dotenv.config({ path: envPath })
    if (!result.error) {
      console.log('Loaded env from', envPath)
      return true
    }
  }

  console.warn('Email util did not load .env from known paths. cwd=', process.cwd())
  return false
}

if (!process.env.SENDGRID_API_KEY && !process.env.SMTP_USER && !process.env.SMTP_PASS && !process.env.EMAIL_USER && !process.env.EMAIL_PASSWORD) {
  loadEnvFromPaths()
}

const getSendGridApiKey = () => process.env.SENDGRID_API_KEY?.trim()
const getUseSendGrid = () => Boolean(getSendGridApiKey())

const createTransporter = () => {
  const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER
  const smtpPass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
  const smtpSecure = process.env.SMTP_SECURE === 'true'
  const smtpService = process.env.EMAIL_SERVICE || process.env.SMTP_SERVICE || 'gmail'

  if (!smtpUser || !smtpPass) {
    return null
  }

  return nodemailer.createTransport({
    host: smtpHost || undefined,
    port: smtpPort,
    secure: smtpSecure,
    service: smtpHost ? undefined : smtpService,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })
}

export const sendOrderEmail = async (order: any, options?: { subject?: string; showVoucher?: boolean }) => {
  const subject = options?.subject || `Confirmación de Pedido ${order.orderNumber}`
  const showVoucher = options?.showVoucher ?? (order.paymentMethod === 'oxxo' && order.paymentStatus === 'pending')

  const itemsHtml = (order.items || []).map((it: any) => `
    <li>${it.productId} &times; ${it.quantity} — $${(it.price).toFixed(2)}</li>
  `).join('')

  const voucherHtml = showVoucher && order.oxxoVoucherUrl ? `
    <h3>Pago en OXXO</h3>
    <p>Puedes pagar con el siguiente link / voucher (válido 72 horas):</p>
    <p><a href="${order.oxxoVoucherUrl}">${order.oxxoVoucherUrl}</a></p>
  ` : ''

  const html = `
    <h2>Gracias por tu compra — ${order.orderNumber}</h2>
    <p>Hola ${order.customer.firstName} ${order.customer.lastName},</p>
    <p>Recibimos tu pedido. A continuación los detalles:</p>
    <h3>Resumen</h3>
    <ul>
      ${itemsHtml}
    </ul>
    <p>Subtotal: $${(order.subtotal || 0).toFixed(2)}</p>
    <p>Envío: $${(order.shippingCost || 0).toFixed(2)}</p>
    <p><strong>Total: $${(order.total || 0).toFixed(2)}</strong></p>
    ${voucherHtml}
    <h3>Dirección de envío</h3>
    <p>${order.shippingAddress.street} ${order.shippingAddress.number} ${order.shippingAddress.complement || ''}</p>
    <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode} - ${order.shippingAddress.country}</p>
    <p>Si tienes preguntas, responde a este correo.</p>
  `

  try {
    const useSendGrid = getUseSendGrid()

    if (useSendGrid) {
      const apiKey = getSendGridApiKey()
      if (!apiKey) {
        console.warn('SendGrid API key not configured, skipping sendOrderEmail')
        return
      }
      sgMail.setApiKey(apiKey)

      const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER
      if (!fromEmail) {
        console.warn('SendGrid from address not configured, skipping sendOrderEmail')
        return
      }

      const msg: MailDataRequired = {
        to: order.customer.email,
        from: fromEmail,
        subject,
        html,
      }
      await sgMail.send(msg)
      console.log('Order email sent via SendGrid to', order.customer.email)
    } else {
      const transporter = createTransporter()
      if (!transporter) {
        console.warn('SMTP transporter not configured, skipping sendOrderEmail')
        return
      }

      const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER
      const smtpPass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS
      if (!smtpUser || !smtpPass) {
        console.warn('Email credentials not configured, skipping sendOrderEmail')
        return
      }

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || smtpUser,
        to: order.customer.email,
        subject,
        html,
      })
      console.log('Order email sent via SMTP to', order.customer.email)
    }
  } catch (error: any) {
    console.error('Failed to send order email:', error.message || error)
  }
}
