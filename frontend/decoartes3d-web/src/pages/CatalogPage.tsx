import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { Pagination } from '../components/Pagination'
import { ProductGrid } from '../components/ProductCard'
import { EmptyState, ErrorState, LoadingState } from '../components/ui'
import { useCategories, useMaterials, useProducts } from '../hooks/queries'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const PAGE_SIZE = 12

/**
 * Los filtros viven en la URL (?categoria=lamparas&material=2&q=luna&pagina=2)
 * para que un catálogo filtrado se pueda compartir o guardar.
 */
export function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const categories = useCategories()
  const materials = useMaterials()

  const categorySlug = params.get('categoria') ?? ''
  const materialId = Number(params.get('material')) || undefined
  const searchTerm = params.get('q') ?? ''
  const featuredOnly = params.get('destacados') === '1'
  const page = Math.max(1, Number(params.get('pagina')) || 1)

  const category = categories.data?.find((c) => c.slug === categorySlug)
  const waitingForCategory = categorySlug !== '' && categories.isPending

  useDocumentTitle(category?.name ?? 'Catálogo')

  const products = useProducts({
    pageNumber: page,
    pageSize: PAGE_SIZE,
    categoryId: category?.id,
    materialId,
    searchTerm: searchTerm || undefined,
    isFeatured: featuredOnly || undefined,
  })

  // El borrador del buscador se resincroniza si la búsqueda cambia desde fuera (enlaces, "Quitar filtros").
  const [searchDraft, setSearchDraft] = useState(searchTerm)
  const [syncedSearch, setSyncedSearch] = useState(searchTerm)
  if (syncedSearch !== searchTerm) {
    setSyncedSearch(searchTerm)
    setSearchDraft(searchTerm)
  }

  const updateParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (!('pagina' in changes)) next.delete('pagina')
    setParams(next)
  }

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    updateParams({ q: searchDraft.trim() || null })
  }

  const goToPage = (nextPage: number) => {
    updateParams({ pagina: nextPage > 1 ? String(nextPage) : null })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hasFilters = Boolean(categorySlug || materialId || searchTerm || featuredOnly)
  const unknownCategory = categorySlug !== '' && categories.isSuccess && !category

  return (
    <div className="container catalog">
      <header className="page-header">
        <p className="eyebrow">Catálogo</p>
        <h1 className="page-title">{category?.name ?? (featuredOnly ? 'Piezas destacadas' : 'Todas las piezas')}</h1>
        {category?.description && <p className="page-lead">{category.description}</p>}
      </header>

      <div className="catalog__layout">
        <aside className="filters" aria-label="Filtros">
          <form className="search" role="search" onSubmit={handleSearch}>
            <label htmlFor="catalog-search" className="visually-hidden">
              Buscar piezas
            </label>
            <input
              id="catalog-search"
              className="input"
              type="search"
              placeholder="Buscar piezas…"
              value={searchDraft}
              maxLength={100}
              onChange={(e) => setSearchDraft(e.target.value)}
            />
            <button type="submit" className="btn btn--small">
              Buscar
            </button>
          </form>

          <div className="filters__group">
            <h2 className="filters__title">Categorías</h2>
            <ul className="filters__list">
              <li>
                <button
                  type="button"
                  className="filters__option"
                  aria-pressed={!categorySlug}
                  onClick={() => updateParams({ categoria: null })}
                >
                  Todas
                </button>
              </li>
              {categories.data?.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="filters__option"
                    aria-pressed={c.slug === categorySlug}
                    onClick={() => updateParams({ categoria: c.slug })}
                  >
                    {c.name}
                    <span className="filters__count">{c.productCount}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {materials.data && materials.data.length > 0 && (
            <div className="filters__group">
              <h2 className="filters__title">Material</h2>
              <div className="chips">
                {materials.data.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="chip"
                    aria-pressed={m.id === materialId}
                    onClick={() => updateParams({ material: m.id === materialId ? null : String(m.id) })}
                  >
                    {m.colorHex && <span className="swatch" style={{ background: m.colorHex }} aria-hidden="true" />}
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="checkbox">
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={(e) => updateParams({ destacados: e.target.checked ? '1' : null })}
            />
            <span>Solo destacados</span>
          </label>

          {hasFilters && (
            <button type="button" className="btn btn--ghost btn--small" onClick={() => setParams(new URLSearchParams())}>
              Quitar filtros
            </button>
          )}
        </aside>

        <section className="catalog__results" aria-live="polite" aria-busy={products.isFetching}>
          {unknownCategory ? (
            <EmptyState title="Esa categoría no existe">Prueba con otra categoría del menú.</EmptyState>
          ) : waitingForCategory || products.isPending ? (
            <LoadingState />
          ) : products.isError ? (
            <ErrorState error={products.error} onRetry={() => products.refetch()} />
          ) : products.data.items.length === 0 ? (
            <EmptyState
              title="No hay piezas que coincidan"
              action={
                hasFilters && (
                  <button type="button" className="btn btn--secondary" onClick={() => setParams(new URLSearchParams())}>
                    Ver todo el catálogo
                  </button>
                )
              }
            >
              Prueba con otros filtros o una búsqueda diferente.
            </EmptyState>
          ) : (
            <>
              <p className="catalog__count">
                {products.data.totalCount} {products.data.totalCount === 1 ? 'pieza' : 'piezas'}
              </p>
              <ProductGrid products={products.data.items} />
              <Pagination page={products.data.pageNumber} totalPages={products.data.totalPages} onChange={goToPage} />
            </>
          )}
        </section>
      </div>
    </div>
  )
}
