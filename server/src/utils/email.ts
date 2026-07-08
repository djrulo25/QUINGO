import nodemailer from 'nodemailer'
import sgMail from '@sendgrid/mail'

const useSendGrid = Boolean(process.env.SENDGRID_API_KEY)
if (useSendGrid) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')
}

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export const sendOrderEmail = async (order: any, options?: { subject?: string }) => {
  const subject = options?.subject || `Confirmación de Pedido ${order.orderNumber}`

  const itemsHtml = (order.items || []).map((it: any) => `
    <li>${it.productId} &times; ${it.quantity} — $${(it.price).toFixed(2)}</li>
  `).join('')

  const voucherHtml = order.oxxoVoucherUrl ? `
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
    if (useSendGrid) {
      const msg = {
        to: order.customer.email,
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        subject,
        html,
      }
      await sgMail.send(msg)
      console.log('Order email sent via SendGrid to', order.customer.email)
    } else {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn('Email credentials not configured, skipping sendOrderEmail')
        return
      }

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
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

export default transporter
