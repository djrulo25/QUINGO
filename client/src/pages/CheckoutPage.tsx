import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'
import { useCustomerStore } from '@/store/customerStore'
import { customerAPI, orderAPI } from '@/api'
import { IAddress } from '@/types/customer'
import { StripeProvider } from '@/components/StripeProvider'
import { StripePaymentForm } from '@/components/StripePaymentForm'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { cart, clearCart } = useCartStore()
  const { customer, isLoggedIn } = useCustomerStore()
  const [loading, setLoading] = useState(false)
  const [addresses, setAddresses] = useState<IAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
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
  const tax = cart.totalPrice * 0.1
  const total = cart.totalPrice + shippingCost + tax

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePaymentSuccess = async (paymentId: string) => {
    setPaymentIntentId(paymentId)
    setPaymentProcessed(true)
    toast.success('Pago procesado exitosamente')
    
    // Create order after payment is successful
    try {
      await createOrder()
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

  const createOrder = async () => {
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
        items: cart.items,
        shippingMethod: formData.shippingMethod,
        shippingCost: formData.shippingMethod === 'express' ? 50 : 20,
        paymentMethod: formData.paymentMethod,
        paymentStatus: paymentProcessed ? 'completed' : 'pending',
        paymentIntentId: paymentIntentId || undefined,
        subtotal: cart.totalPrice,
        tax: cart.totalPrice * 0.1,
        total: cart.totalPrice + (formData.shippingMethod === 'express' ? 50 : 20) + (cart.totalPrice * 0.1),
      } as any

      const response = await orderAPI.create(orderData)
      clearCart()
      toast.success('Pedido creado exitosamente')
      navigate(`/order-confirmation/${response.data.id}`)
    } catch (error) {
      console.error('Error creating order:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // If payment method is credit card and payment not processed yet, show payment form
    if (formData.paymentMethod === 'credit-card' && !paymentProcessed) {
      // The payment form will handle submission
      return
    }

    // For other payment methods, create order directly
    if (formData.paymentMethod !== 'credit-card') {
      createOrder()
    }
  }

  return (
    <div className="py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

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

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Método de Pago</h2>
              
              {/* Payment Method Selection */}
              {!paymentProcessed && (
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 mb-4"
                >
                  <option value="credit-card">Tarjeta de Crédito (Stripe)</option>
                  <option value="debit-card">Tarjeta de Débito</option>
                  <option value="bank-transfer">Transferencia Bancaria</option>
                </select>
              )}

              {/* Stripe Payment Form - Only for credit card method */}
              {formData.paymentMethod === 'credit-card' && !paymentProcessed && (
                <StripeProvider>
                  <StripePaymentForm
                    totalAmount={shippingCost + cart.totalPrice + tax}
                    orderId="pending"
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                </StripeProvider>
              )}

              {/* Payment Processed Indicator */}
              {paymentProcessed && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-semibold">✓ Pago procesado correctamente</p>
                  <p className="text-sm text-green-600 mt-2">ID de transacción: {paymentIntentId}</p>
                </div>
              )}
            </div>

            {/* Submit Button - Only show for non-credit-card methods or after payment */}
            {(formData.paymentMethod !== 'credit-card' || paymentProcessed) && (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Procesando...' : 'Completar Pedido'}
              </button>
            )}

            {/* Info message for credit card */}
            {formData.paymentMethod === 'credit-card' && !paymentProcessed && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p className="text-blue-700 text-sm">Completa el pago con tu tarjeta arriba para continuar</p>
              </div>
            )}
          </form>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h2 className="text-xl font-semibold mb-6">Resumen del Pedido</h2>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product.name} x{item.quantity}
                    </span>
                    <span className="font-semibold">
                      ${(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">${cart.totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Envío</span>
                  <span className="font-semibold">${shippingCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Impuestos (10%)</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
