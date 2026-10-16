import { createBrowserRouter, Navigate, Outlet } from 'react-router'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminLayout } from './layouts/AdminLayout'
import { MainLayout } from './layouts/MainLayout'
import { MyOrderDetailPage } from './pages/account/MyOrderDetailPage'
import { MyOrdersPage } from './pages/account/MyOrdersPage'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { CartPage } from './pages/CartPage'
import { CatalogPage } from './pages/CatalogPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage, RouteErrorPage } from './pages/NotFoundPage'
import { OrderConfirmationPage } from './pages/OrderConfirmationPage'
import { ProductPage } from './pages/ProductPage'
import { TrackOrderPage } from './pages/TrackOrderPage'

// El panel de administración se carga bajo demanda: los clientes nunca descargan ese código.
const admin = {
  dashboard: async () => ({ Component: (await import('./pages/admin/AdminDashboardPage')).AdminDashboardPage }),
  orders: async () => ({ Component: (await import('./pages/admin/AdminOrdersPage')).AdminOrdersPage }),
  order: async () => ({ Component: (await import('./pages/admin/AdminOrderDetailPage')).AdminOrderDetailPage }),
  products: async () => ({ Component: (await import('./pages/admin/AdminProductsPage')).AdminProductsPage }),
  product: async () => ({ Component: (await import('./pages/admin/AdminProductFormPage')).AdminProductFormPage }),
  categories: async () => ({ Component: (await import('./pages/admin/AdminCategoriesPage')).AdminCategoriesPage }),
  materials: async () => ({ Component: (await import('./pages/admin/AdminMaterialsPage')).AdminMaterialsPage }),
}

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'catalogo', element: <CatalogPage /> },
      { path: 'producto/:slug', element: <ProductPage /> },
      { path: 'carrito', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'pedido-confirmado/:orderNumber', element: <OrderConfirmationPage /> },
      { path: 'seguimiento', element: <TrackOrderPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'registro', element: <RegisterPage /> },
      {
        path: 'mi-cuenta',
        element: (
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="pedidos" replace /> },
          { path: 'pedidos', element: <MyOrdersPage /> },
          { path: 'pedidos/:id', element: <MyOrderDetailPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: 'admin',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, lazy: admin.dashboard },
      { path: 'pedidos', lazy: admin.orders },
      { path: 'pedidos/:id', lazy: admin.order },
      { path: 'productos', lazy: admin.products },
      { path: 'productos/:id', lazy: admin.product },
      { path: 'categorias', lazy: admin.categories },
      { path: 'materiales', lazy: admin.materials },
    ],
  },
])
