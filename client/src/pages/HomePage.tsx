import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import { flattenCategoryCatalog, getCategoryImage, getCategoryProductLink } from '@/utils/categoryCatalog'
import { getTopLevelCategories } from '@/utils/categories'

const POPULAR_SEARCHES = ['electrodos', 'guantes', 'reguladores', 'mangueras', 'caretas', 'soldadura']

const QUICK_ACTIONS = [
  { label: 'Cotizacion rapida', href: '#quote' },
  { label: 'Solicitar factura', href: '#contact' },
  { label: 'Entrega industrial', href: '#shipping' },
  { label: 'Asesoria tecnica', href: '#contact' },
]

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
  const navigate = useNavigate()
  const [categories, setCategories] = useState<CategoryTreeNode[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [quoteForm, setQuoteForm] = useState({
    sku: '',
    quantity: '1',
    name: '',
    phone: '',
    notes: '',
  })
  const catalogItems = flattenCategoryCatalog(categories)
  const visibleCatalogItems = catalogItems.slice(0, 12)
  const offerProducts = useMemo(
    () => products.filter((product) => product.originalPrice && product.originalPrice > product.price).slice(0, 4),
    [products]
  )
  const newProducts = useMemo(
    () => [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4),
    [products]
  )
  const topProducts = useMemo(
    () => [...products].sort((a, b) => (b.rating * 10 + b.reviews) - (a.rating * 10 + a.reviews)).slice(0, 4),
    [products]
  )

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
      'Hola QUINGO, quiero una cotizacion.',
      `SKU/producto: ${quoteForm.sku || 'Por definir'}`,
      `Cantidad: ${quoteForm.quantity || '1'}`,
      `Nombre: ${quoteForm.name || 'No indicado'}`,
      `Telefono: ${quoteForm.phone || 'No indicado'}`,
      quoteForm.notes ? `Notas: ${quoteForm.notes}` : '',
    ].filter(Boolean).join('\n')

    window.location.href = `https://wa.me/5215576881138?text=${encodeURIComponent(message)}`
  }

  const renderProductRail = (title: string, subtitle: string, items: Product[]) => {
    if (items.length === 0) {
      return null
    }

    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h2>
              <p className="text-sm text-gray-600">{subtitle}</p>
            </div>
            <Link to="/products" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
              Ver todo
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {items.map((product) => (
              <Link
                key={`${title}-${product.id}`}
                to={`/products/${product.id}`}
                className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-square overflow-hidden rounded-md bg-gray-100">
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <p className="mt-3 line-clamp-2 min-h-[40px] text-sm font-semibold leading-tight text-gray-900">{product.name}</p>
                <p className="mt-1 text-xs text-gray-500">SKU: {product.sku}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-bold text-gray-900">${product.price.toLocaleString()}</span>
                  {product.originalPrice && (
                    <span className="text-xs text-gray-500 line-through">${product.originalPrice.toLocaleString()}</span>
                  )}
                </div>
              </Link>
            ))}
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

          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 text-xs sm:text-sm">
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => navigate(`/products?search=${encodeURIComponent(term)}`)}
                className="shrink-0 rounded-full border border-gray-300 bg-white px-3 py-1 font-medium text-gray-700 hover:border-blue-700 hover:text-blue-800"
              >
                {term}
              </button>
            ))}
          </div>

          <div className="mt-3 overflow-hidden rounded-lg bg-white shadow-sm sm:mt-5">
            <div className="relative min-h-[130px] bg-gray-900 sm:min-h-[220px]">
              <img
                src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80"
                alt="Suministros industriales"
                className="absolute inset-0 h-full w-full object-cover opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-950/85 via-gray-950/45 to-transparent" />
              <div className="relative flex min-h-[130px] max-w-xl flex-col justify-center px-4 py-4 text-white sm:min-h-[220px] sm:px-8 sm:py-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-200 sm:text-sm">QUINGO</p>
                <h1 className="mt-1 text-xl font-bold leading-tight sm:mt-2 sm:text-4xl">
                  Suministros industriales para trabajar sin pausas
                </h1>
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

      <section className="border-y border-gray-200 bg-white">
        <div className="container mx-auto grid grid-cols-2 gap-px bg-gray-200 px-0 text-sm sm:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="bg-white px-4 py-3 text-center font-semibold text-blue-900 hover:bg-blue-50"
            >
              {action.label}
            </a>
          ))}
        </div>
      </section>

      <section className="bg-white py-5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {TRUST_SIGNALS.map((signal) => {
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

      <section className="py-5 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="mb-3 flex items-end justify-between gap-4 sm:mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Categorias</h2>
              <p className="hidden text-sm text-gray-600 sm:block">Soldadura, proteccion, gases y mas.</p>
            </div>
            <Link to="/products" className="hidden text-sm font-semibold text-blue-700 hover:text-blue-900 sm:block">
              Ver todo
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-4">
            {visibleCatalogItems.map((item) => (
              <Link
                key={item.category.id}
                to={getCategoryProductLink(item)}
                className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-[4/3] overflow-hidden bg-gray-200">
                  <img
                    src={getCategoryImage(item.category)}
                    alt={item.category.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-2 sm:p-3">
                  <p className="text-center text-xs font-semibold leading-tight text-gray-900 sm:text-left sm:text-sm">{item.category.name}</p>
                  {item.category.children?.length > 0 && (
                    <p className="mt-1 hidden text-xs text-gray-500 sm:block">{item.category.children.length} secciones</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Productos certificados',
                description: 'Inventario para soldadura, seguridad y gases industriales.',
              },
              {
                title: 'Entrega rapida',
                description: 'Opciones de envio para mantener tu operacion en movimiento.',
              },
              {
                title: 'Soporte tecnico',
                description: 'Asesoria para elegir el producto correcto.',
              },
              {
                title: 'Precios competitivos',
                description: 'Suministros confiables sin comprometer la calidad.',
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-lg bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {renderProductRail('Ofertas y oportunidades', 'Productos con precio especial o promocion activa.', offerProducts)}
      {renderProductRail('Nuevos productos', 'Ultimas altas en el catalogo para surtir tu operacion.', newProducts)}
      {renderProductRail('Mas vendidos y destacados', 'Productos con mejor calificacion y mayor movimiento.', topProducts)}

      <section id="quote" className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_1.2fr] lg:p-8">
            <div>
              <p className="text-sm font-bold uppercase text-blue-800">Cotizacion rapida</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">Cotiza por SKU, producto o descripcion</h2>
              <p className="mt-3 text-sm text-gray-600">
                Envia los datos por WhatsApp y te respondemos con disponibilidad, precio y tiempos de entrega.
              </p>
              <div className="mt-5 rounded-lg bg-blue-50 p-4 text-sm text-blue-950">
                <p className="font-semibold">Tambien puedes llamar:</p>
                <a href="tel:+5215576881138" className="mt-1 block text-lg font-bold">
                  +52 1 55 7688 1138
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
                className="rounded-lg bg-blue-900 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800 sm:col-span-2"
              >
                Enviar cotizacion por WhatsApp
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
