import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { categoriesApi, productsApi } from '../../api/endpoints'
import { Pagination } from '../../components/Pagination'
import { ProductImage } from '../../components/ProductVisual'
import { Alert, EmptyState, ErrorState, LoadingState } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { queryKeys } from '../../hooks/queries'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type { ProductQuery, ProductSummary } from '../../types/api'
import { formatPrice } from '../../utils/format'

const PAGE_SIZE = 20

export function AdminProductsPage() {
  useDocumentTitle('Productos')
  const [params, setParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { notify } = useToast()
  const categories = useQuery({ queryKey: queryKeys.allCategories, queryFn: categoriesApi.all })

  const searchTerm = params.get('q') ?? ''
  const categoryId = Number(params.get('categoria')) || undefined
  const activeParam = params.get('activo')
  const page = Math.max(1, Number(params.get('pagina')) || 1)
  const [searchDraft, setSearchDraft] = useState(searchTerm)

  const query: ProductQuery = {
    pageNumber: page,
    pageSize: PAGE_SIZE,
    searchTerm: searchTerm || undefined,
    categoryId,
    isActive: activeParam === null ? undefined : activeParam === '1',
  }

  const products = useQuery({
    queryKey: ['admin', 'products', 'list', query],
    queryFn: () => productsApi.list(query),
    placeholderData: keepPreviousData,
  })

  const remove = useMutation({
    mutationFn: (product: ProductSummary) => productsApi.remove(product.id),
    onSuccess: (_, product) => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      notify(`«${product.name}» eliminado`)
    },
  })

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'pagina') next.delete('pagina')
    setParams(next)
  }

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    setParam('q', searchDraft.trim() || null)
  }

  const handleDelete = (product: ProductSummary) => {
    if (window.confirm(`¿Eliminar «${product.name}»? Esta acción no se puede deshacer.`)) remove.mutate(product)
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">Productos</h1>
        <Link to="/admin/productos/nuevo" className="btn">
          + Nuevo producto
        </Link>
      </header>

      <div className="toolbar">
        <form className="search" role="search" onSubmit={handleSearch}>
          <label htmlFor="admin-product-search" className="visually-hidden">
            Buscar productos
          </label>
          <input id="admin-product-search" className="input" type="search" placeholder="Buscar por nombre…" value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} />
          <button type="submit" className="btn btn--secondary btn--small">
            Buscar
          </button>
        </form>
        <select className="input input--select" aria-label="Filtrar por categoría" value={categoryId ?? ''} onChange={(e) => setParam('categoria', e.target.value || null)}>
          <option value="">Todas las categorías</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className="input input--select" aria-label="Filtrar por visibilidad" value={activeParam ?? ''} onChange={(e) => setParam('activo', e.target.value || null)}>
          <option value="">Activos e inactivos</option>
          <option value="1">Solo activos</option>
          <option value="0">Solo inactivos</option>
        </select>
      </div>

      {remove.isError && <Alert>{remove.error.message}</Alert>}

      {products.isPending ? (
        <LoadingState />
      ) : products.isError ? (
        <ErrorState error={products.error} onRetry={() => products.refetch()} />
      ) : products.data.items.length === 0 ? (
        <EmptyState title="No hay productos con estos filtros" />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col">Categoría</th>
                  <th scope="col" className="num">Precio</th>
                  <th scope="col" className="num">Stock</th>
                  <th scope="col">Estado</th>
                  <th scope="col">
                    <span className="visually-hidden">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.data.items.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="table__product">
                        <ProductImage src={product.mainImageUrl} alt="" seed={product.slug} className="table__thumb" />
                        <Link to={`/admin/productos/${product.id}`} className="table__link">
                          {product.name}
                        </Link>
                      </div>
                    </td>
                    <td>{product.categoryName}</td>
                    <td className="num">{formatPrice(product.price)}</td>
                    <td className={`num ${product.stockQuantity <= 5 ? 'text-warning' : ''}`}>{product.stockQuantity}</td>
                    <td>
                      <span className={`pill ${product.isActive ? 'pill--on' : 'pill--off'}`}>{product.isActive ? 'Activo' : 'Oculto'}</span>
                      {product.isFeatured && <span className="pill pill--accent">Destacado</span>}
                    </td>
                    <td className="table__actions">
                      <Link to={`/admin/productos/${product.id}`} className="link-button">
                        Editar
                      </Link>
                      <button type="button" className="link-button link-button--danger" onClick={() => handleDelete(product)} disabled={remove.isPending}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={products.data.pageNumber} totalPages={products.data.totalPages} onChange={(p) => setParam('pagina', p > 1 ? String(p) : null)} />
        </>
      )}
    </div>
  )
}
