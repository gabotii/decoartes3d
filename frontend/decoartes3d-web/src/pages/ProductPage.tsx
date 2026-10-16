import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ProductImage } from '../components/ProductVisual'
import { QuantityInput } from '../components/QuantityInput'
import { ErrorState, LoadingState } from '../components/ui'
import { MAX_QUANTITY_PER_ITEM, useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { useCategories, useProduct } from '../hooks/queries'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatDimensions, formatPrice } from '../utils/format'

const LOW_STOCK_THRESHOLD = 5

export function ProductPage() {
  const { slug = '' } = useParams()
  const product = useProduct(slug)
  const categories = useCategories()
  const { addItem, quantityOf } = useCart()
  const { notify } = useToast()
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState<string | null>(null)

  // Al navegar de un producto a otro el componente se reutiliza: reinicia su estado local.
  const [shownSlug, setShownSlug] = useState(slug)
  if (slug !== shownSlug) {
    setShownSlug(slug)
    setActiveImage(null)
    setQuantity(1)
  }

  useDocumentTitle(product.data?.name)

  if (product.isPending) return <LoadingState />
  if (product.isError)
    return (
      <div className="container section">
        <ErrorState error={product.error} onRetry={() => product.refetch()} />
        <p className="center">
          <Link to="/catalogo" className="link-arrow">
            ← Volver al catálogo
          </Link>
        </p>
      </div>
    )

  const p = product.data
  const inCart = quantityOf(p.id)
  const available = Math.max(0, Math.min(p.stockQuantity, MAX_QUANTITY_PER_ITEM) - inCart)
  const gallery = [p.mainImageUrl, ...p.images.map((i) => i.url)].filter((url): url is string => Boolean(url))
  const shownImage = activeImage ?? gallery[0] ?? null
  const dimensions = formatDimensions(p.width, p.height, p.depth)
  const categorySlug = categories.data?.find((c) => c.id === p.categoryId)?.slug

  const handleAdd = () => {
    addItem(p, quantity)
    notify(`${quantity} × «${p.name}» añadido al carrito`)
    setQuantity(1)
  }

  return (
    <div className="container product-page">
      <nav className="breadcrumb" aria-label="Migas de pan">
        <Link to="/catalogo">Catálogo</Link>
        <span aria-hidden="true">/</span>
        {categorySlug ? <Link to={`/catalogo?categoria=${categorySlug}`}>{p.categoryName}</Link> : <span>{p.categoryName}</span>}
        <span aria-hidden="true">/</span>
        <span aria-current="page">{p.name}</span>
      </nav>

      <div className="product-page__layout">
        <div className="gallery">
          <div className="gallery__main">
            <ProductImage src={shownImage} alt={p.name} seed={p.slug} className="gallery__image" />
          </div>
          {gallery.length > 1 && (
            <div className="gallery__thumbs">
              {gallery.map((url) => (
                <button
                  key={url}
                  type="button"
                  className="gallery__thumb"
                  aria-pressed={url === shownImage}
                  onClick={() => setActiveImage(url)}
                >
                  <img src={url} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <p className="eyebrow">{p.categoryName}</p>
          <h1 className="product-info__title">{p.name}</h1>
          {p.shortDescription && <p className="product-info__lead">{p.shortDescription}</p>}
          <p className="product-info__price">{formatPrice(p.price)}</p>

          {p.stockQuantity <= 0 ? (
            <p className="stock stock--out">Agotado temporalmente</p>
          ) : p.stockQuantity <= LOW_STOCK_THRESHOLD ? (
            <p className="stock stock--low">¡Solo quedan {p.stockQuantity}!</p>
          ) : (
            <p className="stock stock--ok">Disponible</p>
          )}

          {p.stockQuantity > 0 && (
            <div className="buy-box">
              {available > 0 ? (
                <>
                  <QuantityInput value={Math.min(quantity, available)} max={available} onChange={setQuantity} />
                  <button type="button" className="btn btn--large" onClick={handleAdd}>
                    Añadir al carrito
                  </button>
                </>
              ) : (
                <p className="muted">Ya tienes en el carrito todas las unidades disponibles.</p>
              )}
              {inCart > 0 && (
                <Link to="/carrito" className="link-arrow">
                  {inCart} en tu carrito · Ver carrito →
                </Link>
              )}
            </div>
          )}

          <dl className="specs">
            {p.materialName && (
              <div className="specs__row">
                <dt>Material</dt>
                <dd>
                  {p.materialColorHex && <span className="swatch" style={{ background: p.materialColorHex }} aria-hidden="true" />}
                  {p.materialName}
                </dd>
              </div>
            )}
            {dimensions && (
              <div className="specs__row">
                <dt>Medidas (an × al × fo)</dt>
                <dd>{dimensions}</dd>
              </div>
            )}
            {p.weightGrams && (
              <div className="specs__row">
                <dt>Peso</dt>
                <dd>{p.weightGrams.toLocaleString('es-ES')} g</dd>
              </div>
            )}
          </dl>

          {p.description && (
            <div className="prose">
              <h2 className="prose__title">Descripción</h2>
              {p.description.split(/\n{2,}/).map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
