import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FunnelIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Product, FilterOptions } from '@/types'
import ProductCard from '@/components/ProductCard'
import { productAPI } from '@/api'

const CATEGORY_OPTIONS = [
  { value: 'welding', label: 'Accesorios de Soldar' },
  { value: 'safety', label: 'Protección Industrial' },
  { value: 'gases', label: 'Componentes para Gases' },
]

const SORT_OPTIONS = [
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
]

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    category: searchParams.get('category') || undefined,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc'>('price-asc')

  useEffect(() => {
    const categoryFromQuery = searchParams.get('category') || undefined

    setFilters((currentFilters) => {
      if (currentFilters.category === categoryFromQuery) {
        return currentFilters
      }

      return {
        ...currentFilters,
        category: categoryFromQuery,
      }
    })
  }, [searchParams])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const { data } = await productAPI.getAll({
          ...filters,
          search: searchQuery.trim() || undefined,
        })
        setProducts(data)
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = window.setTimeout(fetchProducts, 400)
    return () => window.clearTimeout(debounceTimer)
  }, [filters, searchQuery])

  const sortedProducts = useMemo(() => {
    const nextProducts = [...products]

    if (sortBy === 'price-asc') {
      nextProducts.sort((a, b) => a.price - b.price)
    }

    if (sortBy === 'price-desc') {
      nextProducts.sort((a, b) => b.price - a.price)
    }

    return nextProducts
  }, [products, sortBy])

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCategory = e.target.value || undefined

    setFilters((currentFilters) => ({
      ...currentFilters,
      category: nextCategory,
    }))

    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams)

      if (nextCategory) {
        nextParams.set('category', nextCategory)
      } else {
        nextParams.delete('category')
      }

      return nextParams
    })
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
    setSortBy('price-asc')
    setSearchParams(new URLSearchParams())
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Catálogo de Productos</h1>
          <p className="text-gray-600 mt-2">Busca fácilmente y usa filtros solo cuando los necesites.</p>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <FunnelIcon className="h-5 w-5" />
              <span className="font-medium">Filtros</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 rounded-xl bg-gray-50 p-4 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                  <select
                    value={filters.category || ''}
                    onChange={handleCategoryChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">Todas las categorías</option>
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Orden por precio</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'price-asc' | 'price-desc')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-80 animate-pulse" />
            ))}
          </div>
        ) : sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No hay productos que coincidan con tus criterios</p>
          </div>
        )}
      </div>
    </div>
  )
}
