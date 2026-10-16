import { Link } from 'react-router'
import { ProductGrid } from '../components/ProductCard'
import { ProductVisual } from '../components/ProductVisual'
import { ErrorState, LoadingState } from '../components/ui'
import { useCategories, useFeaturedProducts } from '../hooks/queries'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const PROMISES = [
  { title: 'Diseño propio', text: 'Cada pieza nace en nuestro estudio: formas paramétricas, orgánicas y geométricas.' },
  { title: 'Impreso bajo pedido', text: 'Fabricamos tu pieza cuando la pides, capa a capa, sin stock olvidado en almacenes.' },
  { title: 'Acabado a mano', text: 'Revisamos, lijamos y preparamos cada pieza antes de enviarla.' },
]

export function HomePage() {
  useDocumentTitle()
  // 4 = una fila completa en escritorio.
  const featured = useFeaturedProducts(4)
  const categories = useCategories()

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__copy">
            <p className="eyebrow">Decoración impresa en 3D</p>
            <h1 className="hero__title">Objetos con forma propia para tu casa</h1>
            <p className="hero__text">
              Jarrones, lámparas, esculturas y arte mural diseñados en nuestro estudio e impresos capa a capa en materiales
              seleccionados.
            </p>
            <div className="hero__actions">
              <Link to="/catalogo" className="btn btn--large">
                Ver catálogo
              </Link>
              <Link to="/catalogo?destacados=1" className="btn btn--ghost btn--large">
                Piezas destacadas
              </Link>
            </div>
          </div>
          <div className="hero__art" aria-hidden="true">
            <ProductVisual seed="jarron-espiral-voronoi" className="hero__tile hero__tile--a" />
            <ProductVisual seed="lampara-luna-texturizada" className="hero__tile hero__tile--b" />
            <ProductVisual seed="busto-clasico-minimal" className="hero__tile hero__tile--c" />
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section__header">
          <h2 className="section__title">Explora por categoría</h2>
        </div>
        {categories.isPending ? (
          <LoadingState />
        ) : categories.isError ? (
          <ErrorState error={categories.error} onRetry={() => categories.refetch()} />
        ) : (
          <div className="category-grid">
            {categories.data.map((category) => (
              <Link key={category.id} to={`/catalogo?categoria=${category.slug}`} className="category-card">
                <ProductVisual seed={category.slug} className="category-card__art" />
                <span className="category-card__body">
                  <span className="category-card__name">{category.name}</span>
                  <span className="category-card__count">
                    {category.productCount} {category.productCount === 1 ? 'pieza' : 'piezas'}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="section container">
        <div className="section__header">
          <h2 className="section__title">Destacados</h2>
          <Link to="/catalogo" className="link-arrow">
            Todo el catálogo →
          </Link>
        </div>
        {featured.isPending ? (
          <LoadingState />
        ) : featured.isError ? (
          <ErrorState error={featured.error} onRetry={() => featured.refetch()} />
        ) : (
          <ProductGrid products={featured.data} />
        )}
      </section>

      <section className="section section--tinted">
        <div className="container promises">
          {PROMISES.map((promise) => (
            <div key={promise.title} className="promise">
              <h3 className="promise__title">{promise.title}</h3>
              <p className="promise__text">{promise.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
