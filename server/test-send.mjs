import sgMail from '@sendgrid/mail'
import dotenv from 'dotenv'
dotenv.config()

if (!process.env.SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY not set in env')
  process.exit(1)
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const msg = {
  to: process.env.TEST_EMAIL || 'tu@correo.com',
  from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  subject: 'Prueba SendGrid desde Quingo server',
  html: '<strong>Este es un correo de prueba enviado desde la integración de SendGrid</strong>',
}

sgMail.send(msg).then(() => {
  console.log('Prueba enviada. Revisa la bandeja del destinatario.')
}).catch(err => {
  console.error('Error enviando prueba:', err.response?.body || err.message || err)
})
