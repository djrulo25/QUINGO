import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { storeSettingsAPI } from '@/api'
import { StoreSettings } from '@/types'

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  name: 'QUINGO', logoUrl: '', description: 'Suministros industriales para tu operación diaria.', currency: 'MXN',
  colors: { primary: '#1e3a8a', secondary: '#172554', accent: '#f59e0b', header: '#111827' },
  contact: {
    phone: '+52 1 55 7688 1138', whatsapp: '5215576881138', salesEmail: 'info@quingo.com',
    supportEmail: 'info@quingo.com', billingEmail: 'info@quingo.com', businessHours: 'Lunes a viernes, 9:00 a 18:00.',
    address: 'Ciudad de México', serviceArea: 'CDMX, área metropolitana y envíos nacionales.',
  },
  social: { facebook: '', instagram: '', linkedin: '', tiktok: '', youtube: '' },
  home: {
    heroEyebrow: 'QUINGO', heroTitle: 'Suministros industriales para trabajar sin pausas',
    heroSubtitle: 'Productos, disponibilidad y soporte para tu operación.',
    heroImageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80',
    categoriesTitle: 'Categorías', categoriesSubtitle: 'Explora nuestro catálogo por especialidad.',
    quoteTitle: 'Cotiza por SKU, producto o descripción',
    quoteDescription: 'Envía los datos por WhatsApp y te respondemos con disponibilidad, precio y tiempos de entrega.',
    offersTitle: 'Ofertas y oportunidades', offersSubtitle: 'Productos con precio especial o promoción activa.',
    newTitle: 'Nuevos productos', newSubtitle: 'Últimas altas en el catálogo.',
    topTitle: 'Más vendidos y destacados', topSubtitle: 'Los productos con mayor movimiento.',
    popularSearches: ['electrodos', 'guantes', 'reguladores', 'mangueras', 'caretas', 'soldadura'],
    footerTagline: 'Suministros industriales para soldadura, protección, gases y operación diaria.',
  },
  fiscal: { legalName: '', rfc: '', taxRegime: '', postalCode: '', fiscalAddress: '', invoiceEmail: '' },
  shippingMethods: [
    { id: 'standard', name: 'Envío estándar', description: 'Entrega regular', price: 20, estimatedDays: '3 a 5 días hábiles', enabled: true },
    { id: 'express', name: 'Envío exprés', description: 'Entrega prioritaria', price: 50, estimatedDays: '1 a 2 días hábiles', enabled: true },
  ],
}

interface StoreSettingsContextValue {
  settings: StoreSettings
  loading: boolean
  refresh: () => Promise<void>
}

const StoreSettingsContext = createContext<StoreSettingsContextValue>({ settings: DEFAULT_STORE_SETTINGS, loading: true, refresh: async () => undefined })

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(DEFAULT_STORE_SETTINGS)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      const { data } = await storeSettingsAPI.getPublic()
      setSettings({ ...DEFAULT_STORE_SETTINGS, ...data, colors: { ...DEFAULT_STORE_SETTINGS.colors, ...data.colors }, contact: { ...DEFAULT_STORE_SETTINGS.contact, ...data.contact }, social: { ...DEFAULT_STORE_SETTINGS.social, ...data.social }, home: { ...DEFAULT_STORE_SETTINGS.home, ...data.home }, fiscal: { ...DEFAULT_STORE_SETTINGS.fiscal, ...data.fiscal }, shippingMethods: data.shippingMethods?.length ? data.shippingMethods : DEFAULT_STORE_SETTINGS.shippingMethods })
    } catch {
      setSettings(DEFAULT_STORE_SETTINGS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])
  useEffect(() => {
    document.documentElement.style.setProperty('--store-primary', settings.colors.primary)
    document.documentElement.style.setProperty('--store-secondary', settings.colors.secondary)
    document.documentElement.style.setProperty('--store-accent', settings.colors.accent)
    document.documentElement.style.setProperty('--store-header', settings.colors.header)
    document.title = `${settings.name} - Tienda en línea`
  }, [settings])

  return <StoreSettingsContext.Provider value={{ settings, loading, refresh }}>{children}</StoreSettingsContext.Provider>
}

export const useStoreSettings = () => useContext(StoreSettingsContext)
