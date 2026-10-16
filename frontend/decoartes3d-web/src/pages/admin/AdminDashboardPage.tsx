import { useQueries, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ordersApi, productsApi } from '../../api/endpoints'
import { ErrorState, LoadingState, StatusBadge } from '../../components/ui'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type { OrderStatus } from '../../types/api'
import { formatDate, formatPrice, ORDER_STATUS_LABELS } from '../../utils/format'

const WATCHED_STATUSES: OrderStatus[] = ['Pending', 'Confirmed', 'InProduction', 'Shipped']
const LOW_STOCK = 5

export function AdminDashboardPage() {
  useDocumentTitle('Panel de administración')

  // totalCount de una página de tamaño 1 = número de pedidos en ese estado, sin endpoint de estadísticas.
  const statusCounts = useQueries({
    queries: WATCHED_STATUSES.map((status) => ({
      queryKey: ['admin', 'orders', { status, pageSize: 1 }],
      queryFn: () => ordersApi.list({ status, pageSize: 1 }),
    })),
  })

  const recent = useQuery({
    queryKey: ['admin', 'orders', { pageSize: 6 }],
    queryFn: () => ordersApi.list({ pageSize: 6 }),
  })

  const products = useQuery({
    queryKey: ['admin', 'products', 'stock-overview'],
    queryFn: () => productsApi.list({ pageSize: 100, isActive: true }),
  })

  const lowStock = products.data?.items.filter((p) => p.stockQuantity <= LOW_STOCK).sort((a, b) => a.stockQuantity - b.stockQuantity)

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">Resumen</h1>
      </header>

      <div className="stat-grid">
        {WATCHED_STATUSES.map((status, i) => (
          <Link key={status} to={`/admin/pedidos?estado=${status}`} className="stat">
            <span className="stat__label">{ORDER_STATUS_LABELS[status]}</span>
            <span className="stat__value">{statusCounts[i].data?.totalCount ?? '–'}</span>
          </Link>
        ))}
        <Link to="/admin/productos" className="stat">
          <span className="stat__label">Productos activos</span>
          <span className="stat__value">{products.data?.totalCount ?? '–'}</span>
        </Link>
      </div>

      <div className="admin-columns">
        <section className="panel">
          <div className="panel__header">
            <h2 className="panel__title">Últimos pedidos</h2>
            <Link to="/admin/pedidos" className="link-arrow">
              Ver todos →
            </Link>
          </div>
          {recent.isPending ? (
            <LoadingState />
          ) : recent.isError ? (
            <ErrorState error={recent.error} onRetry={() => recent.refetch()} />
          ) : recent.data.items.length === 0 ? (
            <p className="muted">Aún no hay pedidos.</p>
          ) : (
            <ul className="mini-list">
              {recent.data.items.map((order) => (
                <li key={order.id}>
                  <Link to={`/admin/pedidos/${order.id}`} className="mini-list__row">
                    <span>
                      <strong>{order.orderNumber}</strong>
                      <span className="muted"> · {order.customerName} · {formatDate(order.createdAt)}</span>
                    </span>
                    <span className="mini-list__end">
                      <StatusBadge status={order.status} />
                      {formatPrice(order.total)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel__header">
            <h2 className="panel__title">Stock bajo</h2>
          </div>
          {products.isPending ? (
            <LoadingState />
          ) : products.isError ? (
            <ErrorState error={products.error} onRetry={() => products.refetch()} />
          ) : !lowStock?.length ? (
            <p className="muted">Todos los productos activos tienen más de {LOW_STOCK} unidades.</p>
          ) : (
            <ul className="mini-list">
              {lowStock.map((product) => (
                <li key={product.id}>
                  <Link to={`/admin/productos/${product.id}`} className="mini-list__row">
                    <span>{product.name}</span>
                    <span className={`stock ${product.stockQuantity === 0 ? 'stock--out' : 'stock--low'}`}>
                      {product.stockQuantity} ud.
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
