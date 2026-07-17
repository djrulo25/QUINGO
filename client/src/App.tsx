import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom'
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
import AdminCategoriesPage from '@/pages/AdminCategoriesPage'
import AdminCategoryForm from '@/pages/AdminCategoryForm'
import AdminAttributeTemplatesPage from '@/pages/AdminAttributeTemplatesPage'
import AdminOrdersPage from '@/pages/AdminOrdersPage'
import AdminOrderDetail from '@/pages/AdminOrderDetail'
import CustomerLoginPage from '@/pages/CustomerLoginPage'
import CustomerRegisterPage from '@/pages/CustomerRegisterPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import CustomerProfilePage from '@/pages/CustomerProfilePage'
import OrderHistoryPage from '@/pages/OrderHistoryPage'
import ContactPage from '@/pages/ContactPage'
import InformationPage from '@/pages/InformationPage'
import AdminReportsPage from '@/pages/AdminReportsPage'
import { StoreSettingsProvider } from '@/store/StoreSettingsContext'
import AdminStoreSettingsPage from '@/pages/AdminStoreSettingsPage'
import AdminCatalogImportPage from '@/pages/AdminCatalogImportPage'

function App() {
  return (
    <Router>
      <StoreSettingsProvider>
      <Routes>
        {/* Admin Routes (without Layout) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Admin Routes (with AdminLayout) */}
        <Route
          path="/admin/*"
          element={
            <AdminLayout>
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="/dashboard" element={<AdminDashboard />} />
                <Route path="/products" element={<AdminProductsPage />} />
                <Route path="/products/new" element={<AdminProductForm />} />
                <Route path="/products/:id/edit" element={<AdminProductForm />} />
                <Route path="/categories" element={<AdminCategoriesPage />} />
                <Route path="/categories/new" element={<AdminCategoryForm />} />
                <Route path="/categories/:id/edit" element={<AdminCategoryForm />} />
                <Route path="/attributes" element={<AdminAttributeTemplatesPage />} />
                <Route path="/orders" element={<AdminOrdersPage />} />
                <Route path="/orders/:id" element={<AdminOrderDetail />} />
                <Route path="/reports" element={<AdminReportsPage />} />
                <Route path="/settings" element={<AdminStoreSettingsPage />} />
                <Route path="/settings/import" element={<AdminCatalogImportPage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
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
                <Route path="/contacto" element={<ContactPage />} />
                <Route path="/devoluciones" element={<InformationPage />} />
                <Route path="/facturacion" element={<InformationPage />} />
                <Route path="/privacidad" element={<InformationPage />} />
                <Route path="/terminos" element={<InformationPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
      <Toaster position="bottom-right" />
      </StoreSettingsProvider>
    </Router>
  )
}

export default App
