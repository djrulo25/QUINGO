import { useEffect, useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, PhotoIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
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
  const [uploadingBrand, setUploadingBrand] = useState<string | null>(null)
  const { refresh } = useStoreSettings()

  useEffect(() => {
    storeSettingsAPI.getAdmin().then(({ data }) => setSettings({
      ...DEFAULT_STORE_SETTINGS,
      ...data,
      homeBrands: data.homeBrands?.length ? data.homeBrands : DEFAULT_STORE_SETTINGS.homeBrands,
      shippingMethods: data.shippingMethods?.length ? data.shippingMethods : DEFAULT_STORE_SETTINGS.shippingMethods,
    })).catch(() => toast.error('No se pudo cargar la configuración')).finally(() => setLoading(false))
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

  const updateHomeBrand = (index: number, changes: Partial<StoreSettings['homeBrands'][number]>) => {
    setSettings((current) => ({
      ...current,
      homeBrands: current.homeBrands.map((brand, brandIndex) => brandIndex === index ? { ...brand, ...changes } : brand),
    }))
  }

  const moveHomeBrand = (index: number, direction: -1 | 1) => {
    setSettings((current) => {
      const destination = index + direction
      if (destination < 0 || destination >= current.homeBrands.length) return current
      const homeBrands = [...current.homeBrands]
      ;[homeBrands[index], homeBrands[destination]] = [homeBrands[destination], homeBrands[index]]
      return { ...current, homeBrands }
    })
  }

  const handleBrandImage = async (index: number, file?: File) => {
    if (!file) return
    const brand = settings.homeBrands[index]
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen válido')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen supera el límite de 10 MB')
      return
    }
    const formData = new FormData()
    formData.append('image', file)
    try {
      setUploadingBrand(brand.name)
      const { data } = await storeSettingsAPI.uploadLogo(formData)
      updateHomeBrand(index, { imageUrl: data.url })
      toast.success(`Imagen de ${brand.name} cargada; guarda los cambios para aplicarla`)
    } catch (error: any) {
      const message = error.response?.data?.error
        || (error.code === 'ERR_NETWORK' ? 'No se pudo conectar con el servidor de imágenes. Intenta nuevamente.' : '')
        || `No se pudo subir la imagen de ${brand.name}`
      toast.error(message)
    } finally {
      setUploadingBrand(null)
    }
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
    </div></section>

    <section className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Marcas del inicio</h2>
          <p className="mt-1 text-sm text-gray-500">Crea y organiza las marcas que aparecerán debajo del buscador. El nombre debe coincidir con el campo «marca» de los productos para que el filtro encuentre resultados.</p>
        </div>
        <button
          type="button"
          onClick={() => setSettings((current) => ({
            ...current,
            homeBrands: [...current.homeBrands, { name: `NUEVA MARCA ${current.homeBrands.length + 1}`, imageUrl: '', enabled: true, darkBackground: false }],
          }))}
          className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-blue-700 px-3 py-2 text-sm font-bold text-blue-800 hover:bg-blue-50"
        >
          <PlusIcon className="h-4 w-4" />
          Agregar marca
        </button>
      </div>
      <div className="space-y-3">
        {settings.homeBrands.map((brand, index) => (
          <div key={`${brand.name}-${index}`} className="grid gap-4 rounded-xl border border-gray-200 p-4 lg:grid-cols-[150px_1fr_auto] lg:items-center">
            <div className={`flex h-20 items-center justify-center overflow-hidden rounded-lg border border-gray-200 p-3 ${brand.darkBackground ? 'bg-gray-950' : 'bg-gray-50'}`}>
              {brand.imageUrl ? (
                <img src={brand.imageUrl} alt={`Vista previa de ${brand.name}`} className="max-h-12 max-w-full object-contain" />
              ) : (
                <span className={`text-sm font-black tracking-[0.12em] ${brand.darkBackground ? 'text-white' : 'text-gray-800'}`}>{brand.name}</span>
              )}
            </div>

            <div className="min-w-0">
              <label className={labelClass}>Nombre de la marca y valor del filtro</label>
              <input
                className={`${fieldClass} mb-3 font-semibold uppercase`}
                value={brand.name}
                placeholder="Ej. XTOOLS"
                onChange={(event) => updateHomeBrand(index, { name: event.target.value.toUpperCase() })}
              />
              <label className={labelClass}>Imagen o URL del logotipo</label>
              <input
                className={fieldClass}
                value={brand.imageUrl}
                placeholder="https://... o /images/brands/..."
                onChange={(event) => updateHomeBrand(index, { imageUrl: event.target.value })}
              />
              <div className="mt-2 flex flex-wrap gap-3">
                <label className="cursor-pointer rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800">
                  {uploadingBrand === brand.name ? 'Subiendo...' : brand.imageUrl ? 'Reemplazar imagen' : 'Subir imagen'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingBrand !== null}
                    onChange={(event) => {
                      void handleBrandImage(index, event.target.files?.[0])
                      event.target.value = ''
                    }}
                  />
                </label>
                {brand.imageUrl && (
                  <button type="button" onClick={() => updateHomeBrand(index, { imageUrl: '' })} className="text-xs font-semibold text-red-600">
                    Quitar imagen
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 lg:flex-col lg:items-stretch">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input type="checkbox" checked={brand.enabled} onChange={(event) => updateHomeBrand(index, { enabled: event.target.checked })} />
                Mostrar
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input type="checkbox" checked={brand.darkBackground} onChange={(event) => updateHomeBrand(index, { darkBackground: event.target.checked })} />
                Fondo oscuro
              </label>
              <div className="flex items-center gap-1">
                <button type="button" disabled={index === 0} onClick={() => moveHomeBrand(index, -1)} className="rounded-md border p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30" aria-label={`Subir ${brand.name}`}>
                  <ChevronUpIcon className="h-4 w-4" />
                </button>
                <button type="button" disabled={index === settings.homeBrands.length - 1} onClick={() => moveHomeBrand(index, 1)} className="rounded-md border p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30" aria-label={`Bajar ${brand.name}`}>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setSettings((current) => ({ ...current, homeBrands: current.homeBrands.filter((_, brandIndex) => brandIndex !== index) }))} className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50" aria-label={`Eliminar ${brand.name}`}>
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="rounded-xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold">Datos fiscales</h2><p className="mb-4 text-sm text-gray-500">Estos datos preparan la integración futura de CFDI; no incluyen certificados ni contraseñas.</p><div className="grid gap-4 md:grid-cols-2">
      {([['legalName','Razón social'],['rfc','RFC'],['taxRegime','Régimen fiscal'],['postalCode','Código postal'],['fiscalAddress','Domicilio fiscal'],['invoiceEmail','Correo de facturación']] as const).map(([key,label]) => <div key={key}><label className={labelClass}>{label}</label><input className={fieldClass} value={settings.fiscal[key]} onChange={(e) => updateSection('fiscal', key, e.target.value)} /></div>)}
    </div></section>

    <section className="rounded-xl bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold">Métodos y costos de envío</h2><p className="text-sm text-gray-500">El servidor utilizará estos importes al calcular cada pedido.</p></div><button type="button" onClick={() => setSettings((current) => ({ ...current, shippingMethods: [...current.shippingMethods, { id: `metodo-${current.shippingMethods.length + 1}`, name: 'Nuevo método', description: '', price: 0, estimatedDays: '', enabled: true }] }))} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-bold"><PlusIcon className="h-4 w-4" /> Agregar</button></div>
      <div className="space-y-3">{settings.shippingMethods.map((method,index) => <div key={`${method.id}-${index}`} className="grid gap-3 rounded-lg border p-3 md:grid-cols-6"><input className={fieldClass} placeholder="id" value={method.id} onChange={(e) => setSettings((current) => ({ ...current, shippingMethods: current.shippingMethods.map((item,i) => i === index ? { ...item, id: e.target.value } : item) }))} /><input className={`${fieldClass} md:col-span-2`} placeholder="Nombre" value={method.name} onChange={(e) => setSettings((current) => ({ ...current, shippingMethods: current.shippingMethods.map((item,i) => i === index ? { ...item, name: e.target.value } : item) }))} /><input type="number" min="0" step="0.01" className={fieldClass} placeholder="Costo" value={method.price} onChange={(e) => setSettings((current) => ({ ...current, shippingMethods: current.shippingMethods.map((item,i) => i === index ? { ...item, price: Number(e.target.value) } : item) }))} /><input className={fieldClass} placeholder="Tiempo estimado" value={method.estimatedDays} onChange={(e) => setSettings((current) => ({ ...current, shippingMethods: current.shippingMethods.map((item,i) => i === index ? { ...item, estimatedDays: e.target.value } : item) }))} /><div className="flex items-center justify-between gap-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={method.enabled} onChange={(e) => setSettings((current) => ({ ...current, shippingMethods: current.shippingMethods.map((item,i) => i === index ? { ...item, enabled: e.target.checked } : item) }))} />Activo</label><button type="button" aria-label="Eliminar método" onClick={() => setSettings((current) => ({ ...current, shippingMethods: current.shippingMethods.filter((_,i) => i !== index) }))} className="text-red-600"><TrashIcon className="h-5 w-5" /></button></div><input className={`${fieldClass} md:col-span-6`} placeholder="Descripción" value={method.description} onChange={(e) => setSettings((current) => ({ ...current, shippingMethods: current.shippingMethods.map((item,i) => i === index ? { ...item, description: e.target.value } : item) }))} /></div>)}</div>
    </section>

    <section className="rounded-xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold">Redes sociales</h2><div className="grid gap-4 md:grid-cols-2">{Object.entries(settings.social).map(([key,value]) => <div key={key}><label className={labelClass}>{key[0].toUpperCase()+key.slice(1)}</label><input className={fieldClass} placeholder="https://" value={value} onChange={(e) => updateSection('social', key, e.target.value)} /></div>)}</div></section>

    <div className="sticky bottom-4 flex justify-end"><button disabled={saving || uploading || uploadingBrand !== null} className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white shadow-lg hover:bg-blue-800 disabled:bg-gray-400">{saving ? 'Guardando...' : 'Guardar configuración'}</button></div>
  </form>
}
