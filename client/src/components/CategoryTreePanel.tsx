import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CategoryTreeNode } from '@/types'

interface CategoryTreePanelProps {
  categories: CategoryTreeNode[]
  className?: string
}

export default function CategoryTreePanel({ categories, className = '' }: CategoryTreePanelProps) {
  const navigate = useNavigate()
  const [path, setPath] = useState<string[]>([])

  useEffect(() => {
    setPath([])
  }, [categories])

  const breadcrumb = useMemo(() => {
    const trail: CategoryTreeNode[] = []
    let currentNodes = categories

    for (const id of path) {
      const nextNode = currentNodes.find((node) => node.id === id)

      if (!nextNode) {
        break
      }

      trail.push(nextNode)
      currentNodes = nextNode.children || []
    }

    return trail
  }, [categories, path])

  const currentCategory = breadcrumb[breadcrumb.length - 1] || null
  const currentLevel = currentCategory ? currentCategory.children : categories
  const currentLevelLabel = currentCategory ? currentCategory.name : 'Categorías'
  const rootCategory = path.length > 0 ? categories.find((category) => category.id === path[0]) || null : null

  const goToLevel = (levelIndex: number) => {
    setPath((currentPath) => currentPath.slice(0, levelIndex + 1))
  }

  const handleSelectCategory = (category: CategoryTreeNode) => {
    if (category.children?.length) {
      setPath((currentPath) => [...currentPath, category.id])
      return
    }

    const selectedCategory = rootCategory?.slug || category.slug
    navigate(`/products?category=${selectedCategory}&subcategory=${category.slug}`)
  }

  const handleBack = () => {
    setPath((currentPath) => currentPath.slice(0, -1))
  }

  const viewAllLink = rootCategory
    ? `/products?category=${rootCategory.slug}`
    : '/products'

  return (
    <div className={`grid grid-cols-[220px_1fr] gap-3 ${className}`}>
      <div className="border-r border-gray-200 pr-2">
        {path.length > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="mb-3 block w-full text-left rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            ← Regresar
          </button>
        )}

        {currentLevel.length > 0 ? (
          currentLevel.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleSelectCategory(category)}
              className="mb-2 block w-full text-left rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 transition"
            >
              {category.name}
            </button>
          ))
        ) : (
          <p className="text-sm text-gray-500">No hay subcategorías disponibles.</p>
        )}
      </div>

      <div className="min-w-[260px]">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Nivel actual
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <button
            type="button"
            onClick={() => setPath([])}
            className="font-semibold text-blue-700 hover:text-blue-900"
          >
            Productos
          </button>

          {breadcrumb.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2">
              <span>/</span>
              <button
                type="button"
                onClick={() => goToLevel(index)}
                className="font-semibold text-blue-700 hover:text-blue-900"
              >
                {item.name}
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-sm font-semibold text-gray-900">{currentLevelLabel}</p>
          <p className="text-xs text-gray-500 mt-1">
            {currentCategory
              ? `Explorando ${currentCategory.name}`
              : 'Selecciona una categoría principal para continuar'}
          </p>
        </div>

        <div className="mt-3">
          {rootCategory ? (
            <Link
              to={viewAllLink}
              className="block text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              Ver todo {rootCategory.name}
            </Link>
          ) : (
            <Link
              to="/products"
              className="block text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              Ver todo Productos
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
