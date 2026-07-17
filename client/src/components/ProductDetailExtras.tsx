import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckBadgeIcon,
  CreditCardIcon,
  DocumentArrowDownIcon,
  ReceiptPercentIcon,
  ShieldCheckIcon,
  TruckIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { CategoryAttribute, Product } from '@/types'
import { useCartStore } from '@/store/cartStore'

interface Props {
  product: Product
  attributeDefinitions: CategoryAttribute[]
  relatedProducts: Product[]
  recentlyViewed: Product[]
}

const labelFromKey = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

export default function ProductDetailExtras({ product, attributeDefinitions, relatedProducts, recentlyViewed }: Props) {
  const { addToCart } = useCartStore()
  const bundleProducts = relatedProducts.slice(0, 3)
  const [selectedBundleIds, setSelectedBundleIds] = useState<string[]>([])
  const [postalCode, setPostalCode] = useState('')
  const [showDeliveryMessage, setShowDeliveryMessage] = useState(false)

  useEffect(() => setSelectedBundleIds(bundleProducts.map((item) => item.id)), [relatedProducts])

  const technicalRows = useMemo(() => {
    const definitions = new Map(attributeDefinitions.map((attribute) => [attribute.key, attribute]))
    return Object.entries(product.attributes || {}).map(([key, value]) => ({
      key,
      label: definitions.get(key)?.name || labelFromKey(key),
      value: `${typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value}${definitions.get(key)?.unit ? ` ${definitions.get(key)?.unit}` : ''}`,
    }))
  }, [attributeDefinitions, product.attributes])

  const selectedBundle = bundleProducts.filter((item) => selectedBundleIds.includes(item.id))
  const bundleTotal = selectedBundle.reduce((total, item) => total + item.price, 0)
  const addBundle = () => {
    selectedBundle.forEach((item) => addToCart(item, 1))
    toast.success(`${selectedBundle.length} producto${selectedBundle.length === 1 ? '' : 's'} agregado${selectedBundle.length === 1 ? '' : 's'} al carrito`)
  }

  const defaultFaqs = [
    { question: '¿Se puede facturar este producto?', answer: 'Sí. Puedes proporcionar tus datos fiscales durante el proceso de compra.' },
    { question: '¿Hacen envíos fuera de CDMX?', answer: 'Sí, contamos con envíos nacionales. El costo y tiempo dependen del destino y del producto.' },
    { question: '¿Puedo solicitar una cotización por volumen?', answer: 'Sí. Utiliza el botón de cotización por WhatsApp e indica la cantidad requerida.' },
  ]
  const faqs = product.faqs?.length ? product.faqs : defaultFaqs

  return <div className="mt-12 space-y-12 border-t border-gray-200 pt-10">
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { icon: ShieldCheckIcon, title: 'Compra segura', text: 'Pago protegido y atención personalizada.' },
        { icon: ReceiptPercentIcon, title: 'Facturación', text: 'Comprobantes fiscales para personas y empresas.' },
        { icon: TruckIcon, title: 'Entrega nacional', text: 'Cobertura en México según producto y destino.' },
        { icon: CheckBadgeIcon, title: 'Soporte técnico', text: 'Asesoría para confirmar compatibilidad y aplicación.' },
      ].map((item) => { const Icon = item.icon; return <div key={item.title} className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><Icon className="h-7 w-7 shrink-0 text-blue-800" /><div><h3 className="font-bold text-gray-900">{item.title}</h3><p className="mt-1 text-sm text-gray-600">{item.text}</p></div></div> })}
    </section>

    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">Características técnicas</h2>
        <p className="mt-1 text-sm text-gray-600">Información configurada específicamente para este producto.</p>
        {technicalRows.length > 0 || (product.specifications && Object.keys(product.specifications).length > 0) ? <dl className="mt-5 divide-y divide-gray-100">
          {technicalRows.map((row) => <div key={row.key} className="grid grid-cols-2 gap-4 py-3"><dt className="text-sm text-gray-600">{row.label}</dt><dd className="text-sm font-semibold text-gray-900">{row.value}</dd></div>)}
          {Object.entries(product.specifications || {}).map(([key, value]) => <div key={key} className="grid grid-cols-2 gap-4 py-3"><dt className="text-sm text-gray-600">{key}</dt><dd className="text-sm font-semibold text-gray-900">{value}</dd></div>)}
        </dl> : <p className="mt-5 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">La ficha técnica detallada está disponible mediante cotización.</p>}
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl border border-gray-200 bg-blue-950 p-5 text-white shadow-sm">
          <TruckIcon className="h-8 w-8 text-blue-200" />
          <h2 className="mt-3 text-xl font-bold">Consulta entrega en tu zona</h2>
          <p className="mt-1 text-sm text-blue-100">Ingresa tu código postal para preparar una consulta de cobertura.</p>
          <div className="mt-4 flex gap-2"><input inputMode="numeric" maxLength={5} value={postalCode} onChange={(event) => { setPostalCode(event.target.value.replace(/\D/g, '')); setShowDeliveryMessage(false) }} placeholder="Código postal" className="min-w-0 flex-1 rounded-lg border-0 px-3 py-2 text-gray-900" /><button type="button" disabled={postalCode.length !== 5} onClick={() => setShowDeliveryMessage(true)} className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-blue-950 disabled:opacity-50">Consultar</button></div>
          {showDeliveryMessage && <p className="mt-3 rounded-lg bg-white/10 p-3 text-sm">Tenemos cobertura nacional. Confirma costo y tiempo para el C.P. {postalCode} mediante la cotización del producto.</p>}
        </div>

        {product.documents && product.documents.length > 0 && <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-gray-900">Documentos y descargas</h2><div className="mt-4 space-y-2">{product.documents.map((document) => <a key={`${document.name}-${document.url}`} href={document.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 font-semibold text-blue-800 hover:bg-blue-50"><span className="flex items-center gap-2"><DocumentArrowDownIcon className="h-5 w-5" />{document.name}</span><span className="text-xs">Abrir</span></a>)}</div></div>}
      </div>
    </section>

    {bundleProducts.length > 0 && <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase text-blue-800">Completa tu equipo</p><h2 className="mt-1 text-2xl font-bold text-gray-900">Agrega productos compatibles</h2></div><div className="text-left sm:text-right"><p className="text-sm text-gray-600">Total seleccionado</p><p className="text-2xl font-bold text-gray-900">${bundleTotal.toLocaleString()}</p></div></div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">{bundleProducts.map((item) => { const checked = selectedBundleIds.includes(item.id); return <label key={item.id} className={`flex cursor-pointer gap-3 rounded-xl border-2 bg-white p-3 ${checked ? 'border-blue-700' : 'border-transparent'}`}><input type="checkbox" checked={checked} onChange={() => setSelectedBundleIds((current) => checked ? current.filter((id) => id !== item.id) : [...current, item.id])} className="mt-1" /><img src={item.image} alt="" className="h-16 w-16 rounded-lg object-contain" /><span className="min-w-0"><span className="line-clamp-2 text-sm font-bold text-gray-900">{item.name}</span><span className="mt-1 block font-semibold text-blue-800">${item.price.toLocaleString()}</span></span></label> })}</div>
      <button type="button" disabled={selectedBundle.length === 0} onClick={addBundle} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-50"><CreditCardIcon className="h-5 w-5" /> Agregar selección al carrito</button>
    </section>}

    <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div><p className="text-sm font-bold uppercase text-blue-800">Resolvemos tus dudas</p><h2 className="mt-1 text-2xl font-bold text-gray-900">Preguntas frecuentes</h2><p className="mt-2 text-gray-600">Si necesitas confirmar una aplicación específica, solicita asesoría antes de comprar.</p></div>
      <div className="space-y-2">{faqs.map((faq, index) => <details key={`${faq.question}-${index}`} className="group rounded-xl border border-gray-200 bg-white p-4"><summary className="cursor-pointer list-none pr-6 font-semibold text-gray-900">{faq.question}</summary><p className="mt-3 text-sm leading-relaxed text-gray-600">{faq.answer}</p></details>)}</div>
    </section>

    {recentlyViewed.length > 0 && <section><div className="mb-4"><p className="text-sm font-bold uppercase text-blue-800">Continúa explorando</p><h2 className="mt-1 text-2xl font-bold text-gray-900">Vistos recientemente</h2></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{recentlyViewed.map((item) => <Link key={item.id} to={`/products/${item.id}`} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm hover:border-blue-300 hover:shadow-md"><img src={item.image} alt={item.name} className="aspect-square w-full rounded-lg bg-gray-50 object-contain" /><h3 className="mt-3 line-clamp-2 text-sm font-bold text-gray-900">{item.name}</h3><p className="mt-1 font-bold text-blue-900">${item.price.toLocaleString()}</p></Link>)}</div></section>}
  </div>
}
