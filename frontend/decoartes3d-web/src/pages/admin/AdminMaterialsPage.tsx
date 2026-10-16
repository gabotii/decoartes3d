import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { materialsApi } from '../../api/endpoints'
import { CheckboxField, TextAreaField, TextField } from '../../components/FormField'
import { Alert, EmptyState, ErrorState, LoadingState } from '../../components/ui'
import { useToast } from '../../contexts/ToastContext'
import { queryKeys } from '../../hooks/queries'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type { Material, MaterialWriteRequest } from '../../types/api'

const EMPTY: MaterialWriteRequest = { name: '', description: '', colorHex: '', isActive: true }
const HEX = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i

export function AdminMaterialsPage() {
  useDocumentTitle('Materiales')
  const queryClient = useQueryClient()
  const { notify } = useToast()
  const materials = useQuery({ queryKey: queryKeys.allMaterials, queryFn: materialsApi.all })

  const [editing, setEditing] = useState<Material | null>(null)
  const [form, setForm] = useState<MaterialWriteRequest>(EMPTY)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin'] })
    queryClient.invalidateQueries({ queryKey: ['materials'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }

  const save = useMutation({
    mutationFn: (request: MaterialWriteRequest) => (editing ? materialsApi.update(editing.id, request) : materialsApi.create(request)),
    onSuccess: (saved) => {
      invalidate()
      notify(editing ? 'Material actualizado' : `Material «${saved.name}» creado`)
      startCreate()
    },
  })

  const remove = useMutation({
    mutationFn: (material: Material) => materialsApi.remove(material.id),
    onSuccess: (_, material) => {
      invalidate()
      notify(`Material «${material.name}» eliminado`)
      if (editing?.id === material.id) startCreate()
    },
  })

  function startCreate() {
    setEditing(null)
    setForm(EMPTY)
    save.reset()
  }

  const startEdit = (material: Material) => {
    setEditing(material)
    setForm({ name: material.name, description: material.description ?? '', colorHex: material.colorHex ?? '', isActive: material.isActive })
    save.reset()
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate({ ...form, description: form.description?.trim() || null, colorHex: form.colorHex?.trim() || null })
  }

  const handleDelete = (material: Material) => {
    if (window.confirm(`¿Eliminar el material «${material.name}»?`)) remove.mutate(material)
  }

  const fieldError = (field: string) => (save.error instanceof ApiError ? save.error.fieldError(field) : undefined)
  const colorValid = HEX.test(form.colorHex ?? '')

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">Materiales</h1>
      </header>

      {remove.isError && <Alert>{remove.error.message}</Alert>}

      <div className="admin-columns admin-columns--aside">
        <section>
          {materials.isPending ? (
            <LoadingState />
          ) : materials.isError ? (
            <ErrorState error={materials.error} onRetry={() => materials.refetch()} />
          ) : materials.data.length === 0 ? (
            <EmptyState title="Aún no hay materiales">Crea el primero con el formulario.</EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Material</th>
                    <th scope="col">Descripción</th>
                    <th scope="col">Estado</th>
                    <th scope="col">
                      <span className="visually-hidden">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {materials.data.map((material) => (
                    <tr key={material.id} className={editing?.id === material.id ? 'is-selected' : undefined}>
                      <td>
                        <span className="table__product">
                          <span className="swatch swatch--large" style={{ background: material.colorHex ?? 'transparent' }} aria-hidden="true" />
                          {material.name}
                        </span>
                      </td>
                      <td className="table__clamp">{material.description}</td>
                      <td>
                        <span className={`pill ${material.isActive ? 'pill--on' : 'pill--off'}`}>{material.isActive ? 'Activo' : 'Oculto'}</span>
                      </td>
                      <td className="table__actions">
                        <button type="button" className="link-button" onClick={() => startEdit(material)}>
                          Editar
                        </button>
                        <button type="button" className="link-button link-button--danger" onClick={() => handleDelete(material)} disabled={remove.isPending}>
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
          <h2 className="panel__title">{editing ? `Editar «${editing.name}»` : 'Nuevo material'}</h2>
          {save.isError && !fieldError('name') && <Alert>{save.error.message}</Alert>}
          <TextField label="Nombre" required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={fieldError('name')} />
          <TextAreaField label="Descripción" rows={3} maxLength={1000} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} error={fieldError('description')} />
          <div className="color-field">
            <TextField
              label="Color (hex)"
              placeholder="#F5F5F0"
              maxLength={7}
              pattern="#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})"
              value={form.colorHex ?? ''}
              onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
              error={fieldError('colorHex')}
            />
            <input
              type="color"
              className="color-field__picker"
              aria-label="Elegir color"
              value={colorValid && form.colorHex!.length === 7 ? form.colorHex! : '#cccccc'}
              onChange={(e) => setForm({ ...form, colorHex: e.target.value.toUpperCase() })}
            />
          </div>
          <CheckboxField label="Disponible en la tienda" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          <div className="panel__actions">
            {editing && (
              <button type="button" className="btn btn--ghost" onClick={startCreate}>
                Cancelar
              </button>
            )}
            <button type="submit" className="btn" disabled={save.isPending}>
              {save.isPending ? 'Guardando…' : editing ? 'Guardar' : 'Crear material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
