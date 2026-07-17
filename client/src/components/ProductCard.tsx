import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCartIcon, StarIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import { Product } from '@/types'
import { useCartStore } from '@/store/cartStore'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCartStore()
  const [quantity, setQuantity] = useState(1)

  const handleQuantityChange = (value: string) => {
    const parsedValue = Number(value)
    if (Number.isNaN(parsedValue)) {
      return
    }

    const maxQuantity = product.stock > 0 ? product.stock : 1
    setQuantity(Math.min(Math.max(parsedValue, 1), maxQuantity))
  }

  const handleAddToCart = () => {
    addToCart(product, quantity)
    toast.success('Producto agregado al carrito')
  }

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative h-40 overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover"
        />
        {discountPercent > 0 && (
          <div className="absolute right-2 top-2 rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white">
            -{discountPercent}%
          </div>
        )}
        <span
          className={`absolute left-2 top-2 rounded px-2 py-1 text-xs font-semibold ${
            product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
          }`}
        >
          {product.stock > 0 ? 'Disponible' : 'Sin stock'}
        </span>
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-gray-500">
              {product.subcategory || product.category}
            </p>
            <p className="mt-1 text-xs text-gray-500">SKU: {product.sku}</p>
          </div>
          <div className="flex shrink-0 items-center">
            {[...Array(5)].map((_, index) => (
              <StarIcon
                key={index}
                className={`h-3.5 w-3.5 ${
                  index < Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        <Link to={`/products/${product.id}`}>
          <h3 className="min-h-[44px] text-sm font-bold leading-snug text-gray-900 hover:text-blue-700">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xl font-bold text-gray-900">
            ${product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-500 line-through">
              ${product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-gray-600">
          {product.stock > 0 ? `${product.stock} unidades disponibles` : 'Fuera de stock'}
        </p>

        <div className="mt-4 flex gap-2">
          <input
            type="number"
            min="1"
            max={Math.max(product.stock, 1)}
            value={quantity}
            onChange={(event) => handleQuantityChange(event.target.value)}
            disabled={product.stock === 0}
            className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-center text-sm font-semibold disabled:bg-gray-100"
            aria-label={`Cantidad de ${product.name}`}
          />
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            <ShoppingCartIcon className="h-5 w-5" />
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}
