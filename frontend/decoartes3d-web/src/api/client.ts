import type { ProblemDetails } from '../types/api'

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly title: string
  readonly fieldErrors: Record<string, string[]>

  constructor(status: number, problem: ProblemDetails) {
    const fieldErrors = problem.errors ?? {}
    const firstFieldError = Object.values(fieldErrors)[0]?.[0]
    super(problem.detail ?? firstFieldError ?? problem.title ?? 'Se ha producido un error inesperado.')
    this.name = 'ApiError'
    this.status = status
    this.title = problem.title ?? ''
    this.fieldErrors = fieldErrors
  }

  fieldError(field: string): string | undefined {
    return this.fieldErrors[field]?.[0]
  }
}

type TokenProvider = () => string | null
type UnauthorizedHandler = () => void

let getToken: TokenProvider = () => null
let onUnauthorized: UnauthorizedHandler = () => {}

/** AuthContext registra aquí cómo obtener el token y qué hacer si caduca. */
export function configureApiAuth(tokenProvider: TokenProvider, unauthorizedHandler: UnauthorizedHandler) {
  getToken = tokenProvider
  onUnauthorized = unauthorizedHandler
}

type QueryValue = string | number | boolean | null | undefined

export function toQueryString(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, { detail: 'No se pudo conectar con el servidor. Comprueba tu conexión.' })
  }

  if (response.status === 401 && token) onUnauthorized()

  if (!response.ok) {
    const problem = await readProblem(response)
    throw new ApiError(response.status, problem)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

async function readProblem(response: Response): Promise<ProblemDetails> {
  try {
    return (await response.json()) as ProblemDetails
  } catch {
    const fallback: Record<number, string> = {
      401: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
      403: 'No tienes permiso para realizar esta acción.',
      404: 'No se ha encontrado el recurso solicitado.',
      429: 'Demasiados intentos. Espera un minuto y vuelve a probar.',
    }
    return { status: response.status, detail: fallback[response.status] ?? 'Se ha producido un error en el servidor.' }
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: (path: string) => request<void>('DELETE', path),
}
