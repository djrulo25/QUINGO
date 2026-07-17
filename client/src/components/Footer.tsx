import { Link } from 'react-router-dom'
import BrandLogo from '@/components/BrandLogo'

const supportLinks = [
  { label: 'Cotizacion rapida', to: '/#quote' },
  { label: 'Asesoria tecnica', to: '/contacto' },
  { label: 'Envios', to: '/#shipping' },
  { label: 'Devoluciones', to: '/devoluciones' },
  { label: 'Facturacion', to: '/facturacion' },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-12 bg-gray-950 text-white">
      <div className="border-b border-gray-800 bg-blue-950">
        <div className="container mx-auto grid grid-cols-1 gap-3 px-4 py-4 text-sm sm:grid-cols-3">
          <a href="tel:+5215576881138" className="font-semibold hover:text-blue-200">
            Telefono: +52 1 55 7688 1138
          </a>
          <a href="/#quote" className="font-semibold hover:text-blue-200">
            Cotiza por WhatsApp o formulario
          </a>
          <span className="font-semibold text-blue-100">
            Entrega y soporte para industria
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <Link to="/" aria-label="Ir al inicio" className="inline-block text-white">
              <BrandLogo variant="vertical" />
            </Link>
            <p className="mt-3 text-sm text-gray-400">
              Suministros industriales para soldadura, proteccion, gases y operacion diaria.
            </p>
            <div id="contact" className="mt-4 space-y-1 text-sm text-gray-300">
              <p>Atencion comercial</p>
              <a href="tel:+5215576881138" className="block font-semibold text-white hover:text-blue-200">
                +52 1 55 7688 1138
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold">Compra y soporte</h4>
            <ul className="mt-4 space-y-2 text-sm text-gray-400">
              {supportLinks.map((link) => (
                <li key={link.to + link.label}>
                  <Link to={link.to} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">Cuenta y legal</h4>
            <ul className="mt-4 space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/customer/login" className="hover:text-white">
                  Iniciar sesion
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white">
                  Carrito
                </Link>
              </li>
              <li>
                <Link to="/privacidad" className="hover:text-white">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link to="/terminos" className="hover:text-white">
                  Terminos
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-6 text-sm text-gray-400">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; {currentYear} Quingo. Todos los derechos reservados.</p>
            <p>Catalogo industrial en linea | MXN</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
