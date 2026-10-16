import { useState } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router'
import { Logo } from '../components/Logo'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'

export function MainLayout() {
  const { user, isAdmin, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  // El menú móvil se cierra al cambiar de página (ajuste de estado durante el render, sin efecto).
  const [menuPath, setMenuPath] = useState(location.pathname)
  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname)
    setMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="site">
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <header className="site-header">
        <div className="container site-header__inner">
          <Logo />

          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="visually-hidden">Menú</span>
            <span className="menu-toggle__bar" />
            <span className="menu-toggle__bar" />
            <span className="menu-toggle__bar" />
          </button>

          <nav id="main-nav" className={`site-nav${menuOpen ? ' site-nav--open' : ''}`} aria-label="Principal">
            <NavLink to="/catalogo" className="site-nav__link">
              Catálogo
            </NavLink>
            <NavLink to="/seguimiento" className="site-nav__link">
              Seguir pedido
            </NavLink>
            {user ? (
              <>
                <NavLink to="/mi-cuenta/pedidos" className="site-nav__link">
                  Mis pedidos
                </NavLink>
                {isAdmin && (
                  <NavLink to="/admin" className="site-nav__link site-nav__link--admin">
                    Panel admin
                  </NavLink>
                )}
                <button type="button" className="site-nav__link site-nav__button" onClick={handleLogout}>
                  Salir ({user.firstName})
                </button>
              </>
            ) : (
              <NavLink to="/login" className="site-nav__link">
                Entrar
              </NavLink>
            )}
          </nav>

          <Link to="/carrito" className="cart-link" aria-label={`Carrito, ${itemCount} artículos`}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="cart-link__icon">
              <path d="M5 7h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8zM9 7V6a3 3 0 0 1 6 0v1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {itemCount > 0 && <span className="cart-link__count">{itemCount}</span>}
          </Link>
        </div>
      </header>

      <main id="contenido" className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <div>
            <Logo />
            <p className="site-footer__text">Piezas de decoración diseñadas e impresas en 3D en nuestro taller, capa a capa.</p>
          </div>
          <nav className="site-footer__nav" aria-label="Pie de página">
            <Link to="/catalogo">Catálogo</Link>
            <Link to="/seguimiento">Seguir un pedido</Link>
            <Link to="/mi-cuenta/pedidos">Mi cuenta</Link>
          </nav>
          <p className="site-footer__copy">© {new Date().getFullYear()} Decoartes3D</p>
        </div>
      </footer>
      <ScrollRestoration />
    </div>
  )
}
