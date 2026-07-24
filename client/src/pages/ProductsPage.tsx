import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  FunnelIcon,
  Squares2X2Icon,
  TableCellsIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { Product, FilterOptions, CategoryAttribute, CategoryTreeNode } from '@/types'
import ProductCard from '@/components/ProductCard'
import ProductListRow from '@/components/ProductListRow'
import ProductSearchBox from '@/components/ProductSearchBox'
import { productAPI, categoryAPI } from '@/api'
import { flattenCategoryCatalog, getCategoryProductLink } from '@/utils/categoryCatalog'
import { getTopLevelCategories } from '@/utils/categories'

const SORT_OPTIONS = [
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
] as const

type SortOption = (typeof SORT_OPTIONS)[number]['value']
type ViewMode = 'grid' | 'list'
type AttributeFilterValues = Record<string, string>

const waitForRetry = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds))

const requestWithRetry = async <T,>(request: () => Promise<T>, attempts = 4): Promise<T> => {
  let lastError: unknown
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await request()
    } catch (error) {
      lastError = error
      if (attempt < attempts - 1) await waitForRetry(1200 * (attempt + 1))
    }
  }
  throw lastError
}

const buildAttributeFilters = (definitions: CategoryAttribute[], values: AttributeFilterValues, brand?: string) => {
  const filters: Record<string, string | boolean | { min?: number; max?: number }> = {}
  if (brand) filters.marca = brand
  for (const attribute of definitions) {
    if (attribute.type === 'number') {
      const min = values[`${attribute.key}__min`]
      const max = values[`${attribute.key}__max`]
      if (min || max) filters[attribute.key] = {
        ...(min ? { min: Number(min) } : {}),
        ...(max ? { max: Number(max) } : {}),
      }
    } else {
      const value = values[attribute.key]
      if (value) filters[attribute.key] = attribute.type === 'checkbox' ? value === 'true' : value
    }
  }
  return Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined
}

const formatFilterValue = (attribute: CategoryAttribute, value: string) => {
  if (attribute.type === 'checkbox') return value === 'true' ? 'Sí' : 'No'
  return `${value}${attribute.unit ? ` ${attribute.unit}` : ''}`
}

const renderAttributeFilter = (
  attribute: CategoryAttribute,
  values: AttributeFilterValues,
  onChange: (key: string, value: string) => void
) => {
  const label = <span className="mb-2 block text-sm font-bold text-gray-800">{attribute.name}{attribute.unit ? ` (${attribute.unit})` : ''}</span>

  if (attribute.type === 'number') return <div key={attribute.key}>{label}<div className="grid grid-cols-2 gap-2"><input type="number" value={values[`${attribute.key}__min`] || ''} onChange={(event) => onChange(`${attribute.key}__min`, event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" placeholder="Mínimo" /><input type="number" value={values[`${attribute.key}__max`] || ''} onChange={(event) => onChange(`${attribute.key}__max`, event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" placeholder="Máximo" /></div></div>

  if (attribute.type === 'select') return <div key={attribute.key}>{label}<div className="flex flex-wrap gap-2"><button type="button" onClick={() => onChange(attribute.key, '')} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${!values[attribute.key] ? 'border-blue-800 bg-blue-900 text-white' : 'border-gray-300 bg-white text-gray-700'}`}>Todos</button>{attribute.options.map((option) => <button key={option} type="button" onClick={() => onChange(attribute.key, option)} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${values[attribute.key] === option ? 'border-blue-800 bg-blue-900 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-blue-500'}`}>{option}</button>)}</div></div>

  if (attribute.type === 'checkbox') return <div key={attribute.key}>{label}<select value={values[attribute.key] || ''} onChange={(event) => onChange(attribute.key, event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"><option value="">Todos</option><option value="true">Sí</option><option value="false">No</option></select></div>

  return <label key={attribute.key} className="block">{label}<input type={attribute.type === 'date' ? 'date' : 'text'} value={values[attribute.key] || ''} onChange={(event) => onChange(attribute.key, event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" placeholder={attribute.placeholder || `Filtrar por ${attribute.name.toLowerCase()}`} /></label>
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeBrand = searchParams.get('brand') || ''
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
  const [attributeFilterValues, setAttributeFilterValues] = useState<AttributeFilterValues>({})
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set())
  const [catalogLoadError, setCatalogLoadError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [currentPage, setCurrentPage] = useState(Math.max(1, Number(searchParams.get('page')) || 1))
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await requestWithRetry(() => categoryAPI.getAll())
        setCategories(getTopLevelCategories(response.data))
      } catch (error) {
        console.error('Error loading categories', error)
      }
    }

    loadCategories()
  }, [reloadKey])

  const catalogItems = useMemo(() => flattenCategoryCatalog(categories), [categories])
  const activeCategorySlug = filters.subcategory || filters.category
  const activeCategory = useMemo(
    () => catalogItems.find((item) => item.category.slug === activeCategorySlug)?.category,
    [activeCategorySlug, catalogItems]
  )
  const filterableAttributes = useMemo(
    () => (activeCategory?.attributes || []).filter((attribute) => attribute.filterable !== false).slice(0, 8),
    [activeCategory]
  )

  useEffect(() => {
    if (!activeCategorySlug || categories.length === 0) return
    const findAncestors = (nodes: CategoryTreeNode[], ancestors: string[] = []): string[] | null => {
      for (const node of nodes) {
        if (node.slug === activeCategorySlug) return ancestors
        const found = findAncestors(node.children || [], [...ancestors, node.id])
        if (found) return found
      }
      return null
    }
    const ancestors = findAncestors(categories)
    if (ancestors) setExpandedCategoryIds(new Set(ancestors))
  }, [activeCategorySlug, categories])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategoryIds((current) => {
      const next = new Set(current)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  const renderCategoryNode = (category: CategoryTreeNode, root: CategoryTreeNode, depth = 0): React.ReactNode => {
    const hasChildren = category.children?.length > 0
    const expanded = expandedCategoryIds.has(category.id)
    const isActive = category.slug === activeCategorySlug
    const link = getCategoryProductLink({ category, root, depth })

    return (
      <div key={category.id}>
        <div className={`flex items-center rounded-md border-l-2 transition ${isActive ? 'border-blue-800 bg-blue-50' : 'border-transparent hover:bg-gray-100'}`} style={{ paddingLeft: `${depth * 14}px` }}>
          {hasChildren ? (
            <button type="button" onClick={() => toggleCategory(category.id)} className="flex min-w-0 flex-1 items-center gap-2 py-2 pl-2 pr-1 text-left text-sm font-semibold text-gray-900" aria-expanded={expanded}>
              {expanded ? <ChevronDownIcon className="h-4 w-4 shrink-0" /> : <ChevronRightIcon className="h-4 w-4 shrink-0" />}
              <span className="min-w-0 break-words">{category.name}</span>
            </button>
          ) : (
            <Link to={link} className={`block min-w-0 flex-1 py-2 pl-8 pr-2 text-sm ${isActive ? 'font-bold text-blue-900' : 'font-medium text-gray-700 hover:text-blue-700'}`}>
              {category.name}
            </Link>
          )}
        </div>
        {hasChildren && expanded && (
          <div>
            <Link to={link} className="block py-1.5 pr-2 text-xs font-semibold text-blue-700 hover:bg-blue-50" style={{ paddingLeft: `${depth * 14 + 36}px` }}>
              Ver todos
            </Link>
            {category.children.map((child) => renderCategoryNode(child, root, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  useEffect(() => {
    const categoryFromQuery = searchParams.get('category') || undefined
    const subcategoryFromQuery = searchParams.get('subcategory') || undefined
    const searchFromQuery = searchParams.get('search') || ''
    const pageFromQuery = Math.max(1, Number(searchParams.get('page')) || 1)

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
    setCurrentPage(pageFromQuery)
  }, [searchParams])

  useEffect(() => {
    setAttributeFilterValues({})
  }, [activeCategorySlug])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setCatalogLoadError(false)
        const { data } = await requestWithRetry(() => productAPI.getPage({
            ...filters,
            search: searchQuery.trim() || undefined,
            attributeFilters: buildAttributeFilters(filterableAttributes, attributeFilterValues, activeBrand),
            page: currentPage,
            limit: 24,
            sort: sortBy,
          }))
        setProducts(data.items)
        setTotalProducts(data.total)
        setTotalPages(data.totalPages)
        if (data.page !== currentPage) {
          const nextParams = new URLSearchParams(searchParams)
          if (data.page > 1) nextParams.set('page', String(data.page))
          else nextParams.delete('page')
          setSearchParams(nextParams, { replace: true })
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        setCatalogLoadError(true)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = window.setTimeout(fetchProducts, 400)
    return () => window.clearTimeout(debounceTimer)
  }, [filters, searchQuery, filterableAttributes, attributeFilterValues, activeBrand, currentPage, sortBy, reloadKey])

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

  const handleCatalogSearch = (query: string) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('page')

    if (query) {
      nextParams.set('search', query)
    } else {
      nextParams.delete('search')
    }

    setSearchParams(nextParams)
  }

  const activeAttributeFilterCount = Object.values(attributeFilterValues).filter(Boolean).length
  const hasActiveFilters = searchQuery || filters.category || filters.subcategory || activeBrand || activeAttributeFilterCount > 0

  const setAttributeFilter = (key: string, value: string) => {
    setCurrentPage(1)
    setAttributeFilterValues((current) => ({ ...current, [key]: value }))
  }

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages)
    const nextParams = new URLSearchParams(searchParams)
    if (nextPage > 1) nextParams.set('page', String(nextPage))
    else nextParams.delete('page')
    setSearchParams(nextParams)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderFilterControls = (closeAfterAction = false) => (
    <>
      {activeCategory ? (
        <div>
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Filtros para</p>
            <h2 className="text-lg font-bold text-gray-900">{activeCategory.name}</h2>
          </div>
          {filterableAttributes.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filterableAttributes.map((attribute) => renderAttributeFilter(attribute, attributeFilterValues, setAttributeFilter))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">Esta categoría todavía no tiene características marcadas como filtros.</p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="font-semibold text-blue-950">Selecciona una categoría</p>
          <p className="mt-1 text-sm text-blue-800">Los filtros mostrarán automáticamente las características relevantes para ese tipo de producto.</p>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setAttributeFilterValues({})
            if (closeAfterAction) {
              setShowFilters(false)
            }
          }}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <XMarkIcon className="h-4 w-4" />
          Limpiar características
        </button>
      </div>
    </>
  )

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="mb-4 sm:mb-6">
          <h1 className="whitespace-nowrap text-lg font-bold leading-tight text-gray-900 sm:text-3xl">Catálogo de productos</h1>
          <p className="mt-1 text-sm text-gray-600 sm:mt-2 sm:text-base">Busca por producto, categoría o SKU.</p>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <ProductSearchBox
              categories={categories}
              initialValue={searchQuery}
              className="min-w-0 flex-1"
              inputClassName="py-3"
              onQueryChange={setSearchQuery}
              onSearch={handleCatalogSearch}
            />

            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className={`relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-sm font-semibold transition-colors sm:px-3 ${
                showFilters || activeAttributeFilterCount > 0
                  ? 'border-blue-700 bg-blue-50 text-blue-900'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-blue-500 hover:text-blue-800'
              }`}
              aria-label="Mostrar filtros"
              title="Filtros"
            >
              <FunnelIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
              {activeAttributeFilterCount > 0 && <span className="min-w-5 rounded-full bg-blue-900 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">{activeAttributeFilterCount}</span>}
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
            {activeBrand && (
              <button
                type="button"
                onClick={() => {
                  const nextParams = new URLSearchParams(searchParams)
                  nextParams.delete('brand')
                  setSearchParams(nextParams)
                }}
                className="inline-flex items-center gap-1 rounded-full bg-blue-900 px-3 py-1 text-sm font-semibold text-white"
              >
                Marca: {activeBrand}
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
            {Object.entries(attributeFilterValues).filter(([, value]) => value).map(([key, value]) => {
              const baseKey = key.replace(/__(min|max)$/, '')
              const attribute = filterableAttributes.find((item) => item.key === baseKey)
              if (!attribute) return null
              const suffix = key.endsWith('__min') ? 'desde' : key.endsWith('__max') ? 'hasta' : ''
              return <button key={key} type="button" onClick={() => setAttributeFilter(key, '')} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-900">
                {attribute.name} {suffix}: {formatFilterValue(attribute, value)} <XMarkIcon className="h-4 w-4" />
              </button>
            })}
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase text-gray-500">Comprar por categoria</h2>
                  <Link to="/products" className="text-xs font-semibold text-blue-700 hover:text-blue-900">
                    Todos
                  </Link>
                </div>
                <div className="max-h-[calc(100vh-12rem)] space-y-1 overflow-y-auto overscroll-contain pr-1">
                  {categories.map((category) => renderCategoryNode(category, category))}
                </div>
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            <div className="mb-4 flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-bold text-gray-900">
                    {loading ? 'Cargando productos...' : catalogLoadError ? 'No se pudo cargar el catálogo' : `${totalProducts} productos encontrados`}
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
                  onChange={(event) => {
                    setSortBy(event.target.value as SortOption)
                    const nextParams = new URLSearchParams(searchParams)
                    nextParams.delete('page')
                    setSearchParams(nextParams)
                  }}
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
            ) : catalogLoadError ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-12 text-center shadow-sm">
                <p className="text-lg font-bold text-amber-950">No se pudo conectar con el catálogo</p>
                <p className="mt-2 text-sm text-amber-800">Tus productos siguen guardados. El servidor puede estar iniciando; vuelve a intentar la carga.</p>
                <button type="button" onClick={() => setReloadKey((current) => current + 1)} className="mt-5 rounded-lg bg-blue-900 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800">
                  Reintentar
                </button>
              </div>
            ) : sortedProducts.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {sortedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="hidden min-w-[780px] grid-cols-[72px_minmax(180px,1fr)_100px_90px_230px] gap-3 bg-gray-100 px-3 py-2 text-xs font-bold uppercase text-gray-500 md:grid">
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
                  {categories.slice(0, 6).map((category) => (
                    <Link
                      key={category.id}
                      to={getCategoryProductLink(category)}
                      className="rounded-full border border-gray-300 px-3 py-1 text-sm font-semibold text-gray-700 hover:border-blue-700 hover:text-blue-800"
                    >
                      Ver {category.name}
                    </Link>
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

            {!loading && !catalogLoadError && totalPages > 1 && (
              <nav className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-label="Paginación del catálogo">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:border-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
                  .map((page, index, pages) => (
                    <span key={page} className="contents">
                      {index > 0 && page - pages[index - 1] > 1 && <span className="px-1 text-gray-500">…</span>}
                      <button
                        type="button"
                        onClick={() => goToPage(page)}
                        aria-current={page === currentPage ? 'page' : undefined}
                        className={`min-w-10 rounded-lg px-3 py-2 text-sm font-bold ${
                          page === currentPage
                            ? 'bg-blue-900 text-white'
                            : 'border border-gray-300 bg-white text-gray-700 hover:border-blue-600'
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:border-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
                <span className="w-full text-center text-xs text-gray-500">Página {currentPage} de {totalPages}</span>
              </nav>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
