import { Link, isRouteErrorResponse, useRouteError } from 'react-router'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Página no encontrada')
  return (
    <div className="container section">
      <div className="state">
        <p className="state__code">404</p>
        <p className="state__title">Esta página no existe</p>
        <p className="state__text">Puede que el enlace esté roto o que la pieza ya no esté en el catálogo.</p>
        <Link to="/" className="btn">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

/** Última red de seguridad: errores de render no capturados en ninguna página. */
export function RouteErrorPage() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />

  return (
    <div className="container section">
      <div className="state state--error" role="alert">
        <p className="state__title">Algo ha salido mal</p>
        <p className="state__text">Se ha producido un error inesperado. Recarga la página o vuelve al inicio.</p>
        <a href="/" className="btn">
          Volver al inicio
        </a>
      </div>
    </div>
  )
}
