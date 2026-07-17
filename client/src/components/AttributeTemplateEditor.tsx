import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { AttributeType, CategoryAttribute } from '@/types'

interface Props {
  value: CategoryAttribute[]
  onChange: (attributes: CategoryAttribute[]) => void
}

const types: { value: AttributeType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'select', label: 'Lista desplegable' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Fecha' },
  { value: 'textarea', label: 'Área de texto' },
]

const makeKey = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

export default function AttributeTemplateEditor({ value, onChange }: Props) {
  const update = (index: number, patch: Partial<CategoryAttribute>) => {
    onChange(value.map((attribute, current) => current === index ? { ...attribute, ...patch } : attribute))
  }

  const add = () => onChange([...value, {
    key: `atributo_${value.length + 1}`,
    name: '',
    type: 'text',
    options: [],
    required: false,
    filterable: true,
    unit: '',
    placeholder: '',
    order: value.length,
  }])

  return (
    <section className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-gray-900">Plantilla de atributos</h2>
          <p className="text-sm text-gray-600">Estos campos aparecerán automáticamente al seleccionar esta categoría.</p>
        </div>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">
          <PlusIcon className="h-4 w-4" /> Agregar
        </button>
      </div>

      {value.length === 0 && <p className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">Aún no hay atributos configurados.</p>}
      {value.map((attribute, index) => (
        <div key={index} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-gray-700">Nombre
              <input value={attribute.name} required onChange={(e) => update(index, { name: e.target.value, key: makeKey(e.target.value) })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Ej. Diámetro" />
            </label>
            <label className="text-sm text-gray-700">Tipo
              <select value={attribute.type} onChange={(e) => update(index, { type: e.target.value as AttributeType })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2">
                {types.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </label>
          </div>
          {attribute.type === 'select' && (
            <label className="block text-sm text-gray-700">Opciones (separadas por coma)
              <input value={attribute.options.join(', ')} onChange={(e) => update(index, { options: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="3/32, 1/8, 5/32" />
            </label>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-gray-700">Unidad (opcional)
              <input value={attribute.unit || ''} onChange={(e) => update(index, { unit: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="kg, V, mm..." />
            </label>
            <label className="text-sm text-gray-700">Texto de ayuda (opcional)
              <input value={attribute.placeholder || ''} onChange={(e) => update(index, { placeholder: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={attribute.required} onChange={(e) => update(index, { required: e.target.checked })} /> Obligatorio</label>
              <label className="flex items-center gap-2 text-sm font-medium text-blue-800"><input type="checkbox" checked={attribute.filterable !== false} onChange={(e) => update(index, { filterable: e.target.checked })} /> Usar como filtro</label>
            </div>
            <button type="button" onClick={() => onChange(value.filter((_, current) => current !== index).map((item, order) => ({ ...item, order })))} className="inline-flex items-center gap-1 text-sm font-medium text-red-600"><TrashIcon className="h-4 w-4" /> Eliminar</button>
          </div>
        </div>
      ))}
    </section>
  )
}
