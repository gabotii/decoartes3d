import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router'
import { Logo } from '../components/Logo'
import { useAuth } from '../contexts/AuthContext'

const LINKS = [
  { to: '/admin', label: 'Resumen', end: true },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/productos', label: 'Productos' },
  { to: '/admin/categorias', label: 'Categorías' },
  { to: '/admin/materiales', label: 'Materiales' },
]

export function AdminLayout() {
  const { user } = useAuth()

  return (
    <div className="admin">
      <aside className="admin__sidebar">
        <Logo to="/admin" />
        <nav className="admin__nav" aria-label="Administración">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className="admin__link">
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin__user">
          <p>{user?.firstName} {user?.lastName}</p>
          <Link to="/">← Volver a la tienda</Link>
        </div>
      </aside>
      <main className="admin__main">
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  )
}
