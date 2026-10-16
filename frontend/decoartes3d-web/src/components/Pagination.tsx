interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

/** Páginas visibles: primera, última y dos a cada lado de la actual, con "…" entre huecos. */
function visiblePages(page: number, totalPages: number): (number | 'gap')[] {
  const pages = new Set([1, totalPages, page - 2, page - 1, page, page + 1, page + 2])
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  const result: (number | 'gap')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('gap')
    result.push(p)
  })
  return result
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav className="pagination" aria-label="Paginación">
      <button type="button" className="pagination__btn" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        ← Anterior
      </button>
      <ol className="pagination__pages">
        {visiblePages(page, totalPages).map((p, i) =>
          p === 'gap' ? (
            <li key={`gap-${i}`} className="pagination__gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                className="pagination__btn pagination__btn--page"
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ol>
      <button type="button" className="pagination__btn" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
        Siguiente →
      </button>
    </nav>
  )
}
