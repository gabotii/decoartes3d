import { useEffect } from 'react'

const SITE_NAME = 'Decoartes3D'

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} · Decoración impresa en 3D`
  }, [title])
}
