import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { categoryAPI } from '@/api'
import { CategoryTreeNode } from '@/types'

interface CategoryFormState {
  name: string
  slug: string
  description: string
  parentId: string
  active: boolean
}

export default function AdminCategoryForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<CategoryTreeNode[]>([])
  const [form, setForm] = useState<CategoryFormState>({
    name: '',
    slug: '',
    description: '',
    parentId: '',
    active: true,
  })

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      navigate('/admin/login')
      return
    }

    loadCategories()
  }, [navigate])

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAllAdmin()
      const normalized = response.data.map((category: any) => ({
        id: category._id || category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        image: category.image || '',
        parentId: category.parent?.toString?.() || category.parentId || null,
        level: category.level || 0,
        path: category.path || '',
        children: [],
      }))

      setCategories(normalized)

      if (isEdit) {
        const current = response.data.find((category: any) => (category._id || category.id) === id)
        if (current) {
          setForm({
            name: current.name,
            slug: current.slug,
            description: current.description || '',
            parentId: current.parent?.toString?.() || current.parentId || '',
            active: current.active,
          })
        }
      }
    } catch (error) {
      console.error('Error loading categories', error)
      toast.error('No se pudieron cargar las categorías')
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Nombre y slug son obligatorios')
      return
    }

    try {
      setLoading(true)
      const payload = {
        ...form,
        slug: form.slug.trim().toLowerCase(),
        parent: form.parentId || null,
      }

      if (isEdit) {
        await categoryAPI.update(id!, payload)
        toast.success('Categoría actualizada correctamente')
      } else {
        await categoryAPI.create(payload)
        toast.success('Categoría creada correctamente')
      }

      navigate('/admin/categories')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar la categoría')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Editar categoría' : 'Nueva categoría'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
            <input
              type="text"
              name="slug"
              value={form.slug}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría padre</label>
            <select
              name="parentId"
              value={form.parentId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Raíz</option>
              {categories
                .filter((category) => category.id !== id)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="active"
              checked={form.active}
              onChange={handleChange}
            />
            Activa
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {loading ? 'Guardando...' : isEdit ? 'Actualizar categoría' : 'Crear categoría'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/categories')}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
