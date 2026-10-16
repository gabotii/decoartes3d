import { Link } from 'react-router'
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useMyOrders } from '../../hooks/queries'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { formatDate, formatPrice } from '../../utils/format'

export function MyOrdersPage() {
  useDocumentTitle('Mis pedidos')
  const { user } = useAuth()
  const orders = useMyOrders()

  return (
    <div className="container section">
      <header className="page-header">
        <p className="eyebrow">Mi cuenta</p>
        <h1 className="page-title">Hola, {user?.firstName}</h1>
        <p className="page-lead">Aquí tienes el historial de tus pedidos.</p>
      </header>

      {orders.isPending ? (
        <LoadingState />
      ) : orders.isError ? (
        <ErrorState error={orders.error} onRetry={() => orders.refetch()} />
      ) : orders.data.length === 0 ? (
        <EmptyState
          title="Todavía no has hecho ningún pedido"
          action={
            <Link to="/catalogo" className="btn">
              Ir al catálogo
            </Link>
          }
        />
      ) : (
        <ul className="order-cards">
          {orders.data.map((order) => (
            <li key={order.id}>
              <Link to={`/mi-cuenta/pedidos/${order.id}`} className="order-card">
                <span className="order-card__number">{order.orderNumber}</span>
                <span className="muted">{formatDate(order.createdAt)}</span>
                <span className="muted">
                  {order.itemCount} {order.itemCount === 1 ? 'artículo' : 'artículos'}
                </span>
                <StatusBadge status={order.status} />
                <span className="order-card__total">{formatPrice(order.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
