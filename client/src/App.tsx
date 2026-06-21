import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from '@/components/Layout'
import AdminLayout from '@/components/AdminLayout'
import HomePage from '@/pages/HomePage'
import ProductsPage from '@/pages/ProductsPage'
import ProductDetailPage from '@/pages/ProductDetailPage'
import CartPage from '@/pages/CartPage'
import CheckoutPage from '@/pages/CheckoutPage'
import OrderConfirmationPage from '@/pages/OrderConfirmationPage'
import NotFoundPage from '@/pages/NotFoundPage'
import AdminLoginPage from '@/pages/AdminLoginPage'
import AdminDashboard from '@/pages/AdminDashboard'
import AdminProductsPage from '@/pages/AdminProductsPage'
import AdminProductForm from '@/pages/AdminProductForm'
import AdminOrdersPage from '@/pages/AdminOrdersPage'
import AdminOrderDetail from '@/pages/AdminOrderDetail'
import CustomerLoginPage from '@/pages/CustomerLoginPage'
import CustomerRegisterPage from '@/pages/CustomerRegisterPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import CustomerProfilePage from '@/pages/CustomerProfilePage'
import OrderHistoryPage from '@/pages/OrderHistoryPage'

function App() {
  return (
    <Router>
      <Routes>
        {/* Admin Routes (without Layout) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Admin Routes (with AdminLayout) */}
        <Route
          path="/admin/*"
          element={
            <AdminLayout>
              <Routes>
                <Route path="/dashboard" element={<AdminDashboard />} />
                <Route path="/products" element={<AdminProductsPage />} />
                <Route path="/products/new" element={<AdminProductForm />} />
                <Route path="/products/:id/edit" element={<AdminProductForm />} />
                <Route path="/orders" element={<AdminOrdersPage />} />
                <Route path="/orders/:id" element={<AdminOrderDetail />} />
              </Routes>
            </AdminLayout>
          }
        />

        {/* Public Routes (with Layout) */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/customer/login" element={<CustomerLoginPage />} />
                <Route path="/customer/register" element={<CustomerRegisterPage />} />
                <Route path="/customer/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/customer/reset-password" element={<ResetPasswordPage />} />
                <Route path="/customer/profile" element={<CustomerProfilePage />} />
                <Route path="/customer/orders" element={<OrderHistoryPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
      <Toaster position="bottom-right" />
    </Router>
  )
}

export default App
