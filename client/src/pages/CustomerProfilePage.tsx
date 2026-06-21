import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomerStore } from '@/store/customerStore'
import { customerAPI } from '@/api/customerApi'
import { IAddress } from '@/types/customer'
import AddressForm from '@/components/AddressForm'
import toast from 'react-hot-toast'

export default function CustomerProfilePage() {
  const navigate = useNavigate()
  const { customer, token, logout, updateProfile } = useCustomerStore()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [addresses, setAddresses] = useState<IAddress[]>([])
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<IAddress | null>(null)

  const [formData, setFormData] = useState({
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    phone: customer?.phone || '',
    company: customer?.company || '',
    dateOfBirth: customer?.dateOfBirth ? customer.dateOfBirth.split('T')[0] : '',
  })

  useEffect(() => {
    if (!token) {
      navigate('/customer/login')
      return
    }

    fetchAddresses()
  }, [token, navigate])

  const fetchAddresses = async () => {
    try {
      const response = await customerAPI.getAddresses()
      setAddresses(response.data)
    } catch (error: any) {
      console.error('Error fetching addresses:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updateProfile(formData)
      toast.success('Perfil actualizado')
      setEditing(false)
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta dirección?')) return

    try {
      await customerAPI.deleteAddress(addressId)
      toast.success('Dirección eliminada')
      fetchAddresses()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar dirección')
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      await customerAPI.setDefaultAddress(addressId)
      toast.success('Dirección predeterminada actualizada')
      fetchAddresses()
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar dirección')
    }
  }

  const handleAddressSuccess = () => {
    fetchAddresses()
    setShowAddressForm(false)
    setEditingAddress(null)
  }

  if (!customer) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Mi Cuenta</h1>
            <button
              onClick={() => {
                logout()
                navigate('/')
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              Cerrar Sesión
            </button>
          </div>

          {/* Profile Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Información Personal</h2>
              <button
                onClick={() => setEditing(!editing)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                {editing ? 'Cancelar' : 'Editar'}
              </button>
            </div>

            {editing ? (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Empresa
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition"
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="text-gray-800 font-medium">{customer.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Apellido</p>
                    <p className="text-gray-800 font-medium">{customer.lastName}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Correo Electrónico</p>
                  <p className="text-gray-800 font-medium">{customer.email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="text-gray-800 font-medium">{customer.phone}</p>
                </div>

                {customer.company && (
                  <div>
                    <p className="text-sm text-gray-600">Empresa</p>
                    <p className="text-gray-800 font-medium">{customer.company}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Addresses Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Mis Direcciones</h2>
              {!showAddressForm && !editingAddress && (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                >
                  + Agregar Dirección
                </button>
              )}
            </div>

            {showAddressForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-4">Nueva Dirección</h3>
                <AddressForm
                  onSuccess={handleAddressSuccess}
                  onCancel={() => setShowAddressForm(false)}
                />
              </div>
            )}

            {editingAddress && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-4">Editar Dirección</h3>
                <AddressForm
                  address={editingAddress}
                  onSuccess={handleAddressSuccess}
                  onCancel={() => setEditingAddress(null)}
                />
              </div>
            )}

            {addresses.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No hay direcciones registradas</p>
            ) : (
              <div className="space-y-4">
                {addresses.map((addr) => (
                  <div key={addr._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">
                            {addr.label === 'home' ? '🏠' : addr.label === 'work' ? '💼' : '📍'} {addr.label.toUpperCase()}
                          </h3>
                          {addr.isDefault && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Predeterminada
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{addr.firstName} {addr.lastName}</p>
                      </div>

                      <div className="flex gap-2">
                        {!addr.isDefault && (
                          <button
                            onClick={() => handleSetDefault(addr._id!)}
                            className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded transition"
                          >
                            Hacer Predeterminada
                          </button>
                        )}
                        <button
                          onClick={() => setEditingAddress(addr)}
                          className="text-sm px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr._id!)}
                          className="text-sm px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p>{addr.street} {addr.number} {addr.complement}</p>
                      <p>{addr.city}, {addr.state} {addr.zipCode}</p>
                      <p>{addr.country}</p>
                      <p className="mt-1">📞 {addr.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
  )
}
