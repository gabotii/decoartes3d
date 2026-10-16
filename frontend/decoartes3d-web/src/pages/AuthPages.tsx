import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { TextField } from '../components/FormField'
import { Alert } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { LoginRequest, RegisterRequest } from '../types/api'

/** Destino tras autenticarse: la página que pidió login, o el panel/inicio según el rol. */
function useRedirectTarget() {
  const from = (useLocation().state as { from?: string } | null)?.from
  return (isAdmin: boolean) => from ?? (isAdmin ? '/admin' : '/')
}

export function LoginPage() {
  useDocumentTitle('Iniciar sesión')
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const target = useRedirectTarget()
  const [form, setForm] = useState<LoginRequest>({ email: '', password: '' })

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (user) => navigate(target(user.role === 'Admin'), { replace: true }),
  })

  if (isAuthenticated && mutation.isIdle) return <Navigate to="/" replace />

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    mutation.mutate(form)
  }

  return (
    <div className="container auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-card__title">Iniciar sesión</h1>
        <p className="muted">Consulta tus pedidos y compra más rápido.</p>

        {mutation.isError && <Alert>{mutation.error.message}</Alert>}

        <TextField label="Email" type="email" required autoComplete="email" autoFocus value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <TextField label="Contraseña" type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

        <button type="submit" className="btn btn--large btn--block" disabled={mutation.isPending}>
          {mutation.isPending ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="auth-card__switch">
          ¿Aún no tienes cuenta?{' '}
          <Link to="/registro" state={location.state}>
            Crear una cuenta
          </Link>
        </p>
      </form>
    </div>
  )
}

export function RegisterPage() {
  useDocumentTitle('Crear cuenta')
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const target = useRedirectTarget()
  const [form, setForm] = useState<Required<RegisterRequest>>({ email: '', password: '', firstName: '', lastName: '', phone: '' })

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: () => navigate(target(false), { replace: true }),
  })

  if (isAuthenticated && mutation.isIdle) return <Navigate to="/" replace />

  const error = mutation.error instanceof ApiError ? mutation.error : null
  const fieldError = (field: keyof RegisterRequest) => error?.fieldError(field)
  const set = (field: keyof RegisterRequest) => (e: { target: { value: string } }) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    mutation.mutate({ ...form, phone: form.phone?.trim() || null })
  }

  return (
    <div className="container auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-card__title">Crear cuenta</h1>
        <p className="muted">Guarda tus pedidos y consulta su estado en cualquier momento.</p>

        {mutation.isError && Object.keys(error?.fieldErrors ?? {}).length === 0 && <Alert>{mutation.error.message}</Alert>}

        <div className="form-grid">
          <TextField label="Nombre" required maxLength={100} autoComplete="given-name" value={form.firstName} onChange={set('firstName')} error={fieldError('firstName')} />
          <TextField label="Apellidos" required maxLength={100} autoComplete="family-name" value={form.lastName} onChange={set('lastName')} error={fieldError('lastName')} />
        </div>
        <TextField label="Email" type="email" required maxLength={256} autoComplete="email" value={form.email} onChange={set('email')} error={fieldError('email')} />
        <TextField
          label="Contraseña"
          type="password"
          required
          minLength={8}
          maxLength={100}
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={fieldError('password')}
          hint="Mínimo 8 caracteres, con mayúscula, minúscula y número."
        />
        <TextField label="Teléfono (opcional)" type="tel" maxLength={30} autoComplete="tel" value={form.phone ?? ''} onChange={set('phone')} error={fieldError('phone')} />

        <button type="submit" className="btn btn--large btn--block" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>

        <p className="auth-card__switch">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" state={location.state}>
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  )
}
