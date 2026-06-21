import { Link } from 'react-router-dom'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">QUINGO</h3>
            <p className="text-gray-400 text-sm">
              Distribuidor especializado en accesorios para soldar, protección industrial y componentes para gases.
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold mb-4">Productos</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/products?category=welding" className="hover:text-white transition">
                  Accesorios de Soldar
                </Link>
              </li>
              <li>
                <Link to="/products?category=safety" className="hover:text-white transition">
                  Protección Industrial
                </Link>
              </li>
              <li>
                <Link to="/products?category=gases" className="hover:text-white transition">
                  Componentes para Gases
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Soporte</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#contact" className="hover:text-white transition">
                  Contacto
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition">
                  Preguntas Frecuentes
                </a>
              </li>
              <li>
                <a href="#shipping" className="hover:text-white transition">
                  Envíos
                </a>
              </li>
              <li>
                <a href="#returns" className="hover:text-white transition">
                  Devoluciones
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#privacy" className="hover:text-white transition">
                  Política de Privacidad
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-white transition">
                  Términos de Servicio
                </a>
              </li>
              <li>
                <a href="#cookies" className="hover:text-white transition">
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>&copy; {currentYear} Quingo. Todos los derechos reservados.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#facebook" className="hover:text-white transition">
              Facebook
            </a>
            <a href="#instagram" className="hover:text-white transition">
              Instagram
            </a>
            <a href="#whatsapp" className="hover:text-white transition">
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
