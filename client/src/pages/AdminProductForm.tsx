import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'
import { Product, CategoryAttribute, CategoryTreeNode } from '@/types'
import { PhotoIcon, StarIcon, TrashIcon } from '@heroicons/react/24/outline'
import { API_BASE_URL } from '@/api/config'
import { categoryAPI } from '@/api'
import { getTopLevelCategories } from '@/utils/categories'
import DynamicProductAttributes from '@/components/DynamicProductAttributes'
import ProductSalesExtrasEditor from '@/components/ProductSalesExtrasEditor'

export default function AdminProductForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<CategoryTreeNode[]>([])
  const [selectedParentCategory, setSelectedParentCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [attributeDefinitions, setAttributeDefinitions] = useState<CategoryAttribute[]>([])
  const [product, setProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    category: '',
    subcategory: '',
    stock: 0,
    sku: '',
    image: '',
    images: [],
    rating: 0,
    reviews: 0,
    specifications: {},
    attributes: {},
    volumePricing: [],
    documents: [],
    faqs: []
  })

  // Verificar autenticación
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      navigate('/admin/login')
      return
    }

    loadCategories()

    // Si es edición, cargar el producto
    if (isEdit) {
      loadProduct()
    }
  }, [id, isEdit, navigate])

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll()
      setCategories(response.data)
    } catch (error) {
      console.error('Error loading categories', error)
      toast.error('No se pudieron cargar las categorías')
    }
  }

  const topLevelCategories = getTopLevelCategories(categories)

  useEffect(() => {
    if (!product.category || categories.length === 0) return
    syncCategorySelection(product.category, product.subcategory)
  }, [categories, product.category, product.subcategory])

  useEffect(() => {
    const selectedNode = getSubcategoriesForParent(selectedParentCategory).find((item) => item.slug === selectedSubcategory)
      || topLevelCategories.find((item) => item.slug === selectedParentCategory)

    if (!selectedNode?.id) {
      setAttributeDefinitions([])
      return
    }

    categoryAPI.getAttributes(selectedNode.id)
      .then((response) => setAttributeDefinitions(response.data))
      .catch(() => {
        setAttributeDefinitions([])
        toast.error('No se pudo cargar la plantilla de atributos')
      })
  }, [categories, selectedParentCategory, selectedSubcategory])

  const getSubcategoriesForParent = (parentSlug: string) => {
    const parent = topLevelCategories.find((category) => category.slug === parentSlug)
    return parent?.children || []
  }

  const syncCategorySelection = (categorySlug: string = '', subcategorySlug: string = '') => {
    if (!categorySlug) {
      setSelectedParentCategory('')
      setSelectedSubcategory('')
      return
    }

    const parent = topLevelCategories.find((item) => item.slug === categorySlug)
    if (parent) {
      setSelectedParentCategory(parent.slug)
    }

    const matchingSubcategory = getSubcategoriesForParent(categorySlug).find((item) => item.slug === subcategorySlug)
    if (matchingSubcategory) {
      setSelectedSubcategory(matchingSubcategory.slug)
    } else {
      setSelectedSubcategory('')
    }
  }

  const loadProduct = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/products/${id}`)
      const gallery = Array.from(new Set([response.data.image, ...(response.data.images || [])].filter(Boolean))) as string[]
      setProduct({ ...response.data, image: gallery[0] || '', images: gallery })
      syncCategorySelection(response.data.category, response.data.subcategory)
    } catch (error) {
      toast.error('Error al cargar el producto')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setProduct({
      ...product,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    })
  }

  const handleParentCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextParentSlug = e.target.value
    setSelectedParentCategory(nextParentSlug)
    setSelectedSubcategory('')

    const nextParent = topLevelCategories.find((category) => category.slug === nextParentSlug)
    setProduct({
      ...product,
      category: nextParent?.slug || '',
      subcategory: '',
      attributes: {}
    })
  }

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSubcategorySlug = e.target.value
    setSelectedSubcategory(nextSubcategorySlug)

    setProduct({
      ...product,
      category: selectedParentCategory,
      subcategory: nextSubcategorySlug,
      attributes: {}
    })
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (files.some((file) => !file.type.startsWith('image/'))) {
      toast.error('Todos los archivos deben ser imágenes válidas')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      files.forEach((file) => formData.append('images', file))

      const token = localStorage.getItem('adminToken')
      const response = await axios.post(
        `${API_BASE_URL}/uploads/multiple`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      )

      const uploadedUrls = response.data.images.map((image: { url: string }) => image.url)
      setProduct((current) => {
        const gallery = Array.from(new Set([...(current.images || []), ...uploadedUrls]))
        return { ...current, image: current.image || gallery[0] || '', images: gallery }
      })
      toast.success(`${uploadedUrls.length} imagen${uploadedUrls.length === 1 ? '' : 'es'} subida${uploadedUrls.length === 1 ? '' : 's'} correctamente`)

      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al subir las imágenes')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = (imageUrl: string) => {
    setProduct((current) => {
      const gallery = (current.images || []).filter((url) => url !== imageUrl)
      return { ...current, images: gallery, image: current.image === imageUrl ? gallery[0] || '' : current.image }
    })
  }

  const handleSetPrimaryImage = (imageUrl: string) => {
    setProduct((current) => ({
      ...current,
      image: imageUrl,
      images: [imageUrl, ...(current.images || []).filter((url) => url !== imageUrl)]
    }))
  }

  const getSelectedCategoryId = () => {
    const selectedSubcategoryNode = getSubcategoriesForParent(selectedParentCategory).find(
      (item) => item.slug === selectedSubcategory
    )

    if (selectedSubcategoryNode?.id) {
      return selectedSubcategoryNode.id
    }

    const selectedCategoryNode = topLevelCategories.find((item) => item.slug === selectedParentCategory)
    return selectedCategoryNode?.id || null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!product.name || !product.price || !product.category || !product.sku || !product.image) {
      toast.error('Por favor completa los campos requeridos')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const payload = {
        ...product,
        category: selectedParentCategory,
        subcategory: selectedSubcategory,
        categorySlug: selectedParentCategory,
        subcategorySlug: selectedSubcategory,
        categoryId: getSelectedCategoryId(),
        image: product.image,
        images: product.images || [product.image],
      }

      if (isEdit) {
        await axios.put(
          `${API_BASE_URL}/products/${id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        toast.success('Producto actualizado exitosamente')
      } else {
        await axios.post(
          `${API_BASE_URL}/products`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        toast.success('Producto creado exitosamente')
      }

      navigate('/admin/products')
    } catch (error) {
      toast.error('Error al guardar el producto')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && isEdit) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4 overflow-x-hidden">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">
            {isEdit ? 'Editar Producto' : 'Agregar Nuevo Producto'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Producto *
              </label>
              <input
                type="text"
                name="name"
                value={product.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Electrodo para Soldadura"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                name="description"
                value={product.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descripción detallada del producto"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={product.sku}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Código SKU único"
              />
            </div>

            {/* Precios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Actual *
                </label>
                <input
                  type="number"
                  name="price"
                  value={product.price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Original
                </label>
                <input
                  type="number"
                  name="originalPrice"
                  value={product.originalPrice}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock
              </label>
              <input
                type="number"
                name="stock"
                value={product.stock}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            {/* Categoría */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  value={selectedParentCategory}
                  onChange={handleParentCategoryChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecciona una categoría</option>
                  {topLevelCategories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategoría
                </label>
                <select
                  value={selectedSubcategory}
                  onChange={handleSubcategoryChange}
                  disabled={!selectedParentCategory}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Selecciona una subcategoría</option>
                  {getSubcategoriesForParent(selectedParentCategory).map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.slug}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DynamicProductAttributes
              definitions={attributeDefinitions}
              values={product.attributes || {}}
              onChange={(attributes) => setProduct((current) => ({ ...current, attributes }))}
            />

            {/* Galería de imágenes en Cloudinary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imágenes del producto *
              </label>
              <p className="mb-3 text-sm text-gray-500">Selecciona varias imágenes o agrégalas en distintas tandas. La imagen principal será la portada del producto.</p>
              <div className="space-y-4">
                {/* File Input */}
                <div className="flex items-center justify-center w-full">
                  <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg p-6 cursor-pointer hover:border-blue-500 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <PhotoIcon className="w-8 h-8 text-blue-500 mb-2" />
                      <p className="text-sm text-gray-600">
                        {uploading ? 'Subiendo imágenes a Cloudinary...' : 'Haz clic para seleccionar una o varias imágenes'}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">Máximo 10 MB por imagen</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {(product.images || []).length > 0 && <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-green-700">✓ {(product.images || []).length} imagen{(product.images || []).length === 1 ? '' : 'es'} en la galería</p>
                    <p className="text-xs text-gray-500">Selecciona “Principal” para cambiar la portada</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {(product.images || []).map((imageUrl, index) => {
                      const isPrimary = product.image === imageUrl
                      return <div key={imageUrl} className={`relative overflow-hidden rounded-xl border-2 bg-white ${isPrimary ? 'border-blue-600 shadow-md' : 'border-gray-200'}`}>
                        <img src={imageUrl} alt={`Imagen ${index + 1} del producto`} className="aspect-square w-full object-cover" />
                        <div className="flex items-center justify-between gap-1 border-t border-gray-100 p-2">
                          <button type="button" onClick={() => handleSetPrimaryImage(imageUrl)} disabled={isPrimary} className={`inline-flex items-center gap-1 text-xs font-semibold ${isPrimary ? 'text-blue-700' : 'text-gray-600 hover:text-blue-700'}`}>
                            <StarIcon className={`h-4 w-4 ${isPrimary ? 'fill-blue-600' : ''}`} /> {isPrimary ? 'Principal' : 'Hacer principal'}
                          </button>
                          <button type="button" onClick={() => handleRemoveImage(imageUrl)} className="rounded-md p-1 text-red-600 hover:bg-red-50" aria-label={`Eliminar imagen ${index + 1}`}><TrashIcon className="h-4 w-4" /></button>
                        </div>
                      </div>
                    })}
                  </div>
                </div>}
              </div>
            </div>

            <ProductSalesExtrasEditor
              volumePricing={product.volumePricing || []}
              documents={product.documents || []}
              faqs={product.faqs || []}
              onVolumePricingChange={(volumePricing) => setProduct((current) => ({ ...current, volumePricing }))}
              onDocumentsChange={(documents) => setProduct((current) => ({ ...current, documents }))}
              onFaqsChange={(faqs) => setProduct((current) => ({ ...current, faqs }))}
            />

            {/* Rating */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating (0-5)
                </label>
                <input
                  type="number"
                  name="rating"
                  value={product.rating}
                  onChange={handleChange}
                  min="0"
                  max="5"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Reviews
                </label>
                <input
                  type="number"
                  name="reviews"
                  value={product.reviews}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
              <button
                type="submit"
                disabled={loading || uploading}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {loading ? 'Guardando...' : isEdit ? 'Actualizar Producto' : 'Crear Producto'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

