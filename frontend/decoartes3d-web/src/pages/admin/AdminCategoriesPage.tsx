import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { categoriesApi } from '../../api/endpoints'
import { CheckboxField, TextAreaField, TextField } from '../../components/FormField'
import { Alert, EmptyState, ErrorState, LoadingState } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { queryKeys } from '../../hooks/queries'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type { Category, CategoryWriteRequest } from '../../types/api'

const EMPTY: CategoryWriteRequest = { name: '', description: '', imageUrl: '', isActive: true, sortOrder: 0 }

export function AdminCategoriesPage() {
  useDocumentTitle('Categorías')
  const queryClient = useQueryClient()
  const { notify } = useToast()
  const categories = useQuery({ queryKey: queryKeys.allCategories, queryFn: categoriesApi.all })

  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryWriteRequest>(EMPTY)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
  }

  const save = useMutation({
    mutationFn: (request: CategoryWriteRequest) => (editing ? categoriesApi.update(editing.id, request) : categoriesApi.create(request)),
    onSuccess: (saved) => {
      invalidate()
      notify(editing ? 'Categoría actualizada' : `Categoría «${saved.name}» creada`)
      startCreate()
    },
  })

  const remove = useMutation({
    mutationFn: (category: Category) => categoriesApi.remove(category.id),
    onSuccess: (_, category) => {
      invalidate()
      notify(`Categoría «${category.name}» eliminada`)
      if (editing?.id === category.id) startCreate()
    },
  })

  function startCreate() {
    setEditing(null)
    setForm(EMPTY)
    save.reset()
  }

  const startEdit = (category: Category) => {
    setEditing(category)
    setForm({
      name: category.name,
      description: category.description ?? '',
      imageUrl: category.imageUrl ?? '',
      isActive: category.isActive,
      sortOrder: category.sortOrder,
    })
    save.reset()
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate({ ...form, description: form.description?.trim() || null, imageUrl: form.imageUrl?.trim() || null })
  }

  const handleDelete = (category: Category) => {
    if (window.confirm(`¿Eliminar la categoría «${category.name}»?`)) remove.mutate(category)
  }

  const fieldError = (field: string) => (save.error instanceof ApiError ? save.error.fieldError(field) : undefined)

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">Categorías</h1>
      </header>

      {remove.isError && <Alert>{remove.error.message}</Alert>}

      <div className="admin-columns admin-columns--aside">
        <section>
          {categories.isPending ? (
            <LoadingState />
          ) : categories.isError ? (
            <ErrorState error={categories.error} onRetry={() => categories.refetch()} />
          ) : categories.data.length === 0 ? (
            <EmptyState title="Aún no hay categorías">Crea la primera con el formulario.</EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col" className="num">Orden</th>
                    <th scope="col" className="num">Productos</th>
                    <th scope="col">Estado</th>
                    <th scope="col">
                      <span className="visually-hidden">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.data.map((category) => (
                    <tr key={category.id} className={editing?.id === category.id ? 'is-selected' : undefined}>
                      <td>
                        {category.name}
                        <span className="table__sub">/{category.slug}</span>
                      </td>
                      <td className="num">{category.sortOrder}</td>
                      <td className="num">{category.productCount}</td>
                      <td>
                        <span className={`pill ${category.isActive ? 'pill--on' : 'pill--off'}`}>{category.isActive ? 'Activa' : 'Oculta'}</span>
                      </td>
                      <td className="table__actions">
                        <button type="button" className="link-button" onClick={() => startEdit(category)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="link-button link-button--danger"
                          onClick={() => handleDelete(category)}
                          disabled={remove.isPending || category.productCount > 0}
                          title={category.productCount > 0 ? 'Tiene productos: desactívala o mueve sus productos' : undefined}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <form className="panel" onSubmit={handleSubmit}>
          <h2 className="panel__title">{editing ? `Editar «${editing.name}»` : 'Nueva categoría'}</h2>
          {save.isError && !fieldError('name') && <Alert>{save.error.message}</Alert>}
          <TextField label="Nombre" required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={fieldError('name')} />
          <TextAreaField label="Descripción" rows={3} maxLength={1000} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} error={fieldError('description')} />
          <TextField label="URL de imagen" type="url" maxLength={500} value={form.imageUrl ?? ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} error={fieldError('imageUrl')} />
          <TextField label="Orden" type="number" min={0} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })} error={fieldError('sortOrder')} />
          <CheckboxField label="Visible en la tienda" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          <div className="panel__actions">
            {editing && (
              <button type="button" className="btn btn--ghost" onClick={startCreate}>
                Cancelar
              </button>
            )}
            <button type="submit" className="btn" disabled={save.isPending}>
              {save.isPending ? 'Guardando…' : editing ? 'Guardar' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
