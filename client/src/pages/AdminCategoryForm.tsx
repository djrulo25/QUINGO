import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'
import { PhotoIcon, TrashIcon } from '@heroicons/react/24/outline'
import { categoryAPI } from '@/api'
import { API_BASE_URL } from '@/api/config'
import { CategoryAttribute, CategoryTreeNode } from '@/types'
import AttributeTemplateEditor from '@/components/AttributeTemplateEditor'

interface CategoryFormState {
  name: string
  slug: string
  description: string
  image: string
  parentId: string
  active: boolean
  attributes: CategoryAttribute[]
}

export default function AdminCategoryForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [categories, setCategories] = useState<CategoryTreeNode[]>([])
  const [form, setForm] = useState<CategoryFormState>({
    name: '',
    slug: '',
    description: '',
    image: '',
    parentId: '',
    active: true,
    attributes: [],
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
        attributes: category.attributes || [],
      }))

      setCategories(normalized)

      if (isEdit) {
        const current = response.data.find((category: any) => (category._id || category.id) === id)
        if (current) {
          setForm({
            name: current.name,
            slug: current.slug,
            description: current.description || '',
            image: current.image || '',
            parentId: current.parent?.toString?.() || current.parentId || '',
            active: current.active,
            attributes: current.attributes || [],
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen válido')
      return
    }

    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append('image', file)
      const token = localStorage.getItem('adminToken')
      const { data } = await axios.post(`${API_BASE_URL}/uploads`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setForm((current) => ({ ...current, image: data.secure_url }))
      toast.success('Imagen subida a Cloudinary')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'No se pudo subir la imagen')
    } finally {
      setUploadingImage(false)
      event.target.value = ''
    }
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Imagen de la categoría</label>
            <p className="mb-3 text-sm text-gray-500">Esta imagen aparecerá en la sección de categorías del inicio.</p>
            {!form.image ? (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/40 p-6 text-center hover:border-blue-500">
                <PhotoIcon className="h-8 w-8 text-blue-600" />
                <span className="mt-2 text-sm font-semibold text-blue-800">{uploadingImage ? 'Subiendo a Cloudinary...' : 'Seleccionar imagen'}</span>
                <span className="mt-1 text-xs text-gray-500">JPG, PNG, WebP u otro formato de imagen · máximo 10 MB</span>
                <input ref={imageInputRef} type="file" accept="image/*" disabled={uploadingImage} onChange={handleImageUpload} className="hidden" />
              </label>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <img src={form.image} alt="Vista previa de la categoría" className="aspect-[16/9] w-full object-cover" />
                <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <span className="text-sm font-semibold text-green-700">✓ Imagen personalizada activa</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage} className="rounded-lg border border-blue-600 px-3 py-2 text-sm font-semibold text-blue-700">{uploadingImage ? 'Subiendo...' : 'Reemplazar'}</button>
                    <button type="button" onClick={() => setForm((current) => ({ ...current, image: '' }))} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600"><TrashIcon className="h-4 w-4" /> Eliminar</button>
                  </div>
                </div>
                <input ref={imageInputRef} type="file" accept="image/*" disabled={uploadingImage} onChange={handleImageUpload} className="hidden" />
              </div>
            )}
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

          <AttributeTemplateEditor value={form.attributes} onChange={(attributes) => setForm((current) => ({ ...current, attributes }))} />

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || uploadingImage}
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
