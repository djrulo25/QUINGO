import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Product } from '@/types'
import { productAPI } from '@/api'
import { useCartStore } from '@/store/cartStore'
import toast from 'react-hot-toast'
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCartStore()

  useEffect(() => {
    if (!id) return

    const fetchProduct = async () => {
      try {
        setLoading(true)
        const { data } = await productAPI.getById(id)
        setProduct(data)
      } catch (error) {
        console.error('Error fetching product:', error)
        toast.error('Error al cargar el producto')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

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

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image */}
          <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-auto max-h-96 object-contain"
            />
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
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-6">{product.description}</p>

            {/* Stock */}
            <div className="mb-6">
              {product.stock > 0 ? (
                <p className="text-green-600 font-semibold">
                  ✓ Stock disponible ({product.stock} unidades)
                </p>
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

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="border-t pt-6 mt-6">
                <h3 className="font-semibold text-lg mb-4">Especificaciones</h3>
                <div className="space-y-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SKU */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600">
                SKU: <span className="font-mono font-medium">{product.sku}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
