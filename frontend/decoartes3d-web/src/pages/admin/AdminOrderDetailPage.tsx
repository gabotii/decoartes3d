import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { ordersApi } from '../../api/endpoints'
import { OrderItemsTable, OrderTimeline, ShippingAddress } from '../../components/OrderView'
import { Alert, ErrorState, LoadingState, StatusBadge } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { queryKeys, useOrder } from '../../hooks/queries'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type { OrderStatus } from '../../types/api'
import { formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_TRANSITIONS } from '../../utils/format'

const ACTION_LABELS: Record<OrderStatus, string> = {
  Pending: 'Marcar pendiente',
  Confirmed: 'Confirmar pedido',
  InProduction: 'Pasar a producción',
  Shipped: 'Marcar como enviado',
  Delivered: 'Marcar como entregado',
  Cancelled: 'Cancelar pedido',
}

export function AdminOrderDetailPage() {
  const id = Number(useParams().id)
  const order = useOrder(id)
  const queryClient = useQueryClient()
  const { notify } = useToast()
  useDocumentTitle(order.data ? `Pedido ${order.data.orderNumber}` : 'Pedido')

  const updateStatus = useMutation({
    mutationFn: (status: OrderStatus) => ordersApi.updateStatus(id, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.order(id), updated)
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      if (updated.status === 'Cancelled') queryClient.invalidateQueries({ queryKey: ['products'] })
      notify(`Pedido ${updated.orderNumber}: ${ORDER_STATUS_LABELS[updated.status].toLowerCase()}`)
    },
  })

  const handleStatus = (status: OrderStatus) => {
    if (status === 'Cancelled' && !window.confirm('¿Cancelar el pedido? Se repondrá el stock de sus productos.')) return
    updateStatus.mutate(status)
  }

  if (order.isPending) return <LoadingState />
  if (order.isError) return <ErrorState error={order.error} onRetry={() => order.refetch()} />

  const o = order.data
  const nextStatuses = ORDER_STATUS_TRANSITIONS[o.status]

  return (
    <div className="admin-page">
      <Link to="/admin/pedidos" className="link-arrow">
        ← Pedidos
      </Link>
      <header className="admin-page__header">
        <div>
          <h1 className="admin-page__title">{o.orderNumber}</h1>
          <p className="muted">
            {formatDateTime(o.createdAt)} · actualizado {formatDateTime(o.updatedAt)}
          </p>
        </div>
        <StatusBadge status={o.status} />
      </header>

      <OrderTimeline order={o} />

      {updateStatus.isError && <Alert>{updateStatus.error.message}</Alert>}

      {nextStatuses.length > 0 && (
        <div className="order-actions">
          {nextStatuses.map((status) => (
            <button
              key={status}
              type="button"
              className={`btn ${status === 'Cancelled' ? 'btn--danger' : ''}`}
              disabled={updateStatus.isPending}
              onClick={() => handleStatus(status)}
            >
              {ACTION_LABELS[status]}
            </button>
          ))}
        </div>
      )}

      <div className="admin-columns">
        <section className="panel">
          <h2 className="panel__title">Artículos</h2>
          <OrderItemsTable order={o} linkProducts />
        </section>
        <section className="panel">
          <h2 className="panel__title">Cliente</h2>
          <p>
            {o.userId ? (
              <>
                Cliente registrado: <strong>{o.customerName}</strong>
              </>
            ) : (
              'Compra como invitado'
            )}
          </p>
          <h3 className="panel__subtitle">Envío</h3>
          <ShippingAddress order={o} />
          {o.notes && (
            <>
              <h3 className="panel__subtitle">Notas del cliente</h3>
              <p className="note">{o.notes}</p>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
