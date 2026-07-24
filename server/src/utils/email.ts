import nodemailer from 'nodemailer'
import sgMail, { MailDataRequired } from '@sendgrid/mail'
import StoreSettings, { DEFAULT_STORE_SETTINGS } from '../models/StoreSettings.js'

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

export const sendTransactionalEmail = async (to: string, subject: string, html: string) => {
  if (getUseSendGrid()) {
    const apiKey = getSendGridApiKey()
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER
    if (!apiKey || !fromEmail) throw new Error('SendGrid no está configurado completamente')
    sgMail.setApiKey(apiKey)
    await sgMail.send({ to, from: fromEmail, subject, html } as MailDataRequired)
    return
  }
  const transporter = createTransporter()
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.SMTP_USER
  if (!transporter || !fromEmail) throw new Error('El servicio de correo no está configurado')
  await transporter.sendMail({ from: fromEmail, to, subject, html })
}

export const sendOrderEmail = async (order: any, options?: { subject?: string; showVoucher?: boolean }) => {
  const settings: any = await StoreSettings.findOne({ storeKey: 'default' }).select('name currency').lean() || DEFAULT_STORE_SETTINGS
  const subject = options?.subject || `${settings.name} - Confirmación de Pedido ${order.orderNumber}`
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
    <h2>Gracias por comprar en ${settings.name} — ${order.orderNumber}</h2>
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

export const sendServiceRequestNotification = async (order: any) => {
  const settings: any = await StoreSettings.findOne({ storeKey: 'default' }).lean() || DEFAULT_STORE_SETTINGS
  const recipient = settings.contact?.supportEmail || settings.contact?.salesEmail || process.env.EMAIL_FROM
  if (!recipient) return
  const label = order.serviceRequest.type === 'cancellation' ? 'cancelación' : 'devolución'
  await sendTransactionalEmail(
    recipient,
    `Nueva solicitud de ${label} - ${order.orderNumber}`,
    `<h2>Nueva solicitud de ${label}</h2>
     <p>Pedido: <strong>${order.orderNumber}</strong></p>
     <p>Cliente: ${order.customer.firstName} ${order.customer.lastName} (${order.customer.email})</p>
     <p>Motivo: ${order.serviceRequest.reason}</p>
     <p>${order.serviceRequest.customerComments || ''}</p>`,
  )
}

export const sendServiceRequestResolution = async (order: any) => {
  const label = order.serviceRequest.type === 'cancellation' ? 'cancelación' : 'devolución'
  const result = order.serviceRequest.status === 'approved' ? 'aprobada' : 'rechazada'
  await sendTransactionalEmail(
    order.customer.email,
    `Tu solicitud de ${label} fue ${result} - ${order.orderNumber}`,
    `<h2>Solicitud ${result}</h2>
     <p>Tu solicitud de ${label} para el pedido <strong>${order.orderNumber}</strong> fue ${result}.</p>
     <p>${order.serviceRequest.resolutionNotes || 'Consulta el estado desde tu perfil.'}</p>`,
  )
}
