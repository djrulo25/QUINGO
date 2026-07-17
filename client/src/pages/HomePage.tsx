import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { categoryAPI } from '@/api'
import { CategoryTreeNode } from '@/types'
import { getTopLevelCategories } from '@/utils/categories'

const DEFAULT_CATEGORY_IMAGE =
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=640&q=80'

const CATEGORY_IMAGES: Record<string, string> = {
  soldadura: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=640&q=80',
  'proteccion-industrial':
    'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=640&q=80',
  gases: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=640&q=80',
}

const getCategoryImage = (category: CategoryTreeNode) => {
  if (category.image?.startsWith('http')) {
    return category.image
  }

  if (CATEGORY_IMAGES[category.slug]) {
    return CATEGORY_IMAGES[category.slug]
  }

  if (category.slug.includes('soldadura') || category.name.toLowerCase().includes('soldadura')) {
    return CATEGORY_IMAGES.soldadura
  }

  if (category.slug.includes('proteccion') || category.name.toLowerCase().includes('proteccion')) {
    return CATEGORY_IMAGES['proteccion-industrial']
  }

  if (category.slug.includes('gas') || category.name.toLowerCase().includes('gas')) {
    return CATEGORY_IMAGES.gases
  }

  return DEFAULT_CATEGORY_IMAGE
}

const getCategoryLink = (category: CategoryTreeNode) => {
  const params = new URLSearchParams({ category: category.slug })
  return `/products?${params.toString()}`
}

export default function HomePage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<CategoryTreeNode[]>([])
  const [searchTerm, setSearchTerm] = useState('')

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

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const query = searchTerm.trim()
    if (!query) {
      navigate('/products')
      return
    }

    const params = new URLSearchParams({ search: query })
    navigate(`/products?${params.toString()}`)
  }

  return (
    <>
      <section className="bg-gray-100 py-3 sm:py-8">
        <div className="container mx-auto px-4">
          <form onSubmit={handleSearchSubmit} className="flex overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar"
              className="min-w-0 flex-1 px-3 py-2.5 text-sm text-gray-900 outline-none sm:px-4 sm:py-3 sm:text-base"
            />
            <button
              type="submit"
              className="flex w-12 shrink-0 items-center justify-center bg-blue-900 text-white transition hover:bg-blue-800 sm:w-14"
              aria-label="Buscar productos"
            >
              <MagnifyingGlassIcon className="h-6 w-6" />
            </button>
          </form>

          <div className="mt-3 overflow-hidden rounded-lg bg-white shadow-sm sm:mt-5">
            <div className="relative min-h-[130px] bg-gray-900 sm:min-h-[220px]">
              <img
                src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80"
                alt="Suministros industriales"
                className="absolute inset-0 h-full w-full object-cover opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-950/85 via-gray-950/45 to-transparent" />
              <div className="relative flex min-h-[130px] max-w-xl flex-col justify-center px-4 py-4 text-white sm:min-h-[220px] sm:px-8 sm:py-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-200 sm:text-sm">QUINGO</p>
                <h1 className="mt-1 text-xl font-bold leading-tight sm:mt-2 sm:text-4xl">
                  Suministros industriales para trabajar sin pausas
                </h1>
                <Link
                  to="/products"
                  className="mt-3 inline-flex w-fit items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 transition hover:bg-gray-100 sm:mt-5 sm:px-4 sm:py-2 sm:text-sm"
                >
                  Ver catalogo
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="mb-3 flex items-end justify-between gap-4 sm:mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Categorias</h2>
              <p className="hidden text-sm text-gray-600 sm:block">Soldadura, proteccion, gases y mas.</p>
            </div>
            <Link to="/products" className="hidden text-sm font-semibold text-blue-700 hover:text-blue-900 sm:block">
              Ver todo
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={getCategoryLink(category)}
                className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-[4/3] overflow-hidden bg-gray-200">
                  <img
                    src={getCategoryImage(category)}
                    alt={category.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-2 sm:p-3">
                  <p className="text-center text-xs font-semibold leading-tight text-gray-900 sm:text-left sm:text-sm">{category.name}</p>
                  {category.children?.length > 0 && (
                    <p className="mt-1 hidden text-xs text-gray-500 sm:block">{category.children.length} secciones</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Productos certificados',
                description: 'Inventario para soldadura, seguridad y gases industriales.',
              },
              {
                title: 'Entrega rapida',
                description: 'Opciones de envio para mantener tu operacion en movimiento.',
              },
              {
                title: 'Soporte tecnico',
                description: 'Asesoria para elegir el producto correcto.',
              },
              {
                title: 'Precios competitivos',
                description: 'Suministros confiables sin comprometer la calidad.',
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-lg bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
