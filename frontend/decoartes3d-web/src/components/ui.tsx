import type { ReactNode } from 'react'
import { ApiError } from '../api/client'
import type { OrderStatus } from '../types/api'
import { ORDER_STATUS_LABELS } from '../utils/format'

export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <span className="spinner" role="status">
      <span className="visually-hidden">{label}</span>
    </span>
  )
}

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="state">
      <Spinner label={label} />
      <p className="state__text">{label}</p>
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Se ha producido un error inesperado.'
  const notFound = error instanceof ApiError && error.status === 404

  return (
    <div className="state state--error" role="alert">
      <p className="state__title">{notFound ? 'No lo hemos encontrado' : 'Algo ha fallado'}</p>
      <p className="state__text">{message}</p>
      {onRetry && !notFound && (
        <button type="button" className="btn btn--secondary" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="state">
      <p className="state__title">{title}</p>
      {children && <p className="state__text">{children}</p>}
      {action}
    </div>
  )
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`badge badge--${status.toLowerCase()}`}>{ORDER_STATUS_LABELS[status]}</span>
}

export function Alert({ tone = 'error', children }: { tone?: 'error' | 'info' | 'success'; children: ReactNode }) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}
