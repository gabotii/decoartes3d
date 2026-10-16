import { Link, Navigate, useLocation, useParams } from 'react-router'
import { OrderDetailView } from '../components/OrderView'
import { useAuth } from '../contexts/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { Order } from '../types/api'

export function OrderConfirmationPage() {
  useDocumentTitle('Pedido confirmado')
  const { orderNumber = '' } = useParams()
  const { isAuthenticated } = useAuth()
  const order = (useLocation().state as { order?: Order } | null)?.order

  // Sin el pedido en memoria (p. ej. al recargar), el seguimiento lo recupera con número + email.
  if (!order || order.orderNumber !== orderNumber) {
    return <Navigate to={`/seguimiento?numero=${encodeURIComponent(orderNumber)}`} replace />
  }

  return (
    <div className="container section confirmation">
      <div className="confirmation__hero">
        <span className="confirmation__icon" aria-hidden="true">
          ✓
        </span>
        <h1 className="page-title">¡Gracias por tu pedido!</h1>
        <p className="page-lead">
          Hemos recibido tu pedido <strong>{order.orderNumber}</strong>. Te escribiremos a <strong>{order.shippingEmail}</strong>{' '}
          para confirmarlo y empezar a imprimirlo.
        </p>
        <p className="muted">Guarda el número de pedido: con él y tu email puedes consultar el estado cuando quieras.</p>
      </div>

      <OrderDetailView order={order} />

      <div className="confirmation__actions">
        {isAuthenticated ? (
          <Link to="/mi-cuenta/pedidos" className="btn btn--secondary">
            Ver mis pedidos
          </Link>
        ) : (
          <Link to={`/seguimiento?numero=${order.orderNumber}`} className="btn btn--secondary">
            Seguir este pedido
          </Link>
        )}
        <Link to="/catalogo" className="btn">
          Seguir comprando
        </Link>
      </div>
    </div>
  )
}
