import { useState } from 'react'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { catalogImportAPI } from '@/api'

type Row = Record<string, unknown>
interface ImportData { categories: Row[]; subcategories: Row[]; attributes: Row[]; products: Row[] }
interface Preview { valid: boolean; counts: Record<string, number>; errors: Array<{ section: string; row: number; message: string }> }

const emptyData: ImportData = { categories: [], subcategories: [], attributes: [], products: [] }
const normalizeKey = (value: string) => value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
const normalizeRow = (row: Row) => Object.fromEntries(Object.entries(row).map(([key,value]) => [normalizeKey(key), value]))
const pick = (row: Row, ...keys: string[]) => keys.map((key) => row[key]).find((value) => value !== undefined && value !== '') ?? ''

const mapCategory = (row: Row) => ({ name: pick(row,'nombre','name'), slug: pick(row,'slug'), description: pick(row,'descripcion','description'), image: pick(row,'imagen','image'), order: pick(row,'orden','order'), active: pick(row,'activo','active') })
const mapSubcategory = (row: Row) => ({ category: pick(row,'categoria','category'), name: pick(row,'nombre','name'), slug: pick(row,'slug'), description: pick(row,'descripcion','description'), image: pick(row,'imagen','image'), order: pick(row,'orden','order'), active: pick(row,'activo','active') })
const mapAttribute = (row: Row) => ({ category: pick(row,'categoria','category'), subcategory: pick(row,'subcategoria','subcategory'), name: pick(row,'nombre_atributo','atributo','nombre','name'), key: pick(row,'clave','key'), type: pick(row,'tipo_atributo','tipo','type') || 'text', options: pick(row,'opciones','options'), required: pick(row,'obligatorio','required'), filterable: pick(row,'usar_como_filtro','filtrable','filterable'), unit: pick(row,'unidad','unit'), placeholder: pick(row,'ayuda','placeholder'), order: pick(row,'orden','order') })
const mapProduct = (row: Row) => {
  let attributes: Record<string, unknown> | string = String(pick(row,'atributos','attributes') || '')
  const attributeColumns = Object.entries(row).filter(([key]) => key.startsWith('atributo_') && key !== 'atributo_tipo')
  if (!attributes && attributeColumns.length) attributes = Object.fromEntries(attributeColumns.map(([key,value]) => [key.replace(/^atributo_/,''), value]))
  return {
    sku: pick(row,'sku'), name: pick(row,'nombre','name'), description: pick(row,'descripcion','description'),
    price: pick(row,'precio','price'), originalPrice: pick(row,'precio_original','original_price','originalprice'), stock: pick(row,'existencias','stock'),
    category: pick(row,'categoria','category'), subcategory: pick(row,'subcategoria','subcategory'), image: pick(row,'imagen','image'), images: pick(row,'imagenes','images'), attributes,
    satProductCode: pick(row,'clave_sat','sat_product_code','satproductcode'), satUnitCode: pick(row,'unidad_sat','sat_unit_code','satunitcode'),
    taxObject: pick(row,'objeto_impuesto','tax_object','taxobject') || '02', ivaRate: pick(row,'tasa_iva','iva','ivarate') || 16,
  }
}

export default function AdminCatalogImportPage() {
  const [fileName, setFileName] = useState('')
  const [data, setData] = useState<ImportData>(emptyData)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [loading, setLoading] = useState(false)

  const parseFile = async (file?: File) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede superar 10 MB')
      return
    }
    try {
      setLoading(true); setPreview(null); setFileName(file.name)
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const result: ImportData = { categories: [], subcategories: [], attributes: [], products: [] }
      for (const sheetName of workbook.SheetNames) {
        const rows = XLSX.utils.sheet_to_json<Row>(workbook.Sheets[sheetName], { defval: '' }).map(normalizeRow)
        const name = normalizeKey(sheetName)
        if (name.includes('subcategor')) result.subcategories.push(...rows.map(mapSubcategory))
        else if (name.includes('categor')) result.categories.push(...rows.map(mapCategory))
        else if (name.includes('atribut') || name.includes('plantilla')) result.attributes.push(...rows.map(mapAttribute))
        else if (name.includes('product')) result.products.push(...rows.map(mapProduct))
        else {
          for (const row of rows) {
            const kind = normalizeKey(String(pick(row,'tipo_registro','registro','tipo')))
            if (kind === 'categoria') result.categories.push(mapCategory(row))
            else if (kind === 'subcategoria') result.subcategories.push(mapSubcategory(row))
            else if (kind === 'atributo') result.attributes.push(mapAttribute(row))
            else result.products.push(mapProduct(row))
          }
        }
      }
      setData(result)
      try {
        const { data: validation } = await catalogImportAPI.validate(result)
        setPreview(validation)
      } catch (error: any) {
        const response = error.response?.data
        setPreview({
          valid: false,
          counts: response?.counts || {},
          errors: response?.errors || [{ section: 'archivo', row: 0, message: response?.error || 'No se pudo validar el archivo' }],
        })
      }
    } catch {
      toast.error('No fue posible leer el archivo. Usa CSV, XLS o XLSX.')
      setData(emptyData)
    } finally { setLoading(false) }
  }

  const importCatalog = async () => {
    if (!preview?.valid) return
    try {
      setLoading(true)
      const { data: result } = await catalogImportAPI.commit(data)
      toast.success(`Importación completa: ${result.created} creados y ${result.updated} actualizados`)
      setPreview(null); setData(emptyData); setFileName('')
    } catch (error: any) { toast.error(error.response?.data?.error || 'No se pudo importar el catálogo') }
    finally { setLoading(false) }
  }

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx')
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
      { nombre: 'Herramientas eléctricas', slug: 'herramientas-electricas', descripcion: 'Equipo eléctrico para taller y obra', imagen: '', orden: 1, activo: 'sí' },
      { nombre: 'Tornillería', slug: 'tornilleria', descripcion: 'Fijación y sujeción', imagen: '', orden: 2, activo: 'sí' },
      { nombre: 'Pinturas', slug: 'pinturas', descripcion: 'Pinturas y recubrimientos', imagen: '', orden: 3, activo: 'sí' },
    ]), 'Categorias')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
      { categoria: 'herramientas-electricas', nombre: 'Taladros', slug: 'taladros', descripcion: '', imagen: '', orden: 1, activo: 'sí' },
      { categoria: 'tornilleria', nombre: 'Tornillos', slug: 'tornillos', descripcion: '', imagen: '', orden: 1, activo: 'sí' },
      { categoria: 'pinturas', nombre: 'Pintura vinílica', slug: 'pintura-vinilica', descripcion: '', imagen: '', orden: 1, activo: 'sí' },
    ]), 'Subcategorias')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
      { categoria: 'herramientas-electricas', subcategoria: 'taladros', nombre_atributo: 'Voltaje', clave: 'voltaje', tipo_atributo: 'select', opciones: '127 V|220 V', obligatorio: 'sí', usar_como_filtro: 'sí', unidad: 'V', ayuda: '', orden: 1 },
      { categoria: 'herramientas-electricas', subcategoria: 'taladros', nombre_atributo: 'Potencia', clave: 'potencia', tipo_atributo: 'number', opciones: '', obligatorio: 'sí', usar_como_filtro: 'sí', unidad: 'W', ayuda: '', orden: 2 },
      { categoria: 'herramientas-electricas', subcategoria: 'taladros', nombre_atributo: 'Velocidad', clave: 'velocidad', tipo_atributo: 'number', opciones: '', obligatorio: 'no', usar_como_filtro: 'sí', unidad: 'rpm', ayuda: '', orden: 3 },
      { categoria: 'herramientas-electricas', subcategoria: 'taladros', nombre_atributo: 'Tipo de mandril', clave: 'tipo_mandril', tipo_atributo: 'text', opciones: '', obligatorio: 'no', usar_como_filtro: 'sí', unidad: '', ayuda: '', orden: 4 },
      { categoria: 'herramientas-electricas', subcategoria: 'taladros', nombre_atributo: 'Garantía', clave: 'garantia', tipo_atributo: 'text', opciones: '', obligatorio: 'no', usar_como_filtro: 'no', unidad: '', ayuda: '', orden: 5 },
      { categoria: 'tornilleria', subcategoria: 'tornillos', nombre_atributo: 'Diámetro', clave: 'diametro', tipo_atributo: 'number', opciones: '', obligatorio: 'sí', usar_como_filtro: 'sí', unidad: 'mm', ayuda: '', orden: 1 },
      { categoria: 'tornilleria', subcategoria: 'tornillos', nombre_atributo: 'Longitud', clave: 'longitud', tipo_atributo: 'number', opciones: '', obligatorio: 'sí', usar_como_filtro: 'sí', unidad: 'mm', ayuda: '', orden: 2 },
      { categoria: 'tornilleria', subcategoria: 'tornillos', nombre_atributo: 'Tipo de cabeza', clave: 'tipo_cabeza', tipo_atributo: 'select', opciones: 'Hexagonal|Phillips|Plana|Allen', obligatorio: 'sí', usar_como_filtro: 'sí', unidad: '', ayuda: '', orden: 3 },
      { categoria: 'tornilleria', subcategoria: 'tornillos', nombre_atributo: 'Tipo de rosca', clave: 'tipo_rosca', tipo_atributo: 'text', opciones: '', obligatorio: 'no', usar_como_filtro: 'sí', unidad: '', ayuda: '', orden: 4 },
      { categoria: 'tornilleria', subcategoria: 'tornillos', nombre_atributo: 'Material', clave: 'material', tipo_atributo: 'select', opciones: 'Acero|Acero inoxidable|Latón', obligatorio: 'sí', usar_como_filtro: 'sí', unidad: '', ayuda: '', orden: 5 },
      { categoria: 'pinturas', subcategoria: 'pintura-vinilica', nombre_atributo: 'Color', clave: 'color', tipo_atributo: 'text', opciones: '', obligatorio: 'sí', usar_como_filtro: 'sí', unidad: '', ayuda: '', orden: 1 },
      { categoria: 'pinturas', subcategoria: 'pintura-vinilica', nombre_atributo: 'Contenido', clave: 'contenido', tipo_atributo: 'number', opciones: '', obligatorio: 'sí', usar_como_filtro: 'sí', unidad: 'L', ayuda: '', orden: 2 },
      { categoria: 'pinturas', subcategoria: 'pintura-vinilica', nombre_atributo: 'Acabado', clave: 'acabado', tipo_atributo: 'select', opciones: 'Mate|Satinado|Semibrillante', obligatorio: 'sí', usar_como_filtro: 'sí', unidad: '', ayuda: '', orden: 3 },
      { categoria: 'pinturas', subcategoria: 'pintura-vinilica', nombre_atributo: 'Rendimiento', clave: 'rendimiento', tipo_atributo: 'number', opciones: '', obligatorio: 'no', usar_como_filtro: 'sí', unidad: 'm²/L', ayuda: '', orden: 4 },
      { categoria: 'pinturas', subcategoria: 'pintura-vinilica', nombre_atributo: 'Uso', clave: 'uso', tipo_atributo: 'select', opciones: 'Interior|Exterior|Interior y exterior', obligatorio: 'sí', usar_como_filtro: 'sí', unidad: '', ayuda: '', orden: 5 },
    ]), 'Atributos')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
      { sku: 'TAL-001', nombre: 'Taladro profesional 650 W', descripcion: 'Taladro para taller y construcción', precio: 1299, precio_original: 1499, existencias: 20, categoria: 'herramientas-electricas', subcategoria: 'taladros', imagen: 'https://ejemplo.com/taladro.jpg', imagenes: 'https://ejemplo.com/taladro.jpg|https://ejemplo.com/taladro-2.jpg', atributos: '{"voltaje":"127 V","potencia":650,"velocidad":2800,"tipo_mandril":"1/2 pulgada","garantia":"1 año"}', clave_sat: '27112703', unidad_sat: 'H87', objeto_impuesto: '02', tasa_iva: 16 },
    ]), 'Productos')
    XLSX.writeFile(workbook, 'plantilla-catalogo-ferreteria.xlsx')
  }

  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Importar catálogo</h1><p className="mt-1 text-gray-600">Carga o actualiza categorías, plantillas, productos, existencias, imágenes y claves SAT.</p></div>
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-5"><h2 className="font-bold text-blue-950">Formato recomendado</h2><p className="mt-1 text-sm text-blue-900">Excel utiliza cuatro hojas: Categorias, Subcategorias, Atributos y Productos. Para CSV usa la columna tipo_registro o importa solamente productos.</p><button type="button" onClick={downloadTemplate} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-blue-800 shadow-sm"><ArrowDownTrayIcon className="h-5 w-5" /> Descargar plantilla de ferretería</button></div>
    <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-10 text-center hover:border-blue-500"><ArrowUpTrayIcon className="h-10 w-10 text-blue-700" /><span className="mt-3 font-bold">{fileName || 'Selecciona un archivo CSV, XLS o XLSX'}</span><span className="mt-1 text-sm text-gray-500">Primero se validará; nada se guarda automáticamente.</span><input type="file" accept=".csv,.xls,.xlsx" className="hidden" disabled={loading} onChange={(e) => parseFile(e.target.files?.[0])} /></label>
    {loading && <p className="text-center font-semibold text-blue-700">Procesando archivo...</p>}
    {preview && <div className="rounded-xl bg-white p-5 shadow-sm"><div className="flex items-center gap-3">{preview.valid ? <CheckCircleIcon className="h-7 w-7 text-green-600" /> : <ExclamationTriangleIcon className="h-7 w-7 text-red-600" />}<div><h2 className="font-bold">{preview.valid ? 'Archivo listo para importar' : 'Corrige los errores antes de importar'}</h2><p className="text-sm text-gray-500">Categorías: {preview.counts.categories || 0} · Subcategorías: {preview.counts.subcategories || 0} · Atributos: {preview.counts.attributes || 0} · Productos: {preview.counts.products || 0}</p></div></div>
      {preview.errors?.length > 0 && <div className="mt-4 max-h-72 overflow-auto rounded-lg bg-red-50 p-3"><ul className="space-y-1 text-sm text-red-800">{preview.errors.map((error,index) => <li key={`${error.section}-${error.row}-${index}`}><strong>{error.section}, fila {error.row}:</strong> {error.message}</li>)}</ul></div>}
      <button type="button" disabled={!preview.valid || loading} onClick={importCatalog} className="mt-5 rounded-lg bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800 disabled:bg-gray-400">Confirmar importación</button>
    </div>}
  </div>
}
