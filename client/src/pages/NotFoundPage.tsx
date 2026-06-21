import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-2xl text-gray-600 mb-8">Página no encontrada</p>
        <p className="text-gray-500 mb-8">
          La página que buscas no existe o ha sido movida.
        </p>
        <Link
          to="/"
          className="inline-block bg-gray-900 text-white font-semibold py-3 px-8 rounded-lg hover:bg-gray-800 transition"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  )
}
