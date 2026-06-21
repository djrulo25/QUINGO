import { useState } from 'react'
import { useCustomerStore } from '@/store/customerStore'
import toast from 'react-hot-toast'

export default function ForgotPasswordForm() {
  const { forgotPassword, isLoading } = useCustomerStore()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await forgotPassword(email)
      toast.success('Si el correo existe, recibirás un enlace de recuperación')
      setSubmitted(true)
      setEmail('')
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar la solicitud')
    }
  }

  if (submitted) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <div className="mb-4 text-4xl">✓</div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">¡Correo Enviado!</h2>
            <p className="text-gray-600 mb-4">
              Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-blue-600 hover:underline"
            >
              Volver a intentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Recuperar Contraseña</h2>
        <p className="text-gray-600 text-sm mb-6">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition"
          >
            {isLoading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
          </button>
        </form>
      </div>
    </div>
  )
}
