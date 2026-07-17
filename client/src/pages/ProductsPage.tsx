import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  FunnelIcon,
  Squares2X2Icon,
  TableCellsIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { Product, FilterOptions, CategoryTreeNode } from '@/types'
import ProductCard from '@/components/ProductCard'
import ProductListRow from '@/components/ProductListRow'
import ProductSearchBox from '@/components/ProductSearchBox'
import CategoryTreePanel from '@/components/CategoryTreePanel'
import { productAPI, categoryAPI } from '@/api'
import { flattenCategoryCatalog, getCategoryProductLink } from '@/utils/categoryCatalog'
import { getTopLevelCategories } from '@/utils/categories'

const SORT_OPTIONS = [
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
] as const

const POPULAR_SEARCHES = ['electrodos', 'guantes', 'reguladores', 'mangueras', 'caretas', 'soldadura']

type SortOption = (typeof SORT_OPTIONS)[number]['value']
type ViewMode = 'grid' | 'list'

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
  const [sortBy, setSortBy] = useState<SortOption>('price-asc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

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
      if (
        currentFilters.category === categoryFromQuery &&
        currentFilters.subcategory === subcategoryFromQuery
      ) {
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

  const catalogItems = useMemo(() => flattenCategoryCatalog(categories), [categories])
  const activeCategorySlug = filters.subcategory || filters.category
  const activeCategoryName = useMemo(() => {
    if (!activeCategorySlug) {
      return ''
    }

    return catalogItems.find((item) => item.category.slug === activeCategorySlug)?.category.name || ''
  }, [activeCategorySlug, catalogItems])

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

  const exactSkuMatch = searchQuery.trim()
    ? sortedProducts.find((product) => product.sku.toLowerCase() === searchQuery.trim().toLowerCase())
    : null

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

  const hasActiveFilters = searchQuery || filters.category || filters.subcategory
  const renderFilterControls = (closeAfterAction = false) => (
    <>
      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Explorador de categorias
          </label>
          <CategoryTreePanel
            categories={categories}
            className="w-full"
            onNavigate={closeAfterAction ? () => setShowFilters(false) : undefined}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Orden por precio</label>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
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
          onClick={() => {
            clearFilters()
            if (closeAfterAction) {
              setShowFilters(false)
            }
          }}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <XMarkIcon className="h-4 w-4" />
          Limpiar filtros
        </button>
      </div>
    </>
  )

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase text-blue-800">Catalogo industrial</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Catalogo de Productos</h1>
          <p className="mt-2 text-gray-600">Busca por producto, categoria o SKU.</p>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
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
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100"
            >
              <FunnelIcon className="h-5 w-5" />
              <span className="font-medium">Filtros</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 hidden rounded-xl border border-gray-200 bg-gray-50 p-4 md:block">
              {renderFilterControls()}
            </div>
          )}
        </div>

        {showFilters && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Filtros">
            <button
              type="button"
              className="absolute inset-0 h-full w-full bg-black/40"
              onClick={() => setShowFilters(false)}
              aria-label="Cerrar filtros"
            />
            <div className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Filtros</h2>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
                  aria-label="Cerrar filtros"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              {renderFilterControls(true)}
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <div className="mb-4 flex flex-wrap gap-2">
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleCatalogSearch('')}
                className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1 text-sm font-semibold text-white"
              >
                Busqueda: {searchQuery}
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
            {(filters.category || filters.subcategory) && (
              <button
                type="button"
                onClick={() => {
                  const nextParams = new URLSearchParams(searchParams)
                  nextParams.delete('category')
                  nextParams.delete('subcategory')
                  setSearchParams(nextParams)
                }}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800"
              >
                Categoria activa
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {exactSkuMatch && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-bold text-blue-900">Coincidencia exacta de SKU</p>
            <Link to={`/products/${exactSkuMatch.id}`} className="mt-1 block font-semibold text-gray-900 hover:text-blue-700">
              {exactSkuMatch.sku} - {exactSkuMatch.name}
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase text-gray-500">Comprar por categoria</h2>
                  <Link to="/products" className="text-xs font-semibold text-blue-700 hover:text-blue-900">
                    Todos
                  </Link>
                </div>
                <div className="space-y-1">
                  {catalogItems.slice(0, 24).map((item) => {
                    const isActive = item.category.slug === activeCategorySlug

                    return (
                      <Link
                        key={item.category.id}
                        to={getCategoryProductLink(item)}
                        className={`block rounded-md border-l-2 py-1.5 pr-2 text-sm font-medium transition ${
                          isActive
                            ? 'border-blue-800 bg-blue-50 text-blue-900'
                            : `border-transparent hover:bg-gray-100 hover:text-blue-700 ${
                                item.depth > 0 ? 'text-gray-600' : 'text-gray-900'
                              }`
                        } ${item.depth > 0 ? 'pl-5' : 'pl-2'}`}
                      >
                        {item.category.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </aside>

          <section>
            <div className="mb-4 flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-bold text-gray-900">
                    {loading ? 'Cargando productos...' : `${sortedProducts.length} productos encontrados`}
                  </p>
                  {activeCategoryName && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900">
                      {activeCategoryName}
                    </span>
                  )}
                </div>
                {searchQuery && (
                  <p className="mt-1 truncate text-sm text-gray-500">
                    Busqueda: {searchQuery}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-semibold ${
                      viewMode === 'grid' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                    Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-semibold ${
                      viewMode === 'list' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    <TableCellsIcon className="h-4 w-4" />
                    Lista
                  </button>
                </div>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortOption)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="h-80 animate-pulse rounded-lg bg-gray-200" />
                ))}
              </div>
            ) : sortedProducts.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {sortedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="hidden grid-cols-[72px_1fr_110px_110px_190px] gap-3 bg-gray-100 px-3 py-2 text-xs font-bold uppercase text-gray-500 md:grid">
                    <span></span>
                    <span>Producto</span>
                    <span>Stock</span>
                    <span>Precio</span>
                    <span>Acciones</span>
                  </div>
                  {sortedProducts.map((product) => (
                    <ProductListRow key={product.id} product={product} />
                  ))}
                </div>
              )
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
