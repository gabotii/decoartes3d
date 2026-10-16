import { Link } from 'react-router'

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="logo" aria-label="Decoartes3D, ir al inicio">
      <svg className="logo__mark" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 5 26 10.5v11L16 27 6 21.5v-11z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M6 10.5 16 16l10-5.5M16 16v11" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <span className="logo__text">
        Decoartes<span className="logo__accent">3D</span>
      </span>
    </Link>
  )
}
