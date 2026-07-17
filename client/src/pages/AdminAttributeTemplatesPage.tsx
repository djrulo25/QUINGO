import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { categoryAPI } from '@/api'
import { CategoryAttribute } from '@/types'

interface TemplateCategory { id: string; name: string; path: string; level: number; attributes: CategoryAttribute[] }

export default function AdminAttributeTemplatesPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { navigate('/admin/login'); return }
    categoryAPI.getAllAdmin()
      .then(({ data }) => setCategories(data.map((category: any) => ({
        id: category._id || category.id, name: category.name, path: category.path,
        level: category.level, attributes: category.attributes || [],
      }))))
      .catch(() => toast.error('No se pudieron cargar las plantillas'))
      .finally(() => setLoading(false))
  }, [navigate])

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-gray-900">Plantillas de atributos</h1><p className="mt-1 text-gray-600">Define los campos dinámicos de cada categoría o subcategoría.</p></div>
    {loading ? <p className="text-gray-500">Cargando plantillas...</p> : <div className="grid gap-3 lg:grid-cols-2">
      {categories.map((category) => <article key={category.id} className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="min-w-0"><h2 className="font-semibold text-gray-900">{'— '.repeat(Math.max(0, category.level - 1))}{category.name}</h2><p className="truncate text-sm text-gray-500">{category.path}</p><p className="mt-1 text-sm font-medium text-blue-700">{category.attributes.length} atributo{category.attributes.length === 1 ? '' : 's'}</p></div>
        <Link to={`/admin/categories/${category.id}/edit`} className="shrink-0 rounded-lg border border-blue-600 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">Configurar</Link>
      </article>)}
    </div>}
  </div>
}
