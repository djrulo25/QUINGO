import { Link } from 'react-router-dom'
import BrandLogo from '@/components/BrandLogo'
import { useStoreSettings } from '@/store/StoreSettingsContext'

const supportLinks = [
  { label: 'Cotizacion rapida', to: '/#quote' },
  { label: 'Asesoria tecnica', to: '/contacto' },
  { label: 'Envios', to: '/#shipping' },
  { label: 'Devoluciones', to: '/devoluciones' },
  { label: 'Facturacion', to: '/facturacion' },
]

export default function Footer() {
  const { settings } = useStoreSettings()
  const currentYear = new Date().getFullYear()
  const phoneHref = `tel:${settings.contact.phone.replace(/[^\d+]/g, '')}`

  return (
    <footer className="mt-12 bg-gray-950 text-white">
      <div className="store-secondary-bg border-b border-gray-800">
        <div className="container mx-auto grid grid-cols-1 gap-3 px-4 py-4 text-sm sm:grid-cols-3">
          <a href={phoneHref} className="font-semibold hover:text-blue-200">
            Teléfono: {settings.contact.phone}
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
            <div className="flex justify-center md:justify-start">
              <Link to="/" aria-label="Ir al inicio" className="inline-block text-white">
              {settings.logoUrl
                ? <img src={settings.logoUrl} alt={settings.name} className="h-20 max-w-[150px] object-contain" />
                : settings.name.toUpperCase() === 'QUINGO' ? <BrandLogo variant="vertical" className="scale-[0.85] md:scale-100" /> : <span className="text-2xl font-bold">{settings.name}</span>}
              </Link>
            </div>
            <p className="mt-3 text-sm text-gray-400">
              {settings.home.footerTagline || settings.description}
            </p>
            <div id="contact" className="mt-4 space-y-1 text-sm text-gray-300">
              <p>Atencion comercial</p>
              <a href={phoneHref} className="block font-semibold text-white hover:text-blue-200">
                {settings.contact.phone}
              </a>
            </div>
            {Object.entries(settings.social).some(([, url]) => Boolean(url)) && <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-300">{Object.entries(settings.social).filter(([, url]) => Boolean(url)).map(([network, url]) => <a key={network} href={url} target="_blank" rel="noreferrer" className="capitalize hover:text-white">{network}</a>)}</div>}
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
            <p>&copy; {currentYear} {settings.name}. Todos los derechos reservados.</p>
            <p>Catálogo en línea | {settings.currency}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
