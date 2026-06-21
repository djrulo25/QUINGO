import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export default function HomePage() {
  const categories = [
    {
      id: 'welding',
      name: 'Accesorios para Soldar',
      description: 'Equipos y accesorios de alta calidad para soldadura profesional',
      icon: '🔥',
    },
    {
      id: 'safety',
      name: 'Protección Industrial',
      description: 'Equipo de protección personal para ambientes industriales',
      icon: '🛡️',
    },
    {
      id: 'gases',
      name: 'Componentes para Gases',
      description: 'Sistemas y componentes para gases industriales y medicinales',
      icon: '⚙️',
    },
  ]

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-6">
              Soluciones Industriales Confiables
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Distribuidor especializado en accesorios para soldar, protección industrial y componentes para gases.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/products"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg flex items-center gap-2 transition"
              >
                Ver Catálogo
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <a
                href="#contact"
                className="border border-white hover:bg-white hover:text-gray-900 text-white font-semibold py-3 px-8 rounded-lg transition"
              >
                Contactar
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Nuestras Categorías</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition group"
              >
                <div className="text-5xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-blue-600 transition">
                  {category.name}
                </h3>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <div className="flex items-center text-blue-600 font-semibold">
                  Ver productos
                  <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">¿Por Qué Elegirnos?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Productos Certificados',
                description: 'Todo nuestro inventario cumple con normas internacionales',
              },
              {
                title: 'Entrega Rápida',
                description: 'Envío en 24-48 horas a nivel nacional',
              },
              {
                title: 'Soporte Técnico',
                description: 'Equipo especializado disponible para asesoría',
              },
              {
                title: 'Precios Competitivos',
                description: 'Mejores precios sin comprometer la calidad',
              },
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">¿Listo para comprar?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Explora nuestro completo catálogo de productos industriales y encuentra exactamente lo que necesitas.
          </p>
          <Link
            to="/products"
            className="inline-block bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-8 rounded-lg transition"
          >
            Ir al Catálogo
          </Link>
        </div>
      </section>
    </>
  )
}
