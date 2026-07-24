const normalizePhone = (value: string) => {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''

  // Los teléfonos nacionales capturados con 10 dígitos pertenecen a México.
  return digits.length === 10 ? `52${digits}` : digits
}

export const sendOrderWhatsApp = async (order: any) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  const from = process.env.TWILIO_WHATSAPP_FROM?.trim()
  const contentSid = process.env.TWILIO_WHATSAPP_CONTENT_SID?.trim()
  const recipient = normalizePhone(order?.customer?.phone)

  if (!accountSid || !authToken || !from || !contentSid) {
    console.warn('Twilio WhatsApp no está configurado; se omite la confirmación')
    return { skipped: true }
  }
  if (!recipient) {
    console.warn('El pedido no tiene un teléfono válido para WhatsApp')
    return { skipped: true }
  }

  const customerName = `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim()
  const availableVariables: Record<string, string> = {
    customerName: customerName || 'cliente',
    orderNumber: String(order.orderNumber),
    total: Number(order.total || 0).toFixed(2),
  }
  const variableNames = (process.env.TWILIO_WHATSAPP_VARIABLES || 'customerName,orderNumber,total')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
  const variables = Object.fromEntries(
    variableNames.map((name, index) => [String(index + 1), availableVariables[name] ?? name]),
  )
  const payload = new URLSearchParams({
    From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
    To: `whatsapp:+${recipient}`,
    ContentSid: contentSid,
    ContentVariables: JSON.stringify(variables),
  })

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload,
    },
  )

  const result: any = await response.json()
  if (!response.ok) {
    throw new Error(`Twilio WhatsApp: ${result?.message || response.statusText}`)
  }

  return { skipped: false, sid: result.sid, status: result.status }
}
