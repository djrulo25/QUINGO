import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Product, FilterOptions, CategoryTreeNode } from '@/types'
import ProductCard from '@/components/ProductCard'
import ProductSearchBox from '@/components/ProductSearchBox'
import CategoryTreePanel from '@/components/CategoryTreePanel'
import { productAPI, categoryAPI } from '@/api'
import { flattenCategoryCatalog, getCategoryProductLink } from '@/utils/categoryCatalog'
import { getTopLevelCategories } from '@/utils/categories'

const SORT_OPTIONS = [
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
]

const POPULAR_SEARCHES = ['electrodos', 'guantes', 'reguladores', 'mangueras', 'caretas', 'soldadura']

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [categories, setCategories] = useState<CategoryTreeNode[]>([])
  const [filters, setFilters] = useState<FilterOptions>({
    category: searchParams.get('category') || undefined,
    subcategory: searchParams.get('subcategory') || undefined,
  })
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc'>('price-asc')

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryAPI.getAll()
        setCategories(getTopLevelCategories(response.data))
      } catch (error) {
        console.error('Error loading categories', error)
      }
    }

    loadCategories()
  }, [])

  useEffect(() => {
    const categoryFromQuery = searchParams.get('category') || undefined
    const subcategoryFromQuery = searchParams.get('subcategory') || undefined
    const searchFromQuery = searchParams.get('search') || ''

    setFilters((currentFilters) => {
      if (currentFilters.category === categoryFromQuery && currentFilters.subcategory === subcategoryFromQuery) {
        return currentFilters
      }

      return {
        ...currentFilters,
        category: categoryFromQuery,
        subcategory: subcategoryFromQuery,
      }
    })

    setSearchQuery((currentSearchQuery) => {
      if (currentSearchQuery === searchFromQuery) {
        return currentSearchQuery
      }

      return searchFromQuery
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
  const catalogItems = useMemo(() => flattenCategoryCatalog(categories), [categories])

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
    setSortBy('price-asc')
    setSearchParams(new URLSearchParams())
  }

  const handleCatalogSearch = (query: string) => {
    const nextParams = new URLSearchParams(searchParams)

    if (query) {
      nextParams.set('search', query)
    } else {
      nextParams.delete('search')
    }

    setSearchParams(nextParams)
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
            <ProductSearchBox
              categories={categories}
              initialValue={searchQuery}
              className="flex-1"
              inputClassName="py-3"
              onQueryChange={setSearchQuery}
              onSearch={handleCatalogSearch}
            />

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
              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Explorador de categorías
                  </label>
                  <CategoryTreePanel categories={categories} className="w-full" />
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase text-gray-500">Comprar por categoria</h2>
                <Link to="/products" className="text-xs font-semibold text-blue-700 hover:text-blue-900">
                  Todos
                </Link>
              </div>
              <div className="space-y-1">
                {catalogItems.slice(0, 24).map((item) => (
                  <Link
                    key={item.category.id}
                    to={getCategoryProductLink(item)}
                    className={`block rounded-md py-1.5 pr-2 text-sm font-medium hover:bg-gray-100 hover:text-blue-700 ${
                      item.depth > 0 ? 'pl-5 text-gray-600' : 'pl-2 text-gray-900'
                    }`}
                  >
                    {item.category.name}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          <section>
            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {loading ? 'Cargando productos...' : `${sortedProducts.length} productos encontrados`}
                </p>
                <p className="text-xs text-gray-500">SKU, precio y disponibilidad visibles para compra rapida.</p>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'price-asc' | 'price-desc')}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-80 rounded-lg bg-gray-200 animate-pulse" />
                ))}
              </div>
            ) : sortedProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-white py-12 text-center shadow-sm">
                <p className="text-lg text-gray-600">No hay productos que coincidan con tus criterios</p>
                <div className="mx-auto mt-5 flex max-w-2xl flex-wrap justify-center gap-2">
                  {POPULAR_SEARCHES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleCatalogSearch(term)}
                      className="rounded-full border border-gray-300 px-3 py-1 text-sm font-semibold text-gray-700 hover:border-blue-700 hover:text-blue-800"
                    >
                      Buscar {term}
                    </button>
                  ))}
                </div>
                {catalogItems.length > 0 && (
                  <div className="mx-auto mt-6 max-w-3xl">
                    <p className="text-sm font-semibold text-gray-900">Tambien puedes explorar categorias</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {catalogItems.slice(0, 6).map((item) => (
                        <Link
                          key={item.category.id}
                          to={getCategoryProductLink(item)}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-800"
                        >
                          {item.category.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
