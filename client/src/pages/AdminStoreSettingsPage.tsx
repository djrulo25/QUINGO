import { useEffect, useState } from 'react'
import { PhotoIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { storeSettingsAPI } from '@/api'
import { StoreSettings } from '@/types'
import { DEFAULT_STORE_SETTINGS, useStoreSettings } from '@/store/StoreSettingsContext'

const fieldClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
const labelClass = 'mb-1 block text-sm font-semibold text-gray-700'

export default function AdminStoreSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { refresh } = useStoreSettings()

  useEffect(() => {
    storeSettingsAPI.getAdmin().then(({ data }) => setSettings({ ...DEFAULT_STORE_SETTINGS, ...data })).catch(() => toast.error('No se pudo cargar la configuración')).finally(() => setLoading(false))
  }, [])

  const updateSection = <K extends keyof StoreSettings>(section: K, key: string, value: unknown) => {
    setSettings((current) => ({ ...current, [section]: { ...(current[section] as object), [key]: value } }))
  }

  const handleLogo = async (file?: File) => {
    if (!file) return
    const formData = new FormData()
    formData.append('image', file)
    try {
      setUploading(true)
      const { data } = await storeSettingsAPI.uploadLogo(formData)
      setSettings((current) => ({ ...current, logoUrl: data.url }))
      toast.success('Logotipo cargado; guarda los cambios para aplicarlo')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'No se pudo subir el logotipo')
    } finally { setUploading(false) }
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      setSaving(true)
      const { data } = await storeSettingsAPI.update(settings)
      setSettings(data)
      await refresh()
      toast.success('Configuración de tienda actualizada')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'No se pudo guardar la configuración')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="py-20 text-center text-gray-500">Cargando configuración...</div>

  return <form onSubmit={save} className="space-y-6">
    <div><h1 className="text-3xl font-bold text-gray-900">Configuración de tienda</h1><p className="mt-1 text-gray-600">Personaliza esta instalación sin modificar el código.</p></div>

    <section className="rounded-xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold">Marca y colores</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div><label className={labelClass}>Nombre de la tienda *</label><input className={fieldClass} value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} required /></div>
        <div><label className={labelClass}>Moneda</label><input className={fieldClass} value={settings.currency} maxLength={3} onChange={(e) => setSettings({ ...settings, currency: e.target.value.toUpperCase() })} /></div>
        <div className="md:col-span-2"><label className={labelClass}>Descripción general</label><textarea className={fieldClass} rows={2} value={settings.description} onChange={(e) => setSettings({ ...settings, description: e.target.value })} /></div>
        <div className="md:col-span-2"><label className={labelClass}>Logotipo</label><div className="flex flex-wrap items-center gap-4 rounded-lg border border-dashed border-gray-300 p-4">{settings.logoUrl ? <img src={settings.logoUrl} alt="Vista previa" className="h-20 w-32 object-contain" /> : <PhotoIcon className="h-12 w-12 text-gray-400" />}<label className="cursor-pointer rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800">{uploading ? 'Subiendo...' : 'Subir a Cloudinary'}<input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleLogo(e.target.files?.[0])} /></label>{settings.logoUrl && <button type="button" onClick={() => setSettings({ ...settings, logoUrl: '' })} className="text-sm font-semibold text-red-600">Quitar logotipo</button>}</div></div>
        {Object.entries(settings.colors).map(([key, value]) => <div key={key}><label className={labelClass}>{({ primary: 'Color principal', secondary: 'Color secundario', accent: 'Color de acento', header: 'Color del encabezado' } as Record<string,string>)[key]}</label><div className="flex gap-2"><input type="color" value={value} onChange={(e) => updateSection('colors', key, e.target.value)} className="h-10 w-14 rounded border" /><input className={fieldClass} value={value} onChange={(e) => updateSection('colors', key, e.target.value)} /></div></div>)}
      </div>
    </section>

    <section className="rounded-xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold">Contacto y operación</h2><div className="grid gap-4 md:grid-cols-2">
      {([['phone','Teléfono'],['whatsapp','WhatsApp (solo números)'],['salesEmail','Correo de ventas'],['supportEmail','Correo de soporte'],['billingEmail','Correo de facturación'],['businessHours','Horario'],['address','Dirección'],['serviceArea','Zona de servicio']] as const).map(([key,label]) => <div key={key}><label className={labelClass}>{label}</label><input className={fieldClass} value={settings.contact[key]} onChange={(e) => updateSection('contact', key, e.target.value)} /></div>)}
    </div></section>

    <section className="rounded-xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold">Textos del inicio</h2><div className="grid gap-4 md:grid-cols-2">
      {([['heroEyebrow','Texto superior del banner'],['heroTitle','Título del banner'],['heroSubtitle','Descripción del banner'],['heroImageUrl','Imagen del banner (URL)'],['categoriesTitle','Título de categorías'],['categoriesSubtitle','Descripción de categorías'],['offersTitle','Título de ofertas'],['offersSubtitle','Descripción de ofertas'],['newTitle','Título de nuevos productos'],['newSubtitle','Descripción de nuevos productos'],['topTitle','Título de más vendidos'],['topSubtitle','Descripción de más vendidos'],['quoteTitle','Título de cotización'],['quoteDescription','Descripción de cotización'],['footerTagline','Descripción del footer']] as const).map(([key,label]) => <div className={['heroTitle','heroSubtitle','offersSubtitle','newSubtitle','topSubtitle','quoteDescription','footerTagline'].includes(key) ? 'md:col-span-2' : ''} key={key}><label className={labelClass}>{label}</label>{['heroTitle','heroSubtitle','offersSubtitle','newSubtitle','topSubtitle','quoteDescription','footerTagline'].includes(key) ? <textarea rows={2} className={fieldClass} value={settings.home[key]} onChange={(e) => updateSection('home', key, e.target.value)} /> : <input className={fieldClass} value={settings.home[key]} onChange={(e) => updateSection('home', key, e.target.value)} />}</div>)}
      <div className="md:col-span-2"><label className={labelClass}>Búsquedas populares (separadas por coma)</label><input className={fieldClass} value={settings.home.popularSearches.join(', ')} onChange={(e) => updateSection('home', 'popularSearches', e.target.value.split(',').map((item) => item.trim()).filter(Boolean))} /></div>
    </div></section>

    <section className="rounded-xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold">Datos fiscales</h2><p className="mb-4 text-sm text-gray-500">Estos datos preparan la integración futura de CFDI; no incluyen certificados ni contraseñas.</p><div className="grid gap-4 md:grid-cols-2">
      {([['legalName','Razón social'],['rfc','RFC'],['taxRegime','Régimen fiscal'],['postalCode','Código postal'],['fiscalAddress','Domicilio fiscal'],['invoiceEmail','Correo de facturación']] as const).map(([key,label]) => <div key={key}><label className={labelClass}>{label}</label><input className={fieldClass} value={settings.fiscal[key]} onChange={(e) => updateSection('fiscal', key, e.target.value)} /></div>)}
    </div></section>

    <section className="rounded-xl bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold">Métodos y costos de envío</h2><p className="text-sm text-gray-500">El servidor utilizará estos importes al calcular cada pedido.</p></div><button type="button" onClick={() => setSettings((current) => ({ ...current, shippingMethods: [...current.shippingMethods, { id: `metodo-${current.shippingMethods.length + 1}`, name: 'Nuevo método', description: '', price: 0, estimatedDays: '', enabled: true }] }))} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-bold"><PlusIcon className="h-4 w-4" /> Agregar</button></div>
      <div className="space-y-3">{settings.shippingMethods.map((method,index) => <div key={`${method.id}-${index}`} className="grid gap-3 rounded-lg border p-3 md:grid-cols-6"><input className={fieldClass} placeholder="id" value={method.id} onChange={(e) => setSettings((current) => ({ ...current, shippingMethods: current.shippingMethods.map((item,i) => i === index ? { ...item, id: e.target.value } : item) }))} /><input className={`${fieldClass} md:col-span-2`} placeholder="Nombre" value={method.name} onChange={(e) => setSettings((current) => ({ ...current, shippingMethods: current.shippingMethods.map((item,i) => i === index ? { ...item, name: e.target.value } : item) }))} /><input type="number" min="0" step="0.01" className={fieldClass} placeholder="Costo" value={method.price} onChange={(e) => setSettings((current) => ({ ...current, shippingMethods: current.shippingMethods.map((item,i) => i === index ? { ...item, price: Number(e.target.value) } : item) }))} /><input className={fieldClass} placeholder="Tiempo estimado" value={method.estimatedDays} onChange={(e) => setSettings((current) => ({ ...current, shippingMethods: current.shippingMethods.map((item,i) => i === index ? { ...item, estimatedDays: e.target.value } : item) }))} /><div className="flex items-center justify-between gap-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={method.enabled} onChange={(e) => setSettings((current) => ({ ...current, shippingMethods: current.shippingMethods.map((item,i) => i === index ? { ...item, enabled: e.target.checked } : item) }))} />Activo</label><button type="button" aria-label="Eliminar método" onClick={() => setSettings((current) => ({ ...current, shippingMethods: current.shippingMethods.filter((_,i) => i !== index) }))} className="text-red-600"><TrashIcon className="h-5 w-5" /></button></div><input className={`${fieldClass} md:col-span-6`} placeholder="Descripción" value={method.description} onChange={(e) => setSettings((current) => ({ ...current, shippingMethods: current.shippingMethods.map((item,i) => i === index ? { ...item, description: e.target.value } : item) }))} /></div>)}</div>
    </section>

    <section className="rounded-xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold">Redes sociales</h2><div className="grid gap-4 md:grid-cols-2">{Object.entries(settings.social).map(([key,value]) => <div key={key}><label className={labelClass}>{key[0].toUpperCase()+key.slice(1)}</label><input className={fieldClass} placeholder="https://" value={value} onChange={(e) => updateSection('social', key, e.target.value)} /></div>)}</div></section>

    <div className="sticky bottom-4 flex justify-end"><button disabled={saving || uploading} className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white shadow-lg hover:bg-blue-800 disabled:bg-gray-400">{saving ? 'Guardando...' : 'Guardar configuración'}</button></div>
  </form>
}
