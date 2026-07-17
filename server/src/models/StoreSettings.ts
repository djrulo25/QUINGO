import mongoose, { Schema, Document } from 'mongoose'

export interface IStoreSettings extends Document {
  storeKey: string
  name: string
  logoUrl: string
  description: string
  currency: string
  colors: { primary: string; secondary: string; accent: string; header: string }
  contact: {
    phone: string
    whatsapp: string
    salesEmail: string
    supportEmail: string
    billingEmail: string
    businessHours: string
    address: string
    serviceArea: string
  }
  social: { facebook: string; instagram: string; linkedin: string; tiktok: string; youtube: string }
  home: {
    heroEyebrow: string
    heroTitle: string
    heroSubtitle: string
    heroImageUrl: string
    categoriesTitle: string
    categoriesSubtitle: string
    quoteTitle: string
    quoteDescription: string
    offersTitle: string
    offersSubtitle: string
    newTitle: string
    newSubtitle: string
    topTitle: string
    topSubtitle: string
    popularSearches: string[]
    footerTagline: string
  }
  fiscal: {
    legalName: string
    rfc: string
    taxRegime: string
    postalCode: string
    fiscalAddress: string
    invoiceEmail: string
  }
  shippingMethods: Array<{
    id: string
    name: string
    description: string
    price: number
    estimatedDays: string
    enabled: boolean
  }>
}

const storeSettingsSchema = new Schema<IStoreSettings>({
  storeKey: { type: String, required: true, unique: true, default: 'default' },
  name: { type: String, required: true, trim: true, default: 'QUINGO' },
  logoUrl: { type: String, default: '', trim: true },
  description: { type: String, default: 'Suministros industriales para tu operación diaria.', trim: true },
  currency: { type: String, default: 'MXN', trim: true, uppercase: true },
  colors: {
    primary: { type: String, default: '#1e3a8a' },
    secondary: { type: String, default: '#172554' },
    accent: { type: String, default: '#f59e0b' },
    header: { type: String, default: '#111827' },
  },
  contact: {
    phone: { type: String, default: '+52 1 55 7688 1138' },
    whatsapp: { type: String, default: '5215576881138' },
    salesEmail: { type: String, default: 'info@quingo.com' },
    supportEmail: { type: String, default: 'info@quingo.com' },
    billingEmail: { type: String, default: 'info@quingo.com' },
    businessHours: { type: String, default: 'Lunes a viernes, 9:00 a 18:00.' },
    address: { type: String, default: 'Ciudad de México' },
    serviceArea: { type: String, default: 'CDMX, área metropolitana y envíos nacionales.' },
  },
  social: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    tiktok: { type: String, default: '' },
    youtube: { type: String, default: '' },
  },
  home: {
    heroEyebrow: { type: String, default: 'QUINGO' },
    heroTitle: { type: String, default: 'Suministros industriales para trabajar sin pausas' },
    heroSubtitle: { type: String, default: 'Productos, disponibilidad y soporte para tu operación.' },
    heroImageUrl: { type: String, default: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80' },
    categoriesTitle: { type: String, default: 'Categorías' },
    categoriesSubtitle: { type: String, default: 'Explora nuestro catálogo por especialidad.' },
    quoteTitle: { type: String, default: 'Cotiza por SKU, producto o descripción' },
    quoteDescription: { type: String, default: 'Envía los datos por WhatsApp y te respondemos con disponibilidad, precio y tiempos de entrega.' },
    offersTitle: { type: String, default: 'Ofertas y oportunidades' },
    offersSubtitle: { type: String, default: 'Productos con precio especial o promoción activa.' },
    newTitle: { type: String, default: 'Nuevos productos' },
    newSubtitle: { type: String, default: 'Últimas altas en el catálogo.' },
    topTitle: { type: String, default: 'Más vendidos y destacados' },
    topSubtitle: { type: String, default: 'Los productos con mayor movimiento.' },
    popularSearches: { type: [String], default: ['electrodos', 'guantes', 'reguladores', 'mangueras', 'caretas', 'soldadura'] },
    footerTagline: { type: String, default: 'Suministros industriales para soldadura, protección, gases y operación diaria.' },
  },
  fiscal: {
    legalName: { type: String, default: '' },
    rfc: { type: String, default: '', uppercase: true },
    taxRegime: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    fiscalAddress: { type: String, default: '' },
    invoiceEmail: { type: String, default: '' },
  },
  shippingMethods: [{
    id: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    estimatedDays: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    _id: false,
  }],
}, { timestamps: true })

export const DEFAULT_STORE_SETTINGS = {
  storeKey: 'default',
  name: 'QUINGO',
  logoUrl: '',
  description: 'Suministros industriales para tu operación diaria.',
  currency: 'MXN',
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

export default mongoose.model<IStoreSettings>('StoreSettings', storeSettingsSchema)
