import { Link } from 'react-router-dom'
import { ChatBubbleLeftRightIcon, ClockIcon, EnvelopeIcon, MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { useStoreSettings } from '@/store/StoreSettingsContext'

export default function ContactPage() {
  const { settings } = useStoreSettings()
  const whatsapp = encodeURIComponent(`Hola ${settings.name}, necesito información sobre sus productos y servicios.`)
  const whatsappUrl = `https://wa.me/${settings.contact.whatsapp.replace(/\D/g, '')}?text=${whatsapp}`
  const phoneUrl = `tel:${settings.contact.phone.replace(/[^\d+]/g, '')}`

  return <div className="bg-gray-50 py-12"><div className="container mx-auto max-w-5xl px-4">
    <p className="text-sm font-bold uppercase" style={{ color: settings.colors.primary }}>Estamos para ayudarte</p>
    <h1 className="mt-2 text-4xl font-bold text-gray-950">Contacto y asesoría</h1>
    <p className="mt-3 max-w-2xl text-gray-600">Habla con nuestro equipo para confirmar existencias, aplicaciones, facturación, entregas o precios por volumen.</p>
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex gap-4 rounded-2xl border border-green-200 bg-white p-6 shadow-sm hover:shadow-md"><ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600" /><div><h2 className="font-bold text-gray-900">WhatsApp</h2><p className="mt-1 text-sm text-gray-600">Cotizaciones y asesoría inmediata.</p><p className="mt-3 font-bold text-green-700">{settings.contact.phone}</p></div></a>
      <a href={phoneUrl} className="flex gap-4 rounded-2xl border border-blue-200 bg-white p-6 shadow-sm hover:shadow-md"><PhoneIcon className="h-8 w-8" style={{ color: settings.colors.primary }} /><div><h2 className="font-bold text-gray-900">Teléfono</h2><p className="mt-1 text-sm text-gray-600">Atención comercial y seguimiento.</p><p className="mt-3 font-bold" style={{ color: settings.colors.primary }}>{settings.contact.phone}</p></div></a>
      <div className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-6"><ClockIcon className="h-8 w-8 text-gray-700" /><div><h2 className="font-bold text-gray-900">Horario comercial</h2><p className="mt-1 text-sm text-gray-600">{settings.contact.businessHours}</p></div></div>
      <a href={`mailto:${settings.contact.salesEmail}`} className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-6"><EnvelopeIcon className="h-8 w-8 text-gray-700" /><div><h2 className="font-bold text-gray-900">Correo electrónico</h2><p className="mt-1 text-sm font-semibold" style={{ color: settings.colors.primary }}>{settings.contact.salesEmail}</p></div></a>
      {settings.contact.address && <div className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-6 md:col-span-2"><MapPinIcon className="h-8 w-8 text-gray-700" /><div><h2 className="font-bold text-gray-900">Ubicación y cobertura</h2><p className="mt-1 text-sm text-gray-600">{settings.contact.address}</p><p className="mt-1 text-sm text-gray-500">{settings.contact.serviceArea}</p></div></div>}
    </div>
    <div className="mt-8 rounded-2xl p-6 text-white" style={{ backgroundColor: settings.colors.secondary }}><h2 className="text-xl font-bold">¿Ya sabes qué producto necesitas?</h2><p className="mt-2 text-blue-100">Envía una cotización rápida con SKU, cantidad y datos de contacto.</p><Link to="/#quote" className="mt-4 inline-block rounded-lg bg-white px-5 py-3 font-bold" style={{ color: settings.colors.secondary }}>Ir a cotización rápida</Link></div>
  </div></div>
}
