import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { ordersApi } from '../../api/endpoints'
import { OrderDetailView } from '../../components/OrderView'
import { Alert, ErrorState, LoadingState } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { useOrder } from '../../hooks/queries'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

export function MyOrderDetailPage() {
  const id = Number(useParams().id)
  const order = useOrder(id)
  const queryClient = useQueryClient()
  const { notify } = useToast()
  useDocumentTitle(order.data ? `Pedido ${order.data.orderNumber}` : 'Pedido')

  const cancel = useMutation({
    mutationFn: () => ordersApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      notify('Pedido cancelado')
    },
  })

  const handleCancel = () => {
    if (window.confirm('¿Seguro que quieres cancelar este pedido?')) cancel.mutate()
  }

  return (
    <div className="container section">
      <Link to="/mi-cuenta/pedidos" className="link-arrow">
        ← Mis pedidos
      </Link>

      {order.isPending ? (
        <LoadingState />
      ) : order.isError ? (
        <ErrorState error={order.error} onRetry={() => order.refetch()} />
      ) : (
        <>
          {cancel.isError && <Alert>{cancel.error.message}</Alert>}
          <OrderDetailView order={order.data} />
          {order.data.status === 'Pending' && (
            <div className="order-actions">
              <p className="muted">Mientras el pedido esté pendiente puedes cancelarlo sin coste.</p>
              <button type="button" className="btn btn--danger" onClick={handleCancel} disabled={cancel.isPending}>
                {cancel.isPending ? 'Cancelando…' : 'Cancelar pedido'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
