import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { ordersApi } from '../api/endpoints'
import { TextField } from '../components/FormField'
import { OrderDetailView } from '../components/OrderView'
import { ErrorState, LoadingState } from '../components/ui'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function TrackOrderPage() {
  useDocumentTitle('Seguir mi pedido')
  const [params] = useSearchParams()
  const [orderNumber, setOrderNumber] = useState(params.get('numero') ?? '')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState<{ orderNumber: string; email: string } | null>(null)

  // El email no va en la URL a propósito: no debe quedar en el historial ni en logs.
  const order = useQuery({
    queryKey: ['track', submitted],
    queryFn: () => ordersApi.track(submitted!.orderNumber, submitted!.email),
    enabled: submitted !== null,
    retry: false,
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted({ orderNumber: orderNumber.trim(), email: email.trim() })
  }

  return (
    <div className="container section track">
      <header className="page-header">
        <p className="eyebrow">Seguimiento</p>
        <h1 className="page-title">¿Dónde está mi pedido?</h1>
        <p className="page-lead">Introduce el número de pedido y el email que usaste al comprar.</p>
      </header>

      <form className="track__form panel" onSubmit={handleSubmit}>
        <TextField
          label="Número de pedido"
          placeholder="DA-260926-7KQ4ZP"
          required
          maxLength={30}
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
        />
        <TextField label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" className="btn" disabled={order.isFetching}>
          {order.isFetching ? 'Buscando…' : 'Consultar'}
        </button>
      </form>

      {submitted && (
        <div className="track__result">
          {order.isPending ? (
            <LoadingState label="Buscando tu pedido…" />
          ) : order.isError ? (
            <ErrorState error={order.error} />
          ) : (
            <OrderDetailView order={order.data} />
          )}
        </div>
      )}
    </div>
  )
}
