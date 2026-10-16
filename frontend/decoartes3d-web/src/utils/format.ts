import type { OrderStatus } from '../types/api'

const currency = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
const date = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
const dateTime = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export const formatPrice = (value: number) => currency.format(value)
export const formatDate = (iso: string) => date.format(new Date(iso))
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  Pending: 'Pendiente',
  Confirmed: 'Confirmado',
  InProduction: 'En producción',
  Shipped: 'Enviado',
  Delivered: 'Entregado',
  Cancelled: 'Cancelado',
}

/** Mismo ciclo de vida que Order.CanTransitionTo en el backend. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['InProduction', 'Cancelled'],
  InProduction: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
}

export const ORDER_STATUS_FLOW: OrderStatus[] = ['Pending', 'Confirmed', 'InProduction', 'Shipped', 'Delivered']

export function formatDimensions(width: number | null, height: number | null, depth: number | null): string | null {
  const parts = [width, height, depth].filter((v): v is number => v !== null)
  return parts.length ? `${parts.map((v) => v.toLocaleString('es-ES')).join(' × ')} cm` : null
}

/** Igual que SlugGenerator del backend: sirve de semilla estable para las ilustraciones. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
