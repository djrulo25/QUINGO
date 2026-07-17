import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CategoryAttribute, Product } from '@/types'
import { categoryAPI, productAPI } from '@/api'
import { useCartStore } from '@/store/cartStore'
import toast from 'react-hot-toast'
import { ChatBubbleLeftRightIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import ProductCard from '@/components/ProductCard'
import ProductDetailExtras from '@/components/ProductDetailExtras'
import { useStoreSettings } from '@/store/StoreSettingsContext'

export default function ProductDetailPage() {
  const { settings } = useStoreSettings()
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState('')
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loadingRelated, setLoadingRelated] = useState(false)
  const [attributeDefinitions, setAttributeDefinitions] = useState<CategoryAttribute[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([])
  const { addToCart } = useCartStore()

  useEffect(() => {
    if (!id) return

    const fetchProduct = async () => {
      try {
        setLoading(true)
        setRelatedProducts([])
        const { data } = await productAPI.getById(id)
        setProduct(data)
        setSelectedImage(data.image)
      } catch (error) {
        console.error('Error fetching product:', error)
        toast.error('Error al cargar el producto')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  useEffect(() => {
    if (!product) return

    let active = true
    const loadRelatedProducts = async () => {
      try {
        setLoadingRelated(true)
        const category = product.categorySlug || product.category
        const { data: categoryProducts } = await productAPI.getAll({ category })
        let candidates = categoryProducts.filter((candidate) => candidate.id !== product.id)

        if (candidates.length < 4) {
          const { data: catalogProducts } = await productAPI.getAll()
          const knownIds = new Set(candidates.map((candidate) => candidate.id))
          candidates = [
            ...candidates,
            ...catalogProducts.filter((candidate) => candidate.id !== product.id && !knownIds.has(candidate.id)),
          ]
        }

        const currentSubcategory = product.subcategorySlug || product.subcategory
        const currentAttributes = product.attributes || {}
        const score = (candidate: Product) => {
          const candidateSubcategory = candidate.subcategorySlug || candidate.subcategory
          const sharedAttributes = Object.entries(currentAttributes).filter(
            ([key, value]) => value !== '' && candidate.attributes?.[key] === value
          ).length
          return (candidateSubcategory === currentSubcategory ? 100 : 0)
            + sharedAttributes * 10
            + (candidate.stock > 0 ? 5 : 0)
            + candidate.rating
        }

        candidates.sort((first, second) => score(second) - score(first))
        if (active) setRelatedProducts(candidates.slice(0, 4))
      } catch (error) {
        console.error('Error loading related products:', error)
        if (active) setRelatedProducts([])
      } finally {
        if (active) setLoadingRelated(false)
      }
    }

    loadRelatedProducts()
    return () => { active = false }
  }, [product])

  useEffect(() => {
    if (!product?.categoryId) {
      setAttributeDefinitions([])
      return
    }
    categoryAPI.getAttributes(product.categoryId)
      .then(({ data }) => setAttributeDefinitions(data))
      .catch(() => setAttributeDefinitions([]))
  }, [product?.categoryId])

  useEffect(() => {
    if (!product) return
    try {
      const stored = JSON.parse(localStorage.getItem('recently-viewed-products') || '[]') as Product[]
      const previous = stored.filter((item) => item.id !== product.id)
      setRecentlyViewed(previous.slice(0, 4))
      localStorage.setItem('recently-viewed-products', JSON.stringify([product, ...previous].slice(0, 8)))
    } catch {
      setRecentlyViewed([])
      localStorage.setItem('recently-viewed-products', JSON.stringify([product]))
    }
  }, [product])

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity)
      toast.success(`${quantity} producto(s) agregado(s) al carrito`)
      setQuantity(1)
    }
  }

  if (loading) {
    return (
      <div className="py-8 container mx-auto px-4">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-lg mb-8" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="py-8 container mx-auto px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
        <Link to="/products" className="text-blue-600 hover:underline">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  const gallery = Array.from(new Set([product.image, ...(product.images || [])].filter(Boolean)))
  const quoteMessage = encodeURIComponent(`Hola ${settings.name}, quiero cotizar:\nProducto: ${product.name}\nSKU: ${product.sku}\nCantidad: ${quantity}`)
  const volumePricing = [...(product.volumePricing || [])].sort((a, b) => a.minQuantity - b.minQuantity)

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product gallery */}
          <div>
            <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8">
              <img
                src={selectedImage || product.image}
                alt={product.name}
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>
            {gallery.length > 1 && <div className="mt-3 grid grid-cols-5 gap-2">
              {gallery.map((imageUrl, index) => <button key={imageUrl} type="button" onClick={() => setSelectedImage(imageUrl)} className={`overflow-hidden rounded-lg border-2 bg-white p-1 ${selectedImage === imageUrl ? 'border-blue-700' : 'border-gray-200 hover:border-gray-400'}`} aria-label={`Ver imagen ${index + 1}`}>
                <img src={imageUrl} alt="" className="aspect-square w-full object-cover" />
              </button>)}
            </div>}
          </div>

          {/* Details */}
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">
              {product.subcategory}
            </p>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-gray-900">
                  ${product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    ${product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              {volumePricing.length > 0 && (
                <div className="mt-4 overflow-hidden rounded-xl border border-blue-100 bg-blue-50">
                  <p className="px-4 pt-3 text-sm font-bold text-blue-950">Ahorra comprando por volumen</p>
                  <div className="mt-2 divide-y divide-blue-100">
                    {volumePricing.map((tier) => (
                      <button key={tier.minQuantity} type="button" onClick={() => setQuantity(Math.min(product.stock || tier.minQuantity, tier.minQuantity))} className="flex w-full items-center justify-between gap-3 px-4 py-2 text-sm hover:bg-blue-100">
                        <span>Desde {tier.minQuantity} piezas</span>
                        <span className="font-bold text-blue-900">${(product.price * (1 - tier.discountPercent / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })} c/u · {tier.discountPercent}% menos</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-6">{product.description}</p>

            {/* Stock */}
            <div className="mb-6">
              {product.stock > 0 ? (
                <div>
                  <p className="text-green-600 font-semibold">✓ Stock disponible ({product.stock} unidades)</p>
                  {product.stock <= 5 && <p className="mt-1 text-sm font-bold text-orange-600">Últimas {product.stock} unidades disponibles</p>}
                </div>
              ) : (
                <p className="text-red-600 font-semibold">✗ Fuera de stock</p>
              )}
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-100 transition"
                  >
                    <MinusIcon className="w-5 h-5" />
                  </button>
                  <span className="px-4 font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-2 hover:bg-gray-100 transition"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed mb-4"
            >
              Agregar al Carrito
            </button>

            <a href={`https://wa.me/${settings.contact.whatsapp.replace(/\D/g, '')}?text=${quoteMessage}`} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-green-600 bg-white py-3 font-bold text-green-700 transition hover:bg-green-50">
              <ChatBubbleLeftRightIcon className="h-5 w-5" /> Cotizar por WhatsApp
            </a>
            <p className="mt-3 text-center text-xs text-gray-500">¿Necesitas muchas piezas? Solicita precio empresarial y disponibilidad.</p>

            {/* SKU */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600">
                SKU: <span className="font-mono font-medium">{product.sku}</span>
              </p>
            </div>
          </div>
        </div>

        <ProductDetailExtras
          product={product}
          attributeDefinitions={attributeDefinitions}
          relatedProducts={relatedProducts}
          recentlyViewed={recentlyViewed}
        />

        {(loadingRelated || relatedProducts.length > 0) && (
          <section className="mt-14 border-t border-gray-200 pt-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-blue-800">Complementa tu compra</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">También te puede interesar</h2>
                <p className="mt-1 text-sm text-gray-600">Productos relacionados con {product.subcategory || product.category}.</p>
              </div>
              <Link to={`/products?category=${encodeURIComponent(product.categorySlug || product.category)}`} className="hidden text-sm font-semibold text-blue-700 hover:text-blue-900 sm:block">
                Ver más productos
              </Link>
            </div>

            {loadingRelated ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, index) => <div key={index} className="h-96 animate-pulse rounded-lg bg-gray-200" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((relatedProduct) => <ProductCard key={relatedProduct.id} product={relatedProduct} />)}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
