import { ChatBubbleLeftRightIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { useStoreSettings } from '@/store/StoreSettingsContext'

export default function FloatingContact() {
  const { settings } = useStoreSettings()
  const whatsappMessage = encodeURIComponent(`Hola ${settings.name}, necesito apoyo con una compra o cotización.`)
  const phoneHref = `tel:${settings.contact.phone.replace(/[^\d+]/g, '')}`

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <a
        href={`https://wa.me/${settings.contact.whatsapp.replace(/\D/g, '')}?text=${whatsappMessage}`}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition hover:bg-green-700"
        aria-label="Contactar por WhatsApp"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
      </a>
      <a
        href={phoneHref}
        className="store-primary-bg flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition sm:hidden"
        aria-label={`Llamar a ${settings.name}`}
      >
        <PhoneIcon className="h-6 w-6" />
      </a>
    </div>
  )
}
