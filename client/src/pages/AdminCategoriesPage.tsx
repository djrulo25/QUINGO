import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { categoryAPI } from '@/api'
import { CategoryTreeNode } from '@/types'

export default function AdminCategoriesPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<CategoryTreeNode[]>([])
  const [loading, setLoading] = useState(true)

  const buildCategoryTree = (items: any[]): CategoryTreeNode[] => {
    const normalized: CategoryTreeNode[] = items.map((item) => ({
      id: item._id || item.id,
      name: item.name,
      slug: item.slug,
      description: item.description || '',
      image: item.image || '',
      parentId: item.parent?.toString?.() || item.parentId || null,
      level: item.level || 0,
      path: item.path || '',
      children: [],
    }))

    const map = new Map<string, CategoryTreeNode>(normalized.map((item) => [item.id, item]))
    const rootNodes: CategoryTreeNode[] = []

    for (const item of normalized) {
      if (!item.parentId) {
        rootNodes.push(item)
      } else {
        const parent = map.get(item.parentId)
        if (parent) {
          parent.children.push(item)
        }
      }
    }

    return rootNodes
  }

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await categoryAPI.getAllAdmin()
      setCategories(buildCategoryTree(response.data))
    } catch (error) {
      console.error('Error loading categories', error)
      toast.error('No se pudieron cargar las categorías')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta categoría?')) {
      return
    }

    try {
      await categoryAPI.delete(id)
      toast.success('Categoría eliminada')
      await loadCategories()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'No se pudo eliminar la categoría')
    }
  }

  const renderCategoryTree = (nodes: CategoryTreeNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.id} className="mb-3" style={{ paddingLeft: Math.min(depth * 12, 36) }}>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="break-words font-semibold text-gray-900">{node.name}</p>
              <p className="break-all text-xs text-gray-500">{node.slug}</p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                Nivel {node.level}
              </span>
              <button
                type="button"
                onClick={() => navigate(`/admin/categories/${node.id}/edit`)}
                className="shrink-0 rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(node.id)}
                className="shrink-0 rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>

        {node.children?.length > 0 && renderCategoryTree(node.children, depth + 1)}
      </div>
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-sm text-gray-600">Árbol del menú jerárquico de productos</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/categories/new')}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
        >
          Nueva categoría
        </button>
      </div>

      {loading ? (
        <div className="rounded-lg bg-white p-6 text-sm text-gray-500">Cargando categorías...</div>
      ) : (
        <div className="space-y-2">{renderCategoryTree(categories)}</div>
      )}
    </div>
  )
}
