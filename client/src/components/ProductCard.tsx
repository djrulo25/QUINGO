import { Product } from '@/types'
import { Link } from 'react-router-dom'
import { StarIcon, ShoppingCartIcon } from '@heroicons/react/24/solid'
import { useCartStore } from '@/store/cartStore'
import toast from 'react-hot-toast'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCartStore()

  const handleAddToCart = () => {
    addToCart(product, 1)
    toast.success('Producto agregado al carrito')
  }

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      {/* Image */}
      <div className="relative overflow-hidden bg-gray-200 h-48">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition"
        />
        {discountPercent > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
            -{discountPercent}%
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold">Sin stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          {product.subcategory}
        </p>

        {/* Title */}
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(product.rating)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-600 ml-2">({product.reviews})</span>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              ${product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                ${product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Stock Info */}
        <p className="text-xs text-gray-600 mb-4">
          {product.stock > 0 ? (
            <>Stock: {product.stock} unidades</>
          ) : (
            <span className="text-red-600">Fuera de stock</span>
          )}
        </p>

        {/* Button */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="w-full bg-gray-900 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <ShoppingCartIcon className="w-5 h-5" />
          Agregar
        </button>
      </div>
    </div>
  )
}
