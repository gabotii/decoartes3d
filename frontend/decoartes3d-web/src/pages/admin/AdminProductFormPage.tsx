import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError } from '../../api/client'
import { categoriesApi, materialsApi, productsApi } from '../../api/endpoints'
import { CheckboxField, SelectField, TextAreaField, TextField } from '../../components/FormField'
import { ProductImage } from '../../components/ProductVisual'
import { Alert, ErrorState, LoadingState } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { queryKeys } from '../../hooks/queries'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type { ProductDetail, ProductWriteRequest } from '../../types/api'

// Los inputs trabajan con texto; se convierten a número al enviar.
interface FormState {
  name: string
  shortDescription: string
  description: string
  price: string
  stockQuantity: string
  mainImageUrl: string
  width: string
  height: string
  depth: string
  weightGrams: string
  sortOrder: string
  categoryId: string
  materialId: string
  isActive: boolean
  isFeatured: boolean
}

const EMPTY: FormState = {
  name: '',
  shortDescription: '',
  description: '',
  price: '',
  stockQuantity: '0',
  mainImageUrl: '',
  width: '',
  height: '',
  depth: '',
  weightGrams: '',
  sortOrder: '0',
  categoryId: '',
  materialId: '',
  isActive: true,
  isFeatured: false,
}

const str = (value: number | null) => (value === null ? '' : String(value))

function fromProduct(p: ProductDetail): FormState {
  return {
    name: p.name,
    shortDescription: p.shortDescription ?? '',
    description: p.description ?? '',
    price: String(p.price),
    stockQuantity: String(p.stockQuantity),
    mainImageUrl: p.mainImageUrl ?? '',
    width: str(p.width),
    height: str(p.height),
    depth: str(p.depth),
    weightGrams: str(p.weightGrams),
    sortOrder: String(p.sortOrder),
    categoryId: String(p.categoryId),
    materialId: str(p.materialId),
    isActive: p.isActive,
    isFeatured: p.isFeatured,
  }
}

const numberOrNull = (value: string) => (value.trim() === '' ? null : Number(value.replace(',', '.')))
const textOrNull = (value: string) => value.trim() || null

function toRequest(form: FormState): ProductWriteRequest {
  return {
    name: form.name.trim(),
    shortDescription: textOrNull(form.shortDescription),
    description: textOrNull(form.description),
    price: Number(form.price.replace(',', '.')),
    stockQuantity: Number(form.stockQuantity),
    mainImageUrl: textOrNull(form.mainImageUrl),
    width: numberOrNull(form.width),
    height: numberOrNull(form.height),
    depth: numberOrNull(form.depth),
    weightGrams: numberOrNull(form.weightGrams),
    sortOrder: Number(form.sortOrder) || 0,
    categoryId: Number(form.categoryId),
    materialId: form.materialId ? Number(form.materialId) : null,
    isActive: form.isActive,
    isFeatured: form.isFeatured,
  }
}

export function AdminProductFormPage() {
  const { id: idParam } = useParams()
  const isNew = idParam === 'nuevo'
  const id = Number(idParam)

  const product = useQuery({
    queryKey: queryKeys.productById(id),
    queryFn: () => productsApi.byId(id),
    enabled: !isNew && id > 0,
  })

  if (!isNew && product.isPending) return <LoadingState />
  if (!isNew && product.isError) return <ErrorState error={product.error} onRetry={() => product.refetch()} />

  // key: al pasar de un producto a otro el formulario se reinicia con sus datos.
  return <ProductForm key={idParam} product={isNew ? null : product.data!} />
}

function ProductForm({ product }: { product: ProductDetail | null }) {
  useDocumentTitle(product ? `Editar ${product.name}` : 'Nuevo producto')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useToast()
  const [form, setForm] = useState<FormState>(product ? fromProduct(product) : EMPTY)

  const categories = useQuery({ queryKey: queryKeys.allCategories, queryFn: categoriesApi.all })
  const materials = useQuery({ queryKey: queryKeys.allMaterials, queryFn: materialsApi.all })

  const save = useMutation({
    mutationFn: (request: ProductWriteRequest) => (product ? productsApi.update(product.id, request) : productsApi.create(request)),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      notify(product ? 'Cambios guardados' : `«${saved.name}» creado`)
      navigate('/admin/productos')
    },
  })

  const error = save.error instanceof ApiError ? save.error : null
  const fieldError = (field: keyof ProductWriteRequest) => error?.fieldError(field)

  const set = (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target
    const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate(toRequest(form))
  }

  return (
    <div className="admin-page">
      <Link to="/admin/productos" className="link-arrow">
        ← Productos
      </Link>
      <header className="admin-page__header">
        <div>
          <h1 className="admin-page__title">{product ? product.name : 'Nuevo producto'}</h1>
          {product && (
            <p className="muted">
              /producto/{product.slug}
              {product.isActive && (
                <>
                  {' · '}
                  <Link to={`/producto/${product.slug}`} target="_blank" rel="noreferrer">
                    Ver en la tienda ↗
                  </Link>
                </>
              )}
            </p>
          )}
        </div>
      </header>

      <form className="admin-form" onSubmit={handleSubmit}>
        {save.isError && <Alert>{save.error.message}</Alert>}

        <div className="admin-columns admin-columns--form">
          <div className="stack">
            <section className="panel">
              <h2 className="panel__title">Información</h2>
              <TextField label="Nombre" required maxLength={200} value={form.name} onChange={set('name')} error={fieldError('name')} hint="El slug de la URL se genera a partir del nombre." />
              <TextField label="Resumen" maxLength={500} value={form.shortDescription} onChange={set('shortDescription')} error={fieldError('shortDescription')} hint="Se muestra en las tarjetas del catálogo." />
              <TextAreaField label="Descripción" rows={6} maxLength={4000} value={form.description} onChange={set('description')} error={fieldError('description')} hint="Separa los párrafos con una línea en blanco." />
            </section>

            <section className="panel">
              <h2 className="panel__title">Medidas</h2>
              <div className="form-grid form-grid--4">
                <TextField label="Ancho (cm)" inputMode="decimal" pattern="\d+([.,]\d{1,2})?" title="Número con hasta 2 decimales, p. ej. 24,95" value={form.width} onChange={set('width')} error={fieldError('width')} />
                <TextField label="Alto (cm)" inputMode="decimal" pattern="\d+([.,]\d{1,2})?" title="Número con hasta 2 decimales, p. ej. 24,95" value={form.height} onChange={set('height')} error={fieldError('height')} />
                <TextField label="Fondo (cm)" inputMode="decimal" pattern="\d+([.,]\d{1,2})?" title="Número con hasta 2 decimales, p. ej. 24,95" value={form.depth} onChange={set('depth')} error={fieldError('depth')} />
                <TextField label="Peso (g)" inputMode="decimal" pattern="\d+([.,]\d{1,2})?" title="Número con hasta 2 decimales, p. ej. 24,95" value={form.weightGrams} onChange={set('weightGrams')} error={fieldError('weightGrams')} />
              </div>
            </section>
          </div>

          <div className="stack">
            <section className="panel">
              <h2 className="panel__title">Venta</h2>
              <div className="form-grid">
                <TextField label="Precio (€)" required inputMode="decimal" pattern="\d+([.,]\d{1,2})?" title="Número con hasta 2 decimales, p. ej. 24,95" value={form.price} onChange={set('price')} error={fieldError('price')} />
                <TextField label="Stock" required type="number" min={0} step={1} value={form.stockQuantity} onChange={set('stockQuantity')} error={fieldError('stockQuantity')} />
              </div>
              <CheckboxField label="Visible en la tienda" checked={form.isActive} onChange={set('isActive')} />
              <CheckboxField label="Destacado en portada" checked={form.isFeatured} onChange={set('isFeatured')} />
              <TextField label="Orden" type="number" min={0} step={1} value={form.sortOrder} onChange={set('sortOrder')} error={fieldError('sortOrder')} hint="Menor número = aparece antes." />
            </section>

            <section className="panel">
              <h2 className="panel__title">Clasificación</h2>
              <SelectField label="Categoría" required value={form.categoryId} onChange={set('categoryId')} error={fieldError('categoryId')}>
                <option value="">Elige una categoría…</option>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {!c.isActive && ' (inactiva)'}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Material" value={form.materialId} onChange={set('materialId')} error={fieldError('materialId')}>
                <option value="">Sin especificar</option>
                {materials.data?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {!m.isActive && ' (inactivo)'}
                  </option>
                ))}
              </SelectField>
            </section>

            <section className="panel">
              <h2 className="panel__title">Imagen</h2>
              <TextField label="URL de la imagen principal" type="url" maxLength={500} placeholder="https://…" value={form.mainImageUrl} onChange={set('mainImageUrl')} error={fieldError('mainImageUrl')} hint="Sin imagen se muestra una ilustración generada." />
              <ProductImage src={form.mainImageUrl.trim() || null} alt="Vista previa" seed={product?.slug ?? (form.name || 'nuevo')} className="admin-form__preview" />
            </section>
          </div>
        </div>

        <div className="admin-form__actions">
          <Link to="/admin/productos" className="btn btn--ghost">
            Cancelar
          </Link>
          <button type="submit" className="btn" disabled={save.isPending}>
            {save.isPending ? 'Guardando…' : product ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </form>
    </div>
  )
}
