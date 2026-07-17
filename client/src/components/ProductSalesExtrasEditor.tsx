import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowUpTrayIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Product } from '@/types'
import { API_BASE_URL } from '@/api/config'

type VolumeTier = NonNullable<Product['volumePricing']>[number]
type ProductDocument = NonNullable<Product['documents']>[number]
type ProductFaq = NonNullable<Product['faqs']>[number]

interface Props {
  volumePricing: VolumeTier[]
  documents: ProductDocument[]
  faqs: ProductFaq[]
  onVolumePricingChange: (value: VolumeTier[]) => void
  onDocumentsChange: (value: ProductDocument[]) => void
  onFaqsChange: (value: ProductFaq[]) => void
}

const sectionClass = 'space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4'
const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm'

export default function ProductSalesExtrasEditor(props: Props) {
  const { volumePricing, documents, faqs, onVolumePricingChange, onDocumentsChange, onFaqsChange } = props
  const [uploadingDocument, setUploadingDocument] = useState(false)

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setUploadingDocument(true)
      const formData = new FormData()
      formData.append('document', file)
      const token = localStorage.getItem('adminToken')
      const { data } = await axios.post(`${API_BASE_URL}/uploads/document`, formData, { headers: { Authorization: `Bearer ${token}` } })
      onDocumentsChange([...documents, { name: file.name.replace(/\.[^.]+$/, ''), url: data.url }])
      toast.success('Documento subido a Cloudinary')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'No se pudo subir el documento')
    } finally {
      setUploadingDocument(false)
      event.target.value = ''
    }
  }

  return <div className="space-y-5">
    <section className={sectionClass}>
      <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-gray-900">Precios por volumen</h2><p className="text-sm text-gray-600">Configura descuentos reales según la cantidad.</p></div><button type="button" onClick={() => onVolumePricingChange([...volumePricing, { minQuantity: 2, discountPercent: 0 }])} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"><PlusIcon className="h-4 w-4" /> Agregar</button></div>
      {volumePricing.map((tier, index) => <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3 rounded-lg bg-white p-3">
        <label className="text-sm text-gray-700">Desde cuántas piezas<input type="number" min="2" value={tier.minQuantity} onChange={(event) => onVolumePricingChange(volumePricing.map((item, current) => current === index ? { ...item, minQuantity: Number(event.target.value) } : item))} className={`mt-1 ${inputClass}`} /></label>
        <label className="text-sm text-gray-700">Descuento %<input type="number" min="0" max="100" value={tier.discountPercent} onChange={(event) => onVolumePricingChange(volumePricing.map((item, current) => current === index ? { ...item, discountPercent: Number(event.target.value) } : item))} className={`mt-1 ${inputClass}`} /></label>
        <button type="button" onClick={() => onVolumePricingChange(volumePricing.filter((_, current) => current !== index))} className="mb-2 text-red-600" aria-label="Eliminar nivel"><TrashIcon className="h-5 w-5" /></button>
      </div>)}
    </section>

    <section className={sectionClass}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-gray-900">Documentos descargables</h2><p className="text-sm text-gray-600">Fichas técnicas, manuales, certificados o garantías.</p></div><div className="flex gap-2"><label className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"><ArrowUpTrayIcon className="h-4 w-4" /> {uploadingDocument ? 'Subiendo...' : 'Subir archivo'}<input type="file" accept=".pdf,.doc,.docx" disabled={uploadingDocument} onChange={handleDocumentUpload} className="hidden" /></label><button type="button" onClick={() => onDocumentsChange([...documents, { name: '', url: '' }])} className="inline-flex items-center gap-1 rounded-lg border border-blue-600 bg-white px-3 py-2 text-sm font-semibold text-blue-700"><PlusIcon className="h-4 w-4" /> Usar URL</button></div></div>
      {documents.map((document, index) => <div key={index} className="grid gap-3 rounded-lg bg-white p-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
        <label className="text-sm text-gray-700">Nombre<input value={document.name} required onChange={(event) => onDocumentsChange(documents.map((item, current) => current === index ? { ...item, name: event.target.value } : item))} className={`mt-1 ${inputClass}`} placeholder="Ficha técnica" /></label>
        <label className="text-sm text-gray-700">URL del documento<input type="url" value={document.url} required onChange={(event) => onDocumentsChange(documents.map((item, current) => current === index ? { ...item, url: event.target.value } : item))} className={`mt-1 ${inputClass}`} placeholder="https://..." /></label>
        <button type="button" onClick={() => onDocumentsChange(documents.filter((_, current) => current !== index))} className="mb-2 text-red-600" aria-label="Eliminar documento"><TrashIcon className="h-5 w-5" /></button>
      </div>)}
    </section>

    <section className={sectionClass}>
      <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-gray-900">Preguntas frecuentes</h2><p className="text-sm text-gray-600">Resuelve dudas específicas antes de la compra.</p></div><button type="button" onClick={() => onFaqsChange([...faqs, { question: '', answer: '' }])} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"><PlusIcon className="h-4 w-4" /> Agregar</button></div>
      {faqs.map((faq, index) => <div key={index} className="space-y-3 rounded-lg bg-white p-3">
        <div className="flex gap-3"><label className="flex-1 text-sm text-gray-700">Pregunta<input value={faq.question} required onChange={(event) => onFaqsChange(faqs.map((item, current) => current === index ? { ...item, question: event.target.value } : item))} className={`mt-1 ${inputClass}`} /></label><button type="button" onClick={() => onFaqsChange(faqs.filter((_, current) => current !== index))} className="mt-6 text-red-600" aria-label="Eliminar pregunta"><TrashIcon className="h-5 w-5" /></button></div>
        <label className="block text-sm text-gray-700">Respuesta<textarea value={faq.answer} required rows={2} onChange={(event) => onFaqsChange(faqs.map((item, current) => current === index ? { ...item, answer: event.target.value } : item))} className={`mt-1 ${inputClass}`} /></label>
      </div>)}
    </section>
  </div>
}
