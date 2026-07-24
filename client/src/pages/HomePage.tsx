import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRightIcon,
  ClockIcon,
  CreditCardIcon,
  DocumentTextIcon,
  MapPinIcon,
  TruckIcon,
} from '@heroicons/react/24/outline'
import { categoryAPI, productAPI } from '@/api'
import ProductSearchBox from '@/components/ProductSearchBox'
import { CategoryTreeNode, Product } from '@/types'
import { getCategoryImage, getCategoryProductLink } from '@/utils/categoryCatalog'
import { getTopLevelCategories } from '@/utils/categories'
import { useStoreSettings } from '@/store/StoreSettingsContext'
type ProductRailVariant = 'offers' | 'new' | 'top'

const BRAND_LINKS = [
  { name: 'AVALLOY', image: '/images/brands/avalloy.svg', dark: true },
  { name: 'INFRA', image: '/images/brands/infra.png' },
  { name: 'JOSTEIN' },
  { name: 'LEO' },
  { name: 'OKILA', image: '/images/brands/okila.svg' },
  { name: 'OXFORD' },
  { name: 'PAC STD' },
  { name: 'SAMY' },
  { name: 'WESTERN', image: '/images/brands/western.png' },
] as const

const TRUST_SIGNALS = [
  {
    title: 'Pago seguro',
    description: 'Tarjeta, transferencia y opciones empresariales.',
    icon: CreditCardIcon,
  },
  {
    title: 'Facturacion',
    description: 'Datos fiscales y comprobantes para empresas.',
    icon: DocumentTextIcon,
  },
  {
    title: 'Entrega nacional',
    description: 'Cobertura para operaciones y talleres.',
    icon: TruckIcon,
  },
  {
    title: 'Horario comercial',
    description: 'Atencion Lun-Vie 9:00 a 18:00.',
    icon: ClockIcon,
  },
  {
    title: 'Zona de servicio',
    description: 'CDMX, area metropolitana y envios foraneos.',
    icon: MapPinIcon,
  },
]

export default function HomePage() {
  const { settings } = useStoreSettings()
  const [categories, setCategories] = useState<CategoryTreeNode[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [topProducts, setTopProducts] = useState<Product[]>([])
  const [postalCode, setPostalCode] = useState('')
  const [showDeliveryMessage, setShowDeliveryMessage] = useState(false)
  const [quoteForm, setQuoteForm] = useState({
    sku: '',
    quantity: '1',
    name: '',
    phone: '',
    notes: '',
  })
  const visibleCategories = categories.slice(0, 12)
  const offerProducts = useMemo(
    () => products.filter((product) => product.originalPrice && product.originalPrice > product.price).slice(0, 4),
    [products]
  )
  const newProducts = useMemo(
    () => [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4),
    [products]
  )
  const trustSignals = TRUST_SIGNALS.map((signal) => signal.title === 'Horario comercial'
    ? { ...signal, description: settings.contact.businessHours }
    : signal.title === 'Zona de servicio' ? { ...signal, description: settings.contact.serviceArea } : signal)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryAPI.getAll()
        setCategories(getTopLevelCategories(response.data))
      } catch (error) {
        console.error('Error loading categories', error)
      }
    }

    loadCategories()
  }, [])

  useEffect(() => {
    productAPI.getTopSelling()
      .then(({ data }) => setTopProducts(data.slice(0, 4)))
      .catch(() => setTopProducts([]))
  }, [])

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await productAPI.getAll()
        setProducts(response.data)
      } catch (error) {
        console.error('Error loading featured products', error)
      }
    }

    loadProducts()
  }, [])

  const handleQuoteChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setQuoteForm((current) => ({ ...current, [name]: value }))
  }

  const handleQuoteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = [
      `Hola ${settings.name}, quiero una cotización.`,
      `SKU/producto: ${quoteForm.sku || 'Por definir'}`,
      `Cantidad: ${quoteForm.quantity || '1'}`,
      `Nombre: ${quoteForm.name || 'No indicado'}`,
      `Telefono: ${quoteForm.phone || 'No indicado'}`,
      quoteForm.notes ? `Notas: ${quoteForm.notes}` : '',
    ].filter(Boolean).join('\n')

    window.location.href = `https://wa.me/${settings.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
  }

  const renderProductRail = (title: string, subtitle: string, items: Product[], variant: ProductRailVariant) => {
    if (items.length === 0) {
      return null
    }

    const theme = {
      offers: {
        section: 'border-y border-red-100 bg-gradient-to-r from-red-50 via-orange-50 to-amber-50',
        eyebrow: 'Oportunidades por tiempo limitado',
        eyebrowClass: 'text-red-700',
        titleClass: 'text-gray-950',
        subtitleClass: 'text-gray-600',
        linkClass: 'text-red-700 hover:text-red-900',
      },
      new: {
        section: 'bg-white',
        eyebrow: 'Recién agregados al catálogo',
        eyebrowClass: 'text-blue-700',
        titleClass: 'text-gray-950',
        subtitleClass: 'text-gray-600',
        linkClass: 'text-blue-700 hover:text-blue-900',
      },
      top: {
        section: 'bg-gray-950',
        eyebrow: 'Los favoritos de nuestros clientes',
        eyebrowClass: 'text-amber-300',
        titleClass: 'text-white',
        subtitleClass: 'text-gray-300',
        linkClass: 'text-amber-300 hover:text-amber-200',
      },
    }[variant]

    return (
      <section className={`py-10 sm:py-12 ${theme.section}`}>
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className={`text-xs font-bold uppercase tracking-[0.18em] ${theme.eyebrowClass}`}>{theme.eyebrow}</p>
              <h2 className={`mt-1 text-2xl font-bold sm:text-3xl ${theme.titleClass}`}>{title}</h2>
              <p className={`mt-1 text-sm ${theme.subtitleClass}`}>{subtitle}</p>
            </div>
            <Link to="/products" className={`shrink-0 text-sm font-semibold ${theme.linkClass}`}>
              Ver todo <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className={variant === 'offers' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2' : 'grid grid-cols-2 gap-3 md:grid-cols-4'}>
            {items.map((product, index) => {
              const discount = product.originalPrice
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0
              const badge = variant === 'offers'
                ? (discount > 0 ? `-${discount}%` : 'Oferta')
                : variant === 'new' ? 'Nuevo' : `Top ${index + 1}`

              return (
              <Link
                key={`${title}-${product.id}`}
                to={`/products/${product.id}`}
                className={`${variant === 'offers' ? 'grid grid-cols-[120px_1fr] items-center sm:grid-cols-[150px_1fr]' : 'block'} group relative overflow-hidden rounded-xl border p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${variant === 'top' ? 'border-gray-700 bg-gray-900' : variant === 'offers' ? 'border-red-100 bg-white' : 'border-gray-200 bg-white'}`}
              >
                <span className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${variant === 'offers' ? 'bg-red-600 text-white' : variant === 'new' ? 'bg-blue-700 text-white' : 'bg-amber-400 text-gray-950'}`}>{badge}</span>
                <div className={`aspect-square overflow-hidden rounded-lg ${variant === 'top' ? 'bg-white' : 'bg-gray-100'}`}>
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className={variant === 'offers' ? 'min-w-0 pl-4' : ''}>
                  <p className={`${variant === 'offers' ? '' : 'mt-3'} line-clamp-2 min-h-[40px] text-sm font-semibold leading-tight ${variant === 'top' ? 'text-white' : 'text-gray-900'}`}>{product.name}</p>
                  <p className={`mt-1 text-xs ${variant === 'top' ? 'text-gray-400' : 'text-gray-500'}`}>SKU: {product.sku}</p>
                  <div className="mt-2 flex flex-wrap items-baseline gap-2">
                    <span className={`text-lg font-bold ${variant === 'top' ? 'text-amber-300' : variant === 'offers' ? 'text-red-700' : 'text-gray-900'}`}>${product.price.toLocaleString()}</span>
                    {product.originalPrice && <span className={`text-xs line-through ${variant === 'top' ? 'text-gray-500' : 'text-gray-500'}`}>${product.originalPrice.toLocaleString()}</span>}
                  </div>
                  {variant === 'offers' && <span className="mt-3 inline-flex items-center text-xs font-bold text-red-700">Ver oportunidad <ArrowRightIcon className="ml-1 h-3.5 w-3.5" /></span>}
                </div>
              </Link>
              )
            })}
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="bg-gray-100 py-3 sm:py-8">
        <div className="container mx-auto px-4">
          <ProductSearchBox
            categories={categories}
            inputClassName="sm:px-4 sm:py-3 sm:text-base"
            buttonClassName="sm:w-14"
          />

          <div className="mt-2 flex gap-2 overflow-x-auto pb-4 pt-1">
            {BRAND_LINKS.map((brand) => (
              <Link
                key={brand.name}
                to={`/products?brand=${encodeURIComponent(brand.name)}`}
                aria-label={`Ver productos ${brand.name}`}
                title={`Ver productos ${brand.name}`}
                className={`group flex h-12 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 px-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md sm:h-14 sm:w-32 ${
                  'dark' in brand && brand.dark ? 'bg-gray-950' : 'bg-white'
                }`}
              >
                {'image' in brand ? (
                  <img
                    src={brand.image}
                    alt={brand.name}
                    className="max-h-8 max-w-full object-contain transition group-hover:scale-105 sm:max-h-9"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-center text-sm font-black tracking-[0.12em] text-gray-800 transition group-hover:text-blue-800">
                    {brand.name}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="mt-3 overflow-hidden rounded-lg bg-white shadow-sm sm:mt-5">
            <div className="relative min-h-[130px] bg-gray-900 sm:min-h-[220px]">
              <img
                src={settings.home.heroImageUrl}
                alt={settings.home.heroTitle}
                className="absolute inset-0 h-full w-full object-cover opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-950/85 via-gray-950/45 to-transparent" />
              <div className="relative flex min-h-[130px] max-w-xl flex-col justify-center px-4 py-4 text-white sm:min-h-[220px] sm:px-8 sm:py-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-200 sm:text-sm">{settings.home.heroEyebrow || settings.name}</p>
                <h1 className="mt-1 text-xl font-bold leading-tight sm:mt-2 sm:text-4xl">
                  {settings.home.heroTitle}
                </h1>
                {settings.home.heroSubtitle && <p className="mt-2 hidden text-sm text-gray-100 sm:block">{settings.home.heroSubtitle}</p>}
                <Link
                  to="/products"
                  className="mt-3 inline-flex w-fit items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 transition hover:bg-gray-100 sm:mt-5 sm:px-4 sm:py-2 sm:text-sm"
                >
                  Ver catalogo
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="mb-3 flex items-end justify-between gap-4 sm:mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{settings.home.categoriesTitle}</h2>
              <p className="hidden text-sm text-gray-600 sm:block">{settings.home.categoriesSubtitle}</p>
            </div>
            <Link to="/products" className="hidden text-sm font-semibold text-blue-700 hover:text-blue-900 sm:block">
              Ver todo
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-4">
            {visibleCategories.map((category) => (
              <Link
                key={category.id}
                to={getCategoryProductLink(category)}
                className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-[4/3] overflow-hidden bg-gray-200">
                  <img
                    src={getCategoryImage(category)}
                    alt={category.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-2 sm:p-3">
                  <p className="text-center text-xs font-semibold leading-tight text-gray-900 sm:text-left sm:text-sm">{category.name}</p>
                  {category.children?.length > 0 && (
                    <p className="mt-1 hidden text-xs text-gray-500 sm:block">{category.children.length} secciones</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {renderProductRail(settings.home.offersTitle, settings.home.offersSubtitle, offerProducts, 'offers')}
      {renderProductRail(settings.home.newTitle, settings.home.newSubtitle, newProducts, 'new')}
      {renderProductRail(settings.home.topTitle, settings.home.topSubtitle, topProducts, 'top')}

      <section id="quote" className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_1.2fr] lg:p-8">
            <div>
              <p className="text-sm font-bold uppercase text-blue-800">Cotizacion rapida</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">{settings.home.quoteTitle}</h2>
              <p className="mt-3 text-sm text-gray-600">
                {settings.home.quoteDescription}
              </p>
              <div className="mt-5 rounded-lg bg-blue-50 p-4 text-sm text-blue-950">
                <p className="font-semibold">Tambien puedes llamar:</p>
                <a href={`tel:${settings.contact.phone.replace(/[^\d+]/g, '')}`} className="mt-1 block text-lg font-bold">
                  {settings.contact.phone}
                </a>
              </div>
            </div>

            <form onSubmit={handleQuoteSubmit} className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-gray-700">SKU o producto</label>
                <input
                  name="sku"
                  value={quoteForm.sku}
                  onChange={handleQuoteChange}
                  placeholder="Ej. electrodo 6013, regulador, SKU..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Cantidad</label>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  value={quoteForm.quantity}
                  onChange={handleQuoteChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Telefono</label>
                <input
                  name="phone"
                  value={quoteForm.phone}
                  onChange={handleQuoteChange}
                  placeholder="Tu telefono"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Nombre</label>
                <input
                  name="name"
                  value={quoteForm.name}
                  onChange={handleQuoteChange}
                  placeholder="Tu nombre"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-gray-700">Notas</label>
                <textarea
                  name="notes"
                  value={quoteForm.notes}
                  onChange={handleQuoteChange}
                  rows={3}
                  placeholder="Medidas, marca, urgencia o detalles de entrega"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
              <button
                type="submit"
                className="store-primary-bg rounded-lg px-4 py-3 text-sm font-bold text-white sm:col-span-2"
              >
                Enviar cotizacion por WhatsApp
              </button>
            </form>
          </div>
        </div>
      </section>

      <section id="shipping" className="bg-white py-5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {trustSignals.map((signal) => {
              const Icon = signal.icon
              return (
                <div key={signal.title} className="flex gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <Icon className="h-6 w-6 shrink-0 text-blue-900" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{signal.title}</p>
                    <p className="mt-1 text-xs text-gray-600">{signal.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-gray-100 py-8 sm:py-10">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-blue-950 p-5 text-white shadow-sm sm:p-7">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-white/10 p-3">
                <TruckIcon className="h-7 w-7 text-blue-200" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold sm:text-2xl">Consulta entrega en tu zona</h2>
                <p className="mt-1 text-sm text-blue-100">
                  Ingresa tu código postal para preparar una consulta de cobertura.
                </p>
              </div>
            </div>

            <div className="mt-5 flex min-w-0 flex-col gap-2 sm:flex-row">
              <input
                inputMode="numeric"
                maxLength={5}
                value={postalCode}
                onChange={(event) => {
                  setPostalCode(event.target.value.replace(/\D/g, ''))
                  setShowDeliveryMessage(false)
                }}
                placeholder="Código postal"
                aria-label="Código postal"
                className="w-full min-w-0 flex-1 rounded-lg border-0 px-3 py-2.5 text-gray-900 outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="button"
                disabled={postalCode.length !== 5}
                onClick={() => setShowDeliveryMessage(true)}
                className="w-full rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-blue-950 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Consultar
              </button>
            </div>

            {showDeliveryMessage && (
              <p className="mt-3 break-words rounded-lg bg-white/10 p-3 text-sm [overflow-wrap:anywhere]">
                Tenemos cobertura nacional. Confirma costo y tiempo para el C.P. {postalCode} mediante la cotización del producto.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
