import { Link, useLocation } from 'react-router-dom'
import { useStoreSettings } from '@/store/StoreSettingsContext'

const content: Record<string, { title: string; intro: string; points: string[] }> = {
  '/devoluciones': { title: 'Devoluciones', intro: 'Solicita una revisión con nuestro equipo antes de enviar cualquier producto.', points: ['Conserva comprobante, empaque y accesorios.', 'Indica número de pedido, SKU y motivo de la solicitud.', 'La aceptación depende del estado del producto y las condiciones informadas en la venta.'] },
  '/facturacion': { title: 'Facturación', intro: 'Podemos emitir comprobantes fiscales para compras de personas y empresas.', points: ['Ten preparados RFC, razón social, régimen y uso de CFDI.', 'Verifica que tus datos sean correctos antes de solicitar el comprobante.', 'Para correcciones o dudas, comunícate con atención comercial.'] },
  '/privacidad': { title: 'Privacidad', intro: 'Utilizamos tus datos para gestionar cuentas, compras, pagos, entregas y atención al cliente.', points: ['No solicitamos datos de tarjeta directamente; Stripe procesa la información de pago.', 'Puedes pedir acceso, corrección o eliminación de tus datos mediante atención comercial.', 'Aplicamos controles de acceso para proteger la información de clientes y pedidos.'] },
  '/terminos': { title: 'Términos de compra', intro: 'Las existencias, precios y condiciones se confirman al completar el pedido.', points: ['Los tiempos y costos de entrega dependen del destino y disponibilidad.', 'Los pedidos pagados quedan sujetos a validación del pago.', 'Las especificaciones deben confirmarse antes de comprar productos para aplicaciones críticas.'] },
}

export default function InformationPage() {
  const { settings } = useStoreSettings()
  const page = content[useLocation().pathname] || content['/terminos']
  return <div className="bg-gray-50 py-12"><div className="container mx-auto max-w-3xl px-4"><div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10"><h1 className="text-3xl font-bold text-gray-950">{page.title}</h1><p className="mt-4 text-gray-600">{page.intro}</p><ul className="mt-6 space-y-3">{page.points.map((point) => <li key={point} className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">{point}</li>)}</ul><p className="mt-6 text-sm text-gray-500">Si necesitas una condición específica por escrito, solicítala antes de completar tu compra.</p><Link to="/contacto" className="store-primary-bg mt-6 inline-block rounded-lg px-5 py-3 font-bold text-white">Contactar a {settings.name}</Link></div></div></div>
}
