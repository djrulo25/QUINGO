import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ChatBubbleLeftRightIcon,
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
type LocalFilter = 'all' | 'offers'

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [categories, setCategories] = useState<CategoryTreeNode[]>([])
  const [filters, setFilters] = useState<FilterOptions>({
    category: searchParams.get('category') || undefined,
    subcategory: searchParams.get('subcategory') || undefined,
    inStock: searchParams.get('inStock') === 'true' || undefined,
  })
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState<SortOption>('price-asc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [localFilter, setLocalFilter] = useState<LocalFilter>('all')
  const [quoteSku, setQuoteSku] = useState('')
  const [quoteQuantity, setQuoteQuantity] = useState('1')

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
    const inStockFromQuery = searchParams.get('inStock') === 'true' || undefined

    setFilters((currentFilters) => {
      if (
        currentFilters.category === categoryFromQuery &&
        currentFilters.subcategory === subcategoryFromQuery &&
        currentFilters.inStock === inStockFromQuery
      ) {
        return currentFilters
      }

      return {
        ...currentFilters,
        category: categoryFromQuery,
        subcategory: subcategoryFromQuery,
        inStock: inStockFromQuery,
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
  const displayedProducts = useMemo(() => {
    if (localFilter === 'offers') {
      return products.filter((product) => product.originalPrice && product.originalPrice > product.price)
    }

    return products
  }, [localFilter, products])

  const sortedProducts = useMemo(() => {
    const nextProducts = [...displayedProducts]

    if (sortBy === 'price-asc') {
      nextProducts.sort((a, b) => a.price - b.price)
    }

    if (sortBy === 'price-desc') {
      nextProducts.sort((a, b) => b.price - a.price)
    }

    return nextProducts
  }, [displayedProducts, sortBy])

  const offerCount = products.filter((product) => product.originalPrice && product.originalPrice > product.price).length
  const inStockCount = products.filter((product) => product.stock > 0).length
  const exactSkuMatch = searchQuery.trim()
    ? sortedProducts.find((product) => product.sku.toLowerCase() === searchQuery.trim().toLowerCase())
    : null

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
    setSortBy('price-asc')
    setLocalFilter('all')
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

  const updateQueryParam = (key: string, value?: string) => {
    const nextParams = new URLSearchParams(searchParams)

    if (value) {
      nextParams.set(key, value)
    } else {
      nextParams.delete(key)
    }

    setSearchParams(nextParams)
  }

  const handleQuickQuoteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = encodeURIComponent(
      `Hola QUINGO, quiero cotizar:\nSKU/producto: ${quoteSku || 'Por definir'}\nCantidad: ${quoteQuantity || '1'}`
    )
    window.location.href = `https://wa.me/5215576881138?text=${message}`
  }

  const quoteForm = (
    <form onSubmit={handleQuickQuoteSubmit} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-900" />
        <h2 className="text-sm font-bold uppercase text-gray-500">Cotizacion rapida</h2>
      </div>
      <label className="mt-4 block text-xs font-semibold text-gray-600">SKU o producto</label>
      <input
        value={quoteSku}
        onChange={(event) => setQuoteSku(event.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        placeholder="Ej. electrodo 6013"
      />
      <label className="mt-3 block text-xs font-semibold text-gray-600">Cantidad</label>
      <input
        type="number"
        min="1"
        value={quoteQuantity}
        onChange={(event) => setQuoteQuantity(event.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <button type="submit" className="mt-4 w-full rounded-lg bg-blue-900 px-3 py-2 text-sm font-bold text-white hover:bg-blue-800">
        Enviar por WhatsApp
      </button>
    </form>
  )

  const hasActiveFilters = searchQuery || filters.category || filters.subcategory || filters.inStock || localFilter !== 'all'

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase text-blue-800">Catalogo industrial</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Catalogo de Productos</h1>
          <p className="mt-2 text-gray-600">Busca por producto, categoria o SKU. Compra rapido o solicita cotizacion.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">Resultados</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{products.length}</p>
          </div>
          <button
            type="button"
            onClick={() => updateQueryParam('inStock', filters.inStock ? undefined : 'true')}
            className={`rounded-lg border p-4 text-left shadow-sm ${
              filters.inStock ? 'border-blue-800 bg-blue-50' : 'border-gray-200 bg-white'
            }`}
          >
            <p className="text-xs font-semibold uppercase text-gray-500">Disponibles</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{inStockCount}</p>
          </button>
          <button
            type="button"
            onClick={() => setLocalFilter((current) => (current === 'offers' ? 'all' : 'offers'))}
            className={`rounded-lg border p-4 text-left shadow-sm ${
              localFilter === 'offers' ? 'border-blue-800 bg-blue-50' : 'border-gray-200 bg-white'
            }`}
          >
            <p className="text-xs font-semibold uppercase text-gray-500">Ofertas</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{offerCount}</p>
          </button>
          <a href="#catalog-quote" className="rounded-lg border border-blue-200 bg-blue-950 p-4 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase text-blue-200">Compra por SKU</p>
            <p className="mt-1 text-lg font-bold">Cotizar rapido</p>
          </a>
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
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Explorador de categorias
                  </label>
                  <CategoryTreePanel categories={categories} className="w-full" />
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
            {filters.inStock && (
              <button
                type="button"
                onClick={() => updateQueryParam('inStock')}
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-900"
              >
                Solo disponibles
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
            {localFilter === 'offers' && (
              <button
                type="button"
                onClick={() => setLocalFilter('all')}
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-900"
              >
                Ofertas
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

        <div id="catalog-quote" className="scroll-mt-28" />

        <div className="mb-6 lg:hidden">
          {quoteForm}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
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
              {quoteForm}
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
                    <span>Compra rapida</span>
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
