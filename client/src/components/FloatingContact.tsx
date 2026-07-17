import { ChatBubbleLeftRightIcon, PhoneIcon } from '@heroicons/react/24/outline'

export default function FloatingContact() {
  const whatsappMessage = encodeURIComponent('Hola QUINGO, necesito apoyo con una compra o cotizacion.')

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <a
        href={`https://wa.me/5215576881138?text=${whatsappMessage}`}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition hover:bg-green-700"
        aria-label="Contactar por WhatsApp"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
      </a>
      <a
        href="tel:+5215576881138"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-900 text-white shadow-lg transition hover:bg-blue-800 sm:hidden"
        aria-label="Llamar a QUINGO"
      >
        <PhoneIcon className="h-6 w-6" />
      </a>
    </div>
  )
}
