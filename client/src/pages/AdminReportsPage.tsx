import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_BASE_URL } from '@/api/config'

export default function AdminReportsPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<any[]>([])
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) { navigate('/admin/login'); return }
    axios.get(`${API_BASE_URL}/orders`, { headers: { Authorization: `Bearer ${token}` } }).then(({ data }) => setOrders(data)).catch(() => setOrders([]))
  }, [navigate])
  const summary = useMemo(() => ({
    total: orders.length,
    paid: orders.filter((order) => order.paymentStatus === 'completed').length,
    pending: orders.filter((order) => order.status === 'pending').length,
    revenue: orders.filter((order) => order.paymentStatus === 'completed').reduce((sum, order) => sum + Number(order.total || 0), 0),
  }), [orders])
  return <div><h1 className="text-2xl font-bold text-gray-900">Reportes</h1><p className="mt-1 text-gray-600">Resumen de pedidos registrados.</p><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
    ['Pedidos', summary.total], ['Pagados', summary.paid], ['Pendientes', summary.pending], ['Ingresos confirmados', `$${summary.revenue.toLocaleString()}`],
  ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-gray-500">{label}</p><p className="mt-2 text-3xl font-bold text-blue-950">{value}</p></div>)}</div></div>
}
