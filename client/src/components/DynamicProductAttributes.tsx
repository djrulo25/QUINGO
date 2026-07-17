import { CategoryAttribute } from '@/types'

interface Props {
  definitions: CategoryAttribute[]
  values: Record<string, string | number | boolean>
  onChange: (values: Record<string, string | number | boolean>) => void
}

export default function DynamicProductAttributes({ definitions, values, onChange }: Props) {
  if (definitions.length === 0) return null

  const setValue = (key: string, value: string | number | boolean) => onChange({ ...values, [key]: value })

  return (
    <section className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
      <div><h2 className="font-semibold text-gray-900">Atributos del producto</h2><p className="text-sm text-gray-600">Campos definidos por la plantilla de la subcategoría.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {definitions.map((attribute) => {
          const common = { id: `attribute-${attribute.key}`, required: attribute.required }
          return <label key={attribute.key} className={attribute.type === 'textarea' ? 'text-sm text-gray-700 sm:col-span-2' : 'text-sm text-gray-700'}>
            {attribute.name}{attribute.required ? ' *' : ''}{attribute.unit ? ` (${attribute.unit})` : ''}
            {attribute.type === 'select' ? (
              <select {...common} value={String(values[attribute.key] ?? '')} onChange={(e) => setValue(attribute.key, e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"><option value="">Selecciona una opción</option>{attribute.options.map((option) => <option key={option}>{option}</option>)}</select>
            ) : attribute.type === 'checkbox' ? (
              <span className="mt-2 flex items-center gap-2"><input {...common} type="checkbox" checked={Boolean(values[attribute.key])} onChange={(e) => setValue(attribute.key, e.target.checked)} /> Sí</span>
            ) : attribute.type === 'textarea' ? (
              <textarea {...common} rows={3} value={String(values[attribute.key] ?? '')} placeholder={attribute.placeholder} onChange={(e) => setValue(attribute.key, e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
            ) : (
              <input {...common} type={attribute.type} value={String(values[attribute.key] ?? '')} placeholder={attribute.placeholder} onChange={(e) => setValue(attribute.key, attribute.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
            )}
          </label>
        })}
      </div>
    </section>
  )
}
