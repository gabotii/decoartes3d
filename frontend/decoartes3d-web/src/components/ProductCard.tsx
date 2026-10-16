import { Link } from 'react-router'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import type { ProductSummary } from '../types/api'
import { formatPrice } from '../utils/format'
import { ProductImage } from './ProductVisual'

export function ProductCard({ product }: { product: ProductSummary }) {
  const { addItem, quantityOf } = useCart()
  const { notify } = useToast()
  const soldOut = product.stockQuantity <= 0
  const maxedOut = quantityOf(product.id) >= product.stockQuantity

  const handleAdd = () => {
    addItem(product)
    notify(`«${product.name}» añadido al carrito`)
  }

  return (
    <article className="product-card">
      <Link to={`/producto/${product.slug}`} className="product-card__media" tabIndex={-1} aria-hidden="true">
        <ProductImage src={product.mainImageUrl} alt="" seed={product.slug} className="product-card__image" />
        {product.isFeatured && <span className="product-card__tag">Destacado</span>}
      </Link>
      <div className="product-card__body">
        <p className="product-card__meta">
          {product.categoryName}
          {product.materialName && <> · {product.materialName}</>}
        </p>
        <h3 className="product-card__title">
          <Link to={`/producto/${product.slug}`}>{product.name}</Link>
        </h3>
        {product.shortDescription && <p className="product-card__summary">{product.shortDescription}</p>}
        <div className="product-card__footer">
          <span className="price">{formatPrice(product.price)}</span>
          {soldOut ? (
            <span className="stock stock--out">Agotado</span>
          ) : (
            <button
              type="button"
              className="btn btn--small"
              onClick={handleAdd}
              disabled={maxedOut}
              title={maxedOut ? 'Ya tienes en el carrito todo el stock disponible' : undefined}
            >
              Añadir
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
