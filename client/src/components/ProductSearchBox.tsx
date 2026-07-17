import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { productAPI } from '@/api'
import { CategoryTreeNode, Product } from '@/types'
import { flattenCategoryCatalog, getCategoryProductLink } from '@/utils/categoryCatalog'

interface ProductSearchBoxProps {
  categories?: CategoryTreeNode[]
  initialValue?: string
  placeholder?: string
  className?: string
  inputClassName?: string
  buttonClassName?: string
  onQueryChange?: (query: string) => void
  onSearch?: (query: string) => void
}

export default function ProductSearchBox({
  categories = [],
  initialValue = '',
  placeholder = 'Buscar por producto, categoria o SKU',
  className = '',
  inputClassName = '',
  buttonClassName = '',
  onQueryChange,
  onSearch,
}: ProductSearchBoxProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState(initialValue)
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const catalogItems = useMemo(() => flattenCategoryCatalog(categories), [categories])
  const trimmedQuery = query.trim()

  const categorySuggestions = trimmedQuery
    ? catalogItems
        .filter(({ category }) => {
          const target = `${category.name} ${category.slug}`.toLowerCase()
          return target.includes(trimmedQuery.toLowerCase())
        })
        .slice(0, 5)
    : []

  useEffect(() => {
    setQuery(initialValue)
  }, [initialValue])

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      setProductSuggestions([])
      return
    }

    const debounceTimer = window.setTimeout(async () => {
      try {
        const { data } = await productAPI.getAll({ search: trimmedQuery })
        setProductSuggestions(data.slice(0, 5))
      } catch (error) {
        console.error('Error loading search suggestions', error)
      }
    }, 250)

    return () => window.clearTimeout(debounceTimer)
  }, [trimmedQuery])

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowSuggestions(false)

    if (onSearch) {
      onSearch(trimmedQuery)
      return
    }

    if (!trimmedQuery) {
      navigate('/products')
      return
    }

    navigate(`/products?search=${encodeURIComponent(trimmedQuery)}`)
  }

  const clearSearch = () => {
    setQuery('')
    onQueryChange?.('')
    setProductSuggestions([])
    setShowSuggestions(false)
  }

  const hasSuggestions = productSuggestions.length > 0 || categorySuggestions.length > 0

  return (
    <div className={`relative ${className}`}>
      <form
        onSubmit={submitSearch}
        className="flex overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm"
      >
        <input
          type="text"
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value
            setQuery(nextQuery)
            onQueryChange?.(nextQuery)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className={`min-w-0 flex-1 px-3 py-2.5 text-sm text-gray-900 outline-none ${inputClassName}`}
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="flex w-10 shrink-0 items-center justify-center text-gray-500 hover:text-gray-900"
            aria-label="Limpiar busqueda"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
        <button
          type="submit"
          className={`flex w-12 shrink-0 items-center justify-center bg-blue-900 text-white transition hover:bg-blue-800 ${buttonClassName}`}
          aria-label="Buscar productos"
        >
          <MagnifyingGlassIcon className="h-6 w-6" />
        </button>
      </form>

      {showSuggestions && hasSuggestions && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 text-gray-900 shadow-lg">
          {productSuggestions.length > 0 && (
            <div>
              <p className="px-3 py-1 text-xs font-bold uppercase text-gray-500">Productos</p>
              {productSuggestions.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  onClick={() => setShowSuggestions(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-100"
                >
                  <img src={product.image} alt={product.name} className="h-10 w-10 rounded object-cover" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{product.name}</span>
                    <span className="block text-xs text-gray-500">SKU: {product.sku}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}

          {categorySuggestions.length > 0 && (
            <div className={productSuggestions.length > 0 ? 'mt-2 border-t border-gray-100 pt-2' : ''}>
              <p className="px-3 py-1 text-xs font-bold uppercase text-gray-500">Categorias</p>
              {categorySuggestions.map((item) => (
                <Link
                  key={item.category.id}
                  to={getCategoryProductLink(item)}
                  onClick={() => setShowSuggestions(false)}
                  className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-100"
                >
                  {item.category.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
