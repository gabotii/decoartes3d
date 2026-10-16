import { Link } from 'react-router'
import { ProductImage } from '../components/ProductVisual'
import { QuantityInput } from '../components/QuantityInput'
import { EmptyState } from '../components/ui'
import { MAX_QUANTITY_PER_ITEM, useCart } from '../contexts/CartContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatPrice } from '../utils/format'

export function CartPage() {
  useDocumentTitle('Carrito')
  const { items, itemCount, subtotal, setQuantity, removeItem } = useCart()

  if (items.length === 0) {
    return (
      <div className="container section">
        <EmptyState
          title="Tu carrito está vacío"
          action={
            <Link to="/catalogo" className="btn">
              Descubrir el catálogo
            </Link>
          }
        >
          Cuando añadas piezas aparecerán aquí.
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="container cart">
      <header className="page-header">
        <h1 className="page-title">Tu carrito</h1>
      </header>

      <div className="cart__layout">
        <ul className="cart__items">
          {items.map((item) => (
            <li key={item.productId} className="cart-item">
              <Link to={`/producto/${item.slug}`} className="cart-item__media" tabIndex={-1} aria-hidden="true">
                <ProductImage src={item.imageUrl} alt="" seed={item.slug} className="cart-item__image" />
              </Link>
              <div className="cart-item__info">
                <Link to={`/producto/${item.slug}`} className="cart-item__name">
                  {item.name}
                </Link>
                <p className="muted">{formatPrice(item.price)} / unidad</p>
                <button type="button" className="link-button" onClick={() => removeItem(item.productId)}>
                  Eliminar
                </button>
              </div>
              <QuantityInput
                value={item.quantity}
                max={Math.min(item.stock, MAX_QUANTITY_PER_ITEM)}
                onChange={(quantity) => setQuantity(item.productId, quantity)}
                label={`Cantidad de ${item.name}`}
              />
              <p className="cart-item__total">{formatPrice(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>

        <aside className="summary">
          <h2 className="summary__title">Resumen</h2>
          <dl className="summary__rows">
            <div className="summary__row">
              <dt>Artículos</dt>
              <dd>{itemCount}</dd>
            </div>
            <div className="summary__row summary__row--total">
              <dt>Total</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
          </dl>
          <p className="summary__note">IVA incluido. El precio final se confirma con el catálogo al realizar el pedido.</p>
          <Link to="/checkout" className="btn btn--large btn--block">
            Tramitar pedido
          </Link>
          <Link to="/catalogo" className="link-arrow center">
            ← Seguir comprando
          </Link>
        </aside>
      </div>
    </div>
  )
}
