import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'
import { useCustomerStore } from '@/store/customerStore'
import { customerAPI, orderAPI } from '@/api'
import { IAddress } from '@/types/customer'
import { StripeProvider } from '@/components/StripeProvider'
import { StripePaymentForm } from '@/components/StripePaymentForm'
import { OXXOPaymentForm } from '@/components/OXXOPaymentForm'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { cart, clearCart } = useCartStore()
  const { customer, isLoggedIn } = useCustomerStore()
  const [loading, setLoading] = useState(false)
  const [addresses, setAddresses] = useState<IAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [currentStep, setCurrentStep] = useState<'details' | 'payment'>('details')
  const [paymentProcessed, setPaymentProcessed] = useState(false)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    street: '',
    number: '',
    complement: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    shippingMethod: 'standard',
    paymentMethod: 'credit-card',
  })

  // Load customer data on mount
  useEffect(() => {
    if (isLoggedIn && customer) {
      // Load user personal info
      setFormData((prev) => ({
        ...prev,
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
      }))

      // Load addresses
      loadAddresses()
    }
  }, [isLoggedIn, customer])

  // Auto-fill address form when addresses load
  useEffect(() => {
    if (addresses.length > 0) {
      const defaultAddress = addresses.find((addr: IAddress) => addr.isDefault)
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress._id!)
        // Fill the address form with default address data
        setFormData((prev) => ({
          ...prev,
          street: defaultAddress.street || '',
          number: defaultAddress.number || '',
          complement: defaultAddress.complement || '',
          city: defaultAddress.city || '',
          state: defaultAddress.state || '',
          zipCode: defaultAddress.zipCode || '',
          country: defaultAddress.country || '',
        }))
      }
    }
  }, [addresses])

  const loadAddresses = async () => {
    try {
      const response = await customerAPI.getAddresses()
      setAddresses(response.data)
    } catch (error) {
      console.error('Error loading addresses:', error)
    }
  }

  const fillAddressForm = (address: IAddress) => {
    setFormData((prev) => ({
      ...prev,
      street: address.street || '',
      number: address.number || '',
      complement: address.complement || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zipCode || '',
      country: address.country || '',
    }))
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const addressId = e.target.value
    setSelectedAddressId(addressId)

    const selected = addresses.find((addr) => addr._id === addressId)
    if (selected) {
      fillAddressForm(selected)
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Tu carrito está vacío</h1>
          <Link
            to="/products"
            className="text-blue-600 hover:underline font-semibold"
          >
            Ir al catálogo
          </Link>
        </div>
      </div>
    )
  }

  const shippingCost = formData.shippingMethod === 'express' ? 50 : 20
  const total = cart.totalPrice + shippingCost

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    console.log('CheckoutPage handleChange', name, value)
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  console.log('CheckoutPage render', { paymentMethod: formData.paymentMethod, paymentProcessed })

  const handlePaymentSuccess = async (paymentId: string, redirectUrl?: string) => {
    const newPaymentIntentId = paymentId
    setPaymentIntentId(newPaymentIntentId)

    // For OXXO, the order is already created before generating the code.
    if (redirectUrl) {
      toast.success('Pago OXXO generado. Código y pedido pendiente listos.')
      setPaymentProcessed(true)
      return
    }

    setPaymentProcessed(true)
    toast.success('Pago procesado exitosamente')

    // Create order after payment is successful
    try {
      await createOrder({ paymentIntentId: newPaymentIntentId })
    } catch (error) {
      console.error('Error creating order after payment:', error)
      setPaymentProcessed(false)
      setPaymentIntentId(null)
      toast.error('Error al crear el pedido después del pago')
    }
  }

  const handlePaymentError = (error: string) => {
    toast.error(`Error de pago: ${error}`)
    setPaymentProcessed(false)
    setPaymentIntentId(null)
  }

  const createOrder = async (options?: { redirectAfterCreation?: boolean; isOxxoPending?: boolean; oxxoVoucherUrl?: string; paymentIntentId?: string }) => {
    setLoading(true)

    try {
      const orderData = {
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
        },
        shippingAddress: {
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
        items: cart.items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        shippingMethod: formData.shippingMethod,
        shippingCost: formData.shippingMethod === 'express' ? 50 : 20,
        paymentMethod: formData.paymentMethod,
        paymentStatus: options?.isOxxoPending ? 'pending' : paymentProcessed ? 'completed' : 'pending',
        paymentIntentId: options?.paymentIntentId || paymentIntentId || undefined,
        oxxoVoucherUrl: options?.oxxoVoucherUrl,
        subtotal: cart.totalPrice,
        total: cart.totalPrice + (formData.shippingMethod === 'express' ? 50 : 20),
      } as any

      const response = await orderAPI.create(orderData)
      await clearCart(true)

      if (options?.redirectAfterCreation === false) {
        return response.data
      }

      toast.success('Pedido creado exitosamente')
      const orderId = response.data.id || response.data._id
      navigate(`/order-confirmation/${orderId}`)
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Error creating order'
      console.error('Error creating order:', errorMessage)
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const validateDetailsStep = () => {
    const requiredFields = [
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.phone,
      formData.street,
      formData.number,
      formData.city,
      formData.state,
      formData.zipCode,
      formData.country,
    ]

    const hasMissingField = requiredFields.some((value) => !value.trim())

    if (hasMissingField) {
      toast.error('Completa tu información personal y la dirección antes de continuar')
      return false
    }

    return true
  }

  const handleContinueToPayment = () => {
    if (!validateDetailsStep()) {
      return
    }

    setCurrentStep('payment')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // If payment method is credit card and payment not processed yet, show payment form
    if (formData.paymentMethod === 'credit-card' && !paymentProcessed) {
      // The payment form will handle submission
      return
    }

    // If payment method is OXXO and payment not processed yet, show payment form
    if (formData.paymentMethod === 'oxxo' && !paymentProcessed) {
      // The OXXO payment form will handle submission
      return
    }

    // For other payment methods, create order directly
    if (formData.paymentMethod !== 'credit-card' && formData.paymentMethod !== 'oxxo') {
      createOrder()
    }
  }

  return (
    <div className="py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Continuar con la compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {/* Personal Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Información Personal</h2>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="firstName"
                  placeholder="Nombre"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="col-span-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Apellido"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="col-span-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Teléfono"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <input
                  type="text"
                  name="company"
                  placeholder="Empresa (opcional)"
                  value={formData.company}
                  onChange={handleChange}
                  className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Dirección de Envío</h2>

              {/* Address Selector for logged-in users */}
              {isLoggedIn && addresses.length > 0 && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona una dirección guardada
                  </label>
                  <select
                    value={selectedAddressId}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">-- Selecciona una dirección --</option>
                    {addresses.map((addr) => (
                      <option key={addr._id} value={addr._id}>
                        {addr.label.toUpperCase()} - {addr.street} {addr.number}
                        {addr.isDefault ? ' (Predeterminada)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="street"
                  placeholder="Calle"
                  value={formData.street}
                  onChange={handleChange}
                  required
                  className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <input
                  type="text"
                  name="number"
                  placeholder="Número"
                  value={formData.number}
                  onChange={handleChange}
                  required
                  className="col-span-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <input
                  type="text"
                  name="complement"
                  placeholder="Apto/Depto (opcional)"
                  value={formData.complement}
                  onChange={handleChange}
                  className="col-span-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <input
                  type="text"
                  name="city"
                  placeholder="Ciudad"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <input
                  type="text"
                  name="state"
                  placeholder="Provincia/Estado"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="col-span-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <input
                  type="text"
                  name="zipCode"
                  placeholder="Código Postal"
                  value={formData.zipCode}
                  onChange={handleChange}
                  required
                  className="col-span-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <input
                  type="text"
                  name="country"
                  placeholder="País"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            {/* Shipping Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Método de Envío</h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="standard"
                    checked={formData.shippingMethod === 'standard'}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="ml-3">
                    <span className="font-semibold">Envío Estándar</span>
                    <span className="text-gray-600 text-sm ml-2">5-7 días</span>
                    <span className="float-right font-semibold">$20</span>
                  </span>
                </label>
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="express"
                    checked={formData.shippingMethod === 'express'}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="ml-3">
                    <span className="font-semibold">Envío Express</span>
                    <span className="text-gray-600 text-sm ml-2">2-3 días</span>
                    <span className="float-right font-semibold">$50</span>
                  </span>
                </label>
              </div>
            </div>

            {currentStep === 'details' && (
              <div className="bg-white rounded-lg shadow-md p-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-600">Paso 1 de 2</p>
                  <p className="font-semibold text-gray-900">Información personal y envío</p>
                </div>
                <button
                  type="button"
                  onClick={handleContinueToPayment}
                  className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  Continuar al método de pago
                </button>
              </div>
            )}

            {currentStep === 'payment' && (
              <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Paso 2 de 2</p>
                    <h2 className="text-xl font-semibold">Método de Pago</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep('details')}
                    className="w-full sm:w-auto border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition"
                  >
                    Volver a datos
                  </button>
                </div>

                {!paymentProcessed && (
                  <>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="credit-card">Tarjeta de Crédito (Stripe)</option>
                      <option value="oxxo">OXXO (Efectivo)</option>
                    </select>
                    {formData.paymentMethod === 'oxxo' && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-900">
                        OXXO seleccionado. Debes ver el botón “Generar Código de Pago OXXO” abajo.
                      </div>
                    )}
                  </>
                )}

                {formData.paymentMethod === 'credit-card' && !paymentProcessed && (
                  <StripeProvider>
                    <StripePaymentForm
                      totalAmount={shippingCost + cart.totalPrice}
                      orderId="pending"
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                    />
                  </StripeProvider>
                )}

                {formData.paymentMethod === 'oxxo' && !paymentProcessed && (
                  <OXXOPaymentForm
                    totalAmount={shippingCost + cart.totalPrice}
                    email={formData.email}
                    name={`${formData.firstName} ${formData.lastName}`.trim()}
                    onPrepareOrder={async () => {
                      const pendingOrder = await createOrder({
                        redirectAfterCreation: false,
                        isOxxoPending: true,
                      })
                      return pendingOrder.orderNumber
                    }}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                )}

                {paymentProcessed && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 font-semibold">✓ Pago procesado correctamente</p>
                    <p className="text-sm text-green-600 mt-2">ID de transacción: {paymentIntentId}</p>
                  </div>
                )}

                {(paymentProcessed || (formData.paymentMethod !== 'credit-card' && formData.paymentMethod !== 'oxxo')) && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Procesando...' : 'Completar Pedido'}
                  </button>
                )}

                {formData.paymentMethod === 'credit-card' && !paymentProcessed && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <p className="text-blue-700 text-sm">Completa el pago con tu tarjeta arriba para continuar</p>
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20 w-full min-w-0">
              <h2 className="text-xl font-semibold mb-6">Resumen del Pedido</h2>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-600 min-w-0 break-words">
                      {item.product.name} x{item.quantity}
                    </span>
                    <span className="font-semibold shrink-0 whitespace-nowrap">
                      ${(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold shrink-0 whitespace-nowrap">${cart.totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">Envío</span>
                  <span className="font-semibold shrink-0 whitespace-nowrap">${shippingCost}</span>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between gap-3 text-lg font-bold">
                  <span>Total</span>
                  <span className="shrink-0 whitespace-nowrap">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
