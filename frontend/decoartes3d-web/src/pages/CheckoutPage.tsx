import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { ordersApi } from '../api/endpoints'
import { TextAreaField, TextField } from '../components/FormField'
import { Alert } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { ShippingDetails } from '../types/api'
import { formatPrice } from '../utils/format'

type FormState = Record<keyof ShippingDetails, string>

export function CheckoutPage() {
  useDocumentTitle('Finalizar pedido')
  const { user } = useAuth()
  const { items, subtotal, clear } = useCart()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<FormState>({
    shippingFirstName: user?.firstName ?? '',
    shippingLastName: user?.lastName ?? '',
    shippingEmail: user?.email ?? '',
    shippingPhone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingPostalCode: '',
    shippingCountry: 'España',
    notes: '',
  })

  // Evita que, al vaciar el carrito tras el pedido, el guard de "carrito vacío" redirija a /carrito.
  const [placed, setPlaced] = useState(false)

  const createOrder = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: (order) => {
      // El stock ha cambiado y hay un pedido nuevo en "mis pedidos".
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setPlaced(true)
      clear()
      navigate(`/pedido-confirmado/${order.orderNumber}`, { replace: true, state: { order } })
    },
  })

  if (items.length === 0 && !placed) return <Navigate to="/carrito" replace />

  const error = createOrder.error instanceof ApiError ? createOrder.error : null
  const fieldError = (field: keyof FormState) => error?.fieldError(field)

  const update = (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [field]: e.target.value }))

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    createOrder.mutate({
      ...form,
      shippingPhone: form.shippingPhone.trim() || null,
      notes: form.notes.trim() || null,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    })
  }

  return (
    <div className="container checkout">
      <header className="page-header">
        <h1 className="page-title">Finalizar pedido</h1>
        {!user && (
          <p className="page-lead">
            Puedes comprar como invitado o <Link to="/login" state={{ from: '/checkout' }}>iniciar sesión</Link> para
            guardar el pedido en tu cuenta.
          </p>
        )}
      </header>

      <form className="checkout__layout" onSubmit={handleSubmit}>
        <div className="checkout__form">
          {createOrder.isError && (
            <Alert>
              {createOrder.error.message}
              {error?.status === 409 && (
                <>
                  {' '}
                  <Link to="/carrito">Revisar el carrito</Link>
                </>
              )}
            </Alert>
          )}

          <fieldset className="fieldset">
            <legend className="fieldset__legend">Contacto</legend>
            <div className="form-grid">
              <TextField label="Nombre" required maxLength={100} autoComplete="given-name" value={form.shippingFirstName} onChange={update('shippingFirstName')} error={fieldError('shippingFirstName')} />
              <TextField label="Apellidos" required maxLength={100} autoComplete="family-name" value={form.shippingLastName} onChange={update('shippingLastName')} error={fieldError('shippingLastName')} />
              <TextField label="Email" type="email" required maxLength={256} autoComplete="email" value={form.shippingEmail} onChange={update('shippingEmail')} error={fieldError('shippingEmail')} hint="Te enviaremos aquí la confirmación y el seguimiento." />
              <TextField label="Teléfono (opcional)" type="tel" maxLength={30} autoComplete="tel" value={form.shippingPhone} onChange={update('shippingPhone')} error={fieldError('shippingPhone')} />
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset__legend">Dirección de envío</legend>
            <div className="form-grid">
              <div className="form-grid__full">
                <TextField label="Dirección" required maxLength={300} autoComplete="street-address" value={form.shippingAddress} onChange={update('shippingAddress')} error={fieldError('shippingAddress')} />
              </div>
              <TextField label="Código postal" required maxLength={20} autoComplete="postal-code" value={form.shippingPostalCode} onChange={update('shippingPostalCode')} error={fieldError('shippingPostalCode')} />
              <TextField label="Ciudad" required maxLength={100} autoComplete="address-level2" value={form.shippingCity} onChange={update('shippingCity')} error={fieldError('shippingCity')} />
              <TextField label="Provincia" required maxLength={100} autoComplete="address-level1" value={form.shippingState} onChange={update('shippingState')} error={fieldError('shippingState')} />
              <TextField label="País" required maxLength={100} autoComplete="country-name" value={form.shippingCountry} onChange={update('shippingCountry')} error={fieldError('shippingCountry')} />
              <div className="form-grid__full">
                <TextAreaField label="Notas para el pedido (opcional)" maxLength={1000} rows={3} value={form.notes} onChange={update('notes')} error={fieldError('notes')} />
              </div>
            </div>
          </fieldset>
        </div>

        <aside className="summary">
          <h2 className="summary__title">Tu pedido</h2>
          <ul className="summary__items">
            {items.map((item) => (
              <li key={item.productId} className="summary__item">
                <span>
                  {item.quantity} × {item.name}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="summary__rows">
            <div className="summary__row summary__row--total">
              <dt>Total</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
          </dl>
          <p className="summary__note">IVA incluido. El pago se coordina tras confirmar el pedido.</p>
          <button type="submit" className="btn btn--large btn--block" disabled={createOrder.isPending}>
            {createOrder.isPending ? 'Enviando pedido…' : 'Confirmar pedido'}
          </button>
        </aside>
      </form>
    </div>
  )
}
