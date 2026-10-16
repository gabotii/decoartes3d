import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { ordersApi } from '../../api/endpoints'
import { Pagination } from '../../components/Pagination'
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '../../components/ui'
import { queryKeys } from '../../hooks/queries'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type { OrderStatus } from '../../types/api'
import { formatDateTime, formatPrice, ORDER_STATUS_LABELS } from '../../utils/format'

const PAGE_SIZE = 20
const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]

export function AdminOrdersPage() {
  useDocumentTitle('Pedidos')
  const [params, setParams] = useSearchParams()
  const statusParam = params.get('estado') as OrderStatus | null
  const status = statusParam && STATUSES.includes(statusParam) ? statusParam : undefined
  const page = Math.max(1, Number(params.get('pagina')) || 1)

  const query = { pageNumber: page, pageSize: PAGE_SIZE, status }
  const orders = useQuery({
    queryKey: queryKeys.adminOrders(query),
    queryFn: () => ordersApi.list(query),
    placeholderData: keepPreviousData,
  })

  const setFilter = (next: { estado?: string; pagina?: number }) => {
    const search = new URLSearchParams()
    const estado = 'estado' in next ? next.estado : status
    if (estado) search.set('estado', estado)
    if (next.pagina && next.pagina > 1) search.set('pagina', String(next.pagina))
    setParams(search)
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">Pedidos</h1>
      </header>

      <div className="tabs" role="tablist" aria-label="Filtrar por estado">
        <button type="button" role="tab" className="tabs__tab" aria-selected={!status} onClick={() => setFilter({ estado: undefined })}>
          Todos
        </button>
        {STATUSES.map((s) => (
          <button key={s} type="button" role="tab" className="tabs__tab" aria-selected={status === s} onClick={() => setFilter({ estado: s })}>
            {ORDER_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {orders.isPending ? (
        <LoadingState />
      ) : orders.isError ? (
        <ErrorState error={orders.error} onRetry={() => orders.refetch()} />
      ) : orders.data.items.length === 0 ? (
        <EmptyState title="No hay pedidos con este filtro" />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Pedido</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">Fecha</th>
                  <th scope="col" className="num">Artículos</th>
                  <th scope="col" className="num">Total</th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {orders.data.items.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link to={`/admin/pedidos/${order.id}`} className="table__link">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td>
                      {order.customerName}
                      <span className="table__sub">{order.shippingEmail}</span>
                    </td>
                    <td>{formatDateTime(order.createdAt)}</td>
                    <td className="num">{order.itemCount}</td>
                    <td className="num">{formatPrice(order.total)}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={orders.data.pageNumber} totalPages={orders.data.totalPages} onChange={(p) => setFilter({ pagina: p })} />
        </>
      )}
    </div>
  )
}
