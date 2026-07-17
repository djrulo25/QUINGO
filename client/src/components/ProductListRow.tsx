import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChatBubbleLeftRightIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { Product } from '@/types'
import { useCartStore } from '@/store/cartStore'

interface ProductListRowProps {
  product: Product
}

export default function ProductListRow({ product }: ProductListRowProps) {
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

  const quoteMessage = encodeURIComponent(
    `Hola QUINGO, quiero cotizar:\nSKU: ${product.sku}\nProducto: ${product.name}\nCantidad: ${quantity}`
  )

  return (
    <div className="grid gap-3 border-b border-gray-200 bg-white p-3 last:border-b-0 md:grid-cols-[72px_1fr_110px_110px_190px] md:items-center">
      <Link to={`/products/${product.id}`} className="hidden h-16 w-16 overflow-hidden rounded bg-gray-100 md:block">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
      </Link>

      <div className="min-w-0">
        <div className="flex gap-3 md:hidden">
          <Link to={`/products/${product.id}`} className="h-16 w-16 shrink-0 overflow-hidden rounded bg-gray-100">
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          </Link>
          <div className="min-w-0">
            <Link to={`/products/${product.id}`} className="font-semibold text-gray-900 hover:text-blue-700">
              {product.name}
            </Link>
            <p className="mt-1 text-xs text-gray-500">SKU: {product.sku}</p>
          </div>
        </div>

        <div className="hidden md:block">
          <Link to={`/products/${product.id}`} className="font-semibold text-gray-900 hover:text-blue-700">
            {product.name}
          </Link>
          <p className="mt-1 text-xs text-gray-500">SKU: {product.sku}</p>
          <p className="mt-1 text-xs text-gray-500">{product.subcategory || product.category}</p>
        </div>
      </div>

      <div>
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
            product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
          }`}
        >
          {product.stock > 0 ? `${product.stock} disp.` : 'Sin stock'}
        </span>
      </div>

      <div>
        <p className="text-lg font-bold text-gray-900">${product.price.toLocaleString()}</p>
        {product.originalPrice && (
          <p className="text-xs text-gray-500 line-through">${product.originalPrice.toLocaleString()}</p>
        )}
      </div>

      <div className="flex gap-2">
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
          type="button"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-900 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          <ShoppingCartIcon className="h-4 w-4" />
          Agregar
        </button>
        <a
          href={`https://wa.me/5215576881138?text=${quoteMessage}`}
          className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50"
          aria-label={`Cotizar ${product.name}`}
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
        </a>
      </div>
    </div>
  )
}
