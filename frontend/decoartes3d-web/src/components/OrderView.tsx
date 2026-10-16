import { Link } from 'react-router'
import type { Order } from '../types/api'
import { formatDateTime, formatPrice, ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, slugify } from '../utils/format'
import { ProductImage } from './ProductVisual'
import { StatusBadge } from './ui'

export function OrderTimeline({ order }: { order: Order }) {
  if (order.status === 'Cancelled') {
    return <p className="timeline-cancelled">Este pedido está cancelado.</p>
  }

  const current = ORDER_STATUS_FLOW.indexOf(order.status)

  return (
    <ol className="timeline" aria-label="Estado del pedido">
      {ORDER_STATUS_FLOW.map((status, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'todo'
        return (
          <li key={status} className={`timeline__step timeline__step--${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="timeline__dot" aria-hidden="true" />
            <span className="timeline__label">{ORDER_STATUS_LABELS[status]}</span>
          </li>
        )
      })}
    </ol>
  )
}

export function OrderItemsTable({ order, linkProducts = false }: { order: Order; linkProducts?: boolean }) {
  return (
    <div className="order-lines">
      <ul className="order-lines__list">
        {order.items.map((item) => (
          <li key={item.id} className="order-line">
            <ProductImage src={item.productImageUrl} alt="" seed={slugify(item.productName)} className="order-line__thumb" />
            <div className="order-line__info">
              <p className="order-line__name">
                {linkProducts ? <Link to={`/admin/productos/${item.productId}`}>{item.productName}</Link> : item.productName}
              </p>
              <p className="order-line__meta">
                {item.quantity} × {formatPrice(item.unitPrice)}
              </p>
            </div>
            <p className="order-line__total">{formatPrice(item.subtotal)}</p>
          </li>
        ))}
      </ul>
      <div className="order-lines__total">
        <span>Total (IVA incluido)</span>
        <strong>{formatPrice(order.total)}</strong>
      </div>
    </div>
  )
}

export function ShippingAddress({ order }: { order: Order }) {
  return (
    <address className="address">
      <strong>
        {order.shippingFirstName} {order.shippingLastName}
      </strong>
      <br />
      {order.shippingAddress}
      <br />
      {order.shippingPostalCode} {order.shippingCity} ({order.shippingState})
      <br />
      {order.shippingCountry}
      <br />
      {order.shippingEmail}
      {order.shippingPhone && (
        <>
          <br />
          {order.shippingPhone}
        </>
      )}
    </address>
  )
}

/** Vista completa de un pedido para clientes (confirmación, seguimiento, mi cuenta). */
export function OrderDetailView({ order }: { order: Order }) {
  return (
    <div className="order-detail">
      <header className="order-detail__header">
        <div>
          <p className="eyebrow">Pedido</p>
          <h2 className="order-detail__number">{order.orderNumber}</h2>
          <p className="muted">Realizado el {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      <OrderTimeline order={order} />

      <div className="order-detail__grid">
        <section className="panel">
          <h3 className="panel__title">Artículos</h3>
          <OrderItemsTable order={order} />
        </section>
        <section className="panel">
          <h3 className="panel__title">Envío</h3>
          <ShippingAddress order={order} />
          {order.notes && (
            <>
              <h4 className="panel__subtitle">Notas</h4>
              <p className="muted">{order.notes}</p>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
